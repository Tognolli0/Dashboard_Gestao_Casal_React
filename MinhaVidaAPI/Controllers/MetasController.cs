using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Models;
using MinhaVidaAPI.Services; // Adicionado para acessar o serviço de WhatsApp

namespace MinhaVidaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MetasController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly WhatsAppService _waService; // Injeção do serviço

        public MetasController(AppDbContext context, WhatsAppService waService)
        {
            _context = context;
            _waService = waService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Meta>>> GetMetas()
        {
            return await _context.Metas.AsNoTracking().ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Meta>> PostMeta(Meta meta)
        {
            _context.Metas.Add(meta);
            await _context.SaveChangesAsync();

            // Notifica o casal que um novo plano começou!
            await _waService.EnviarMensagemParaCasal($"✨ *NOVO SONHO LANÇADO!* ✨\n\n" +
                $"Acabei de cadastrar a meta: *{meta.Titulo}* 🎯\n" +
                $"Objetivo: {meta.ValorObjetivo:C}\n" +
                $"_Bora conquistar mais essa juntos!_ ❤️");

            return Ok(meta);
        }

        // Novo método para atualizar o progresso da meta
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMeta(int id, Meta meta)
        {
            if (id != meta.Id) return BadRequest();

            _context.Entry(meta).State = EntityState.Modified;

            try
            {
                // Pegamos a versão "antiga" para comparar o progresso se necessário
                var metaAntiga = await _context.Metas.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);

                await _context.SaveChangesAsync();

                // GATILHO DE CONQUISTA: Se a meta não estava batida e agora está
                if (metaAntiga != null && meta.ValorGuardado >= meta.ValorObjetivo)
                {
                    await _waService.EnviarMensagemParaCasal($"🎊 *META ATINGIDA!* 🎊\n\n" +
                        $"Conseguimos completar o objetivo: *{meta.Titulo}*! ✅\n" +
                        $"Nosso futuro está cada vez mais sólido. Orgulho de nós! ❤️🚀");
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Metas.Any(e => e.Id == id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMeta(int id)
        {
            var meta = await _context.Metas.FindAsync(id);
            if (meta == null) return NotFound();

            _context.Metas.Remove(meta);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/metas/{id}/aporte
        [HttpPost("{id}/aporte")]
        public async Task<IActionResult> RealizarAporte(int id, [FromBody] double valorAporte)
        {
            var meta = await _context.Metas.FindAsync(id);
            if (meta == null) return NotFound();

            meta.ValorGuardado += valorAporte;
            await _context.SaveChangesAsync();

            // Notificação de progresso
            await _waService.EnviarMensagemParaCasal(
                $"💰 *NOVO APORTE!* \n\n" +
                $"Somamos *{valorAporte:C}* na meta: *{meta.Titulo}*! 🚀\n" +
                $"Total guardado: {meta.ValorGuardado:C} ({meta.Porcentagem:F1}%)"
            );

            // Se bateu a meta com esse aporte, manda a comemoração
            if (meta.ValorGuardado >= meta.ValorObjetivo)
            {
                await _waService.EnviarMensagemParaCasal($"🎊 *META ATINGIDA COM ESSE APORTE!* ✅");
            }

            return Ok(meta);
        }
    }
}