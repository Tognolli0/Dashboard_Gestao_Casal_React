using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;

namespace MinhaVidaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;

        public DashboardController(AppDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        [HttpGet("resumo")]
        [ResponseCache(Duration = 30, Location = ResponseCacheLocation.Any)]
        public async Task<IActionResult> GetResumo()
        {
            if (_cache.TryGetValue(CacheKeys.DashboardResumo, out object? cachedResumo) && cachedResumo is not null)
            {
                return Ok(cachedResumo);
            }

            var transacoesTask = _context.Transacoes
                .AsNoTracking()
                .OrderByDescending(t => t.Data)
                .Select(t => new
                {
                    t.Id,
                    t.Descricao,
                    t.Valor,
                    t.Data,
                    t.Responsavel,
                    t.Categoria,
                    t.Tipo,
                    t.EhPessoal
                })
                .ToListAsync();

            var metasTask = _context.Metas
                .AsNoTracking()
                .Select(m => new
                {
                    m.Id,
                    m.Titulo,
                    m.ValorObjetivo,
                    m.ValorGuardado,
                    m.Responsavel,
                    m.EhReservaEmergencia,
                    m.CriadaEm,
                    m.AtualizadaEm
                })
                .ToListAsync();

            var desejosTask = _context.Desejos
                .AsNoTracking()
                .OrderBy(d => d.DataAlvo)
                .Select(d => new
                {
                    d.Id,
                    d.Titulo,
                    d.DataAlvo,
                    d.Icone,
                    d.Concluido
                })
                .ToListAsync();

            await Task.WhenAll(transacoesTask, metasTask, desejosTask);

            var transacoes = transacoesTask.Result;
            var metas = metasTask.Result;
            var desejos = desejosTask.Result;

            var resumo = new
            {
                TransacoesEu = transacoes.Where(t => t.Responsavel == "Eu").ToList(),
                TransacoesDela = transacoes.Where(t => t.Responsavel == "Namorada").ToList(),
                Metas = metas,
                Desejos = desejos
            };

            _cache.Set(CacheKeys.DashboardResumo, resumo, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(45),
                SlidingExpiration = TimeSpan.FromSeconds(20)
            });

            return Ok(resumo);
        }
    }
}
