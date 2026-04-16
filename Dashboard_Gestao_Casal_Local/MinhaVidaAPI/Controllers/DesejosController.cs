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
    public class DesejosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;
        private readonly WhatsAppService _waService;

        public DesejosController(AppDbContext context, IMemoryCache cache, WhatsAppService waService)
        {
            _context = context;
            _cache = cache;
            _waService = waService;
        }

        [HttpGet]
        [ResponseCache(Duration = 30, Location = ResponseCacheLocation.Any)]
        public async Task<ActionResult<IEnumerable<Desejo>>> GetDesejos()
        {
            return await _context.Desejos.AsNoTracking().ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Desejo>> GetDesejo(int id)
        {
            var desejo = await _context.Desejos.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
            if (desejo == null) return NotFound();
            return desejo;
        }

        [HttpPost]
        public async Task<ActionResult<Desejo>> PostDesejo(Desejo desejo)
        {
            desejo.Id = 0;

            if (desejo.DataAlvo.Kind == DateTimeKind.Unspecified)
                desejo.DataAlvo = DateTime.SpecifyKind(desejo.DataAlvo, DateTimeKind.Utc);
            else
                desejo.DataAlvo = desejo.DataAlvo.ToUniversalTime();

            _context.Desejos.Add(desejo);
            await _context.SaveChangesAsync();
            InvalidateDashboardCache();

            SendNotificationInBackground(
                $"NOVO BUCKET\n\n" +
                $"Sonho cadastrado: *{desejo.Titulo}*\n" +
                $"Data alvo: {desejo.DataAlvo:dd/MM/yyyy}\n" +
                $"Vamos realizar isso juntos.");

            return CreatedAtAction(nameof(GetDesejo), new { id = desejo.Id }, desejo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutDesejo(int id, Desejo desejo)
        {
            if (id != desejo.Id) return BadRequest();

            if (desejo.DataAlvo.Kind == DateTimeKind.Unspecified)
                desejo.DataAlvo = DateTime.SpecifyKind(desejo.DataAlvo, DateTimeKind.Utc);
            else
                desejo.DataAlvo = desejo.DataAlvo.ToUniversalTime();

            _context.Entry(desejo).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                InvalidateDashboardCache();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Desejos.Any(e => e.Id == id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDesejo(int id)
        {
            var desejo = await _context.Desejos.FindAsync(id);
            if (desejo == null) return NotFound();

            _context.Desejos.Remove(desejo);
            await _context.SaveChangesAsync();
            InvalidateDashboardCache();

            return NoContent();
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
    }
}
