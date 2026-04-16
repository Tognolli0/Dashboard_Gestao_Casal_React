using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
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
        private readonly IMemoryCache _cache;

        public MetasController(AppDbContext context, WhatsAppService waService, IMemoryCache cache)
        {
            _context = context;
            _waService = waService;
            _cache = cache;
        }

        [HttpGet]
        [ResponseCache(Duration = 30, Location = ResponseCacheLocation.Any)]
        public async Task<ActionResult<IEnumerable<Meta>>> GetMetas()
        {
            return await _context.Metas.AsNoTracking().ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Meta>> PostMeta(Meta meta)
        {
            meta.Id = 0;
            meta.ValorGuardado = Math.Max(0, Math.Min(meta.ValorGuardado, meta.ValorObjetivo));
            meta.CriadaEm = DateTime.UtcNow;
            meta.AtualizadaEm = DateTime.UtcNow;

            _context.Metas.Add(meta);
            await _context.SaveChangesAsync();
            InvalidateDashboardCache();

            SendNotificationInBackground(BuildNovaMetaMessage(meta));

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

            var existente = await _context.Metas.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
            if (existente == null) return NotFound();

            meta.ValorGuardado = Math.Max(0, Math.Min(meta.ValorGuardado, meta.ValorObjetivo));
            meta.CriadaEm = existente.CriadaEm;
            meta.AtualizadaEm = DateTime.UtcNow;
            _context.Entry(meta).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                InvalidateDashboardCache();

                if (meta.ValorGuardado >= meta.ValorObjetivo)
                {
                    SendNotificationInBackground(BuildMetaConcluidaMessage(meta));
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Metas.Any(e => e.Id == id)) return NotFound();
                throw;
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
            InvalidateDashboardCache();

            return NoContent();
        }

        [HttpPost("{id}/aporte")]
        public async Task<IActionResult> RealizarAporte(int id, [FromBody] double valorAporte)
        {
            if (valorAporte <= 0)
            {
                return BadRequest("Informe um aporte maior que zero.");
            }

            var meta = await _context.Metas.FindAsync(id);
            if (meta == null) return NotFound();

            var valorAntes = meta.ValorGuardado;
            var faltavaAntes = Math.Max(meta.ValorObjetivo - valorAntes, 0);
            var aporteAplicado = Math.Min(valorAporte, faltavaAntes);

            if (aporteAplicado <= 0)
            {
                return BadRequest("Essa meta ja foi concluida.");
            }

            meta.ValorGuardado = Math.Min(meta.ValorGuardado + valorAporte, meta.ValorObjetivo);
            meta.AtualizadaEm = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            InvalidateDashboardCache();

            SendNotificationInBackground(BuildAporteMessage(meta, aporteAplicado));

            if (meta.ValorGuardado >= meta.ValorObjetivo)
            {
                SendNotificationInBackground(BuildMetaConcluidaMessage(meta));
            }

            return Ok(meta);
        }

        private void InvalidateDashboardCache()
        {
            _cache.Remove(CacheKeys.DashboardResumo);
        }

        private void SendNotificationInBackground(string mensagem)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _waService.EnviarMensagemParaCasal(mensagem);
                }
                catch
                {
                }
            });
        }

        private static string BuildNovaMetaMessage(Meta meta)
        {
            if (meta.EhReservaEmergencia)
            {
                return
                    "🛟 RESERVA DE EMERGÊNCIA ATIVADA!\n\n" +
                    $"Criamos a reserva: *{meta.Titulo}*\n" +
                    $"Alvo de proteção: {meta.ValorObjetivo:C}\n" +
                    "Cada aporte aqui fortalece a segurança de vocês. ❤️";
            }

            return
                "✨ NOVO SONHO LANÇADO! ✨\n\n" +
                $"Acabei de cadastrar a meta: *{meta.Titulo}* 🎯\n" +
                $"Objetivo: {meta.ValorObjetivo:C}\n" +
                "Bora conquistar mais essa juntos! ❤️";
        }

        private static string BuildAporteMessage(Meta meta, double aporteAplicado)
        {
            if (meta.EhReservaEmergencia)
            {
                return
                    "🛟 APORTE NA RESERVA!\n\n" +
                    $"Guardamos {aporteAplicado:C} na reserva *{meta.Titulo}*.\n" +
                    $"Total protegido: {meta.ValorGuardado:C} ({meta.Porcentagem:F1}%)";
            }

            return
                "💰 NOVO APORTE!\n\n" +
                $"Somamos {aporteAplicado:C} na meta: *{meta.Titulo}*! 🚀\n" +
                $"Total guardado: {meta.ValorGuardado:C} ({meta.Porcentagem:F1}%)";
        }

        private static string BuildMetaConcluidaMessage(Meta meta)
        {
            if (meta.EhReservaEmergencia)
            {
                return
                    "🛡️ RESERVA COMPLETA! 🛡️\n\n" +
                    $"A reserva *{meta.Titulo}* bateu {meta.ValorGuardado:C}.\n" +
                    "Vocês montaram uma bela rede de segurança. ❤️";
            }

            return
                $"🎉 META ATINGIDA COM ESSE APORTE! 🎉\n\n" +
                $"A meta *{meta.Titulo}* foi concluída com {meta.ValorGuardado:C}!\n" +
                "Vocês conseguiram! ❤️";
        }
    }
}
