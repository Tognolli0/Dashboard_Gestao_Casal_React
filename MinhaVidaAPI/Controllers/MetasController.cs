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
            if (_cache.TryGetValue(CacheKeys.Metas, out List<Meta>? cachedMetas) && cachedMetas is not null)
            {
                return Ok(cachedMetas);
            }

            var metas = await _context.Metas.AsNoTracking().ToListAsync();

            _cache.Set(CacheKeys.Metas, metas, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(45),
                SlidingExpiration = TimeSpan.FromSeconds(20)
            });

            return Ok(metas);
        }

        [HttpPost]
        public async Task<ActionResult<Meta>> PostMeta(Meta meta)
        {
            meta.Id = 0;

            _context.Metas.Add(meta);
            await _context.SaveChangesAsync();
            InvalidateDashboardCache();

            try
            {
                await _waService.EnviarMensagemParaCasal(
                    $"NOVA META\n\n" +
                    $"Meta cadastrada: *{meta.Titulo}*\n" +
                    $"Objetivo: {meta.ValorObjetivo:C}\n" +
                    $"Bora conquistar mais essa juntos.");
            }
            catch
            {
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
                InvalidateDashboardCache();

                if (meta.ValorGuardado >= meta.ValorObjetivo)
                {
                    try
                    {
                        await _waService.EnviarMensagemParaCasal(
                            $"META ATINGIDA\n\n" +
                            $"Conseguimos completar: *{meta.Titulo}*!\n" +
                            $"Orgulho de nos.");
                    }
                    catch
                    {
                    }
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
            var meta = await _context.Metas.FindAsync(id);
            if (meta == null) return NotFound();

            meta.ValorGuardado += valorAporte;
            await _context.SaveChangesAsync();
            InvalidateDashboardCache();

            try
            {
                await _waService.EnviarMensagemParaCasal(
                    $"NOVO APORTE\n\n" +
                    $"Somamos *{valorAporte:C}* na meta: *{meta.Titulo}*!\n" +
                    $"Total guardado: {meta.ValorGuardado:C} ({meta.Porcentagem:F1}%)");

                if (meta.ValorGuardado >= meta.ValorObjetivo)
                    await _waService.EnviarMensagemParaCasal("META ATINGIDA COM ESSE APORTE");
            }
            catch
            {
            }

            return Ok(meta);
        }

        private void InvalidateDashboardCache()
        {
            _cache.Remove(CacheKeys.DashboardResumo);
            _cache.Remove(CacheKeys.DashboardHome);
            _cache.Remove(CacheKeys.DashboardHomeOverview);
            _cache.Remove(CacheKeys.DashboardHomeEvolution);
            _cache.Remove(CacheKeys.Metas);
        }
    }
}
