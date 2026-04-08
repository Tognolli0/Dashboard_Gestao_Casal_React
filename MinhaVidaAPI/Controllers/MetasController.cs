using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Models;
using MinhaVidaAPI.Services;

namespace MinhaVidaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MetasController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly WhatsAppService _waService;

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

        // POST: cria uma nova meta — CORRIGIDO: era Update, agora é Add
        [HttpPost]
        public async Task<ActionResult<Meta>> PostMeta(Meta meta)
        {
            // Garante que o ID é 0 para que o banco gere um novo
            meta.Id = 0;

            _context.Metas.Add(meta);
            await _context.SaveChangesAsync();

            try
            {
                await _waService.EnviarMensagemParaCasal(
                    $"✨ *NOVO SONHO LANÇADO!* ✨\n\n" +
                    $"Meta cadastrada: *{meta.Titulo}* 🎯\n" +
                    $"Objetivo: {meta.ValorObjetivo:C}\n" +
                    $"_Bora conquistar mais essa juntos!_ ❤️");
            }
            catch
            {
                // WhatsApp nunca deve derrubar o endpoint principal
            }

            return CreatedAtAction(nameof(GetMeta), new { id = meta.Id }, meta);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Meta>> GetMeta(int id)
        {
            var meta = await _context.Metas.FindAsync(id);
            if (meta == null) return NotFound();
            return meta;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMeta(int id, Meta meta)
        {
            if (id != meta.Id) return BadRequest();

            _context.Entry(meta).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();

                if (meta.ValorGuardado >= meta.ValorObjetivo)
                {
                    try
                    {
                        await _waService.EnviarMensagemParaCasal(
                            $"🎊 *META ATINGIDA!* 🎊\n\n" +
                            $"Conseguimos completar: *{meta.Titulo}*! ✅\n" +
                            $"Orgulho de nós! ❤️🚀");
                    }
                    catch { }
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

        [HttpPost("{id}/aporte")]
        public async Task<IActionResult> RealizarAporte(int id, [FromBody] double valorAporte)
        {
            var meta = await _context.Metas.FindAsync(id);
            if (meta == null) return NotFound();

            meta.ValorGuardado += valorAporte;
            await _context.SaveChangesAsync();

            try
            {
                await _waService.EnviarMensagemParaCasal(
                    $"💰 *NOVO APORTE!*\n\n" +
                    $"Somamos *{valorAporte:C}* na meta: *{meta.Titulo}*! 🚀\n" +
                    $"Total guardado: {meta.ValorGuardado:C} ({meta.Porcentagem:F1}%)");

                if (meta.ValorGuardado >= meta.ValorObjetivo)
                    await _waService.EnviarMensagemParaCasal("🎊 *META ATINGIDA COM ESSE APORTE!* ✅");
            }
            catch { }

            return Ok(meta);
        }
    }
}