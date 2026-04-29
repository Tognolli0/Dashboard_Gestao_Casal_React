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
    public class TransacoesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly WhatsAppService _waService;
        private readonly IMemoryCache _cache;

        public TransacoesController(AppDbContext context, WhatsAppService waService, IMemoryCache cache)
        {
            _context = context;
            _waService = waService;
            _cache = cache;
        }

        [HttpGet]
        [ResponseCache(Duration = 20, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "responsavel", "mes", "ano" })]
        public async Task<ActionResult<IEnumerable<Transacao>>> GetTransacoesFiltradas(
            [FromQuery] string? responsavel,
            [FromQuery] int? mes,
            [FromQuery] int? ano)
        {
            var query = _context.Transacoes
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(responsavel))
            {
                query = query.Where(t => t.Responsavel == responsavel);
            }

            if (ano.HasValue)
            {
                query = query.Where(t => t.Data.Year == ano.Value);
            }

            if (mes.HasValue)
            {
                query = query.Where(t => t.Data.Month == mes.Value);
            }

            var transacoes = await query
                .OrderByDescending(t => t.Data)
                .ToListAsync();

            return Ok(transacoes);
        }

        [HttpGet("{responsavel}")]
        [ResponseCache(Duration = 30, Location = ResponseCacheLocation.Any, VaryByHeader = "Accept-Encoding")]
        public async Task<ActionResult<IEnumerable<Transacao>>> GetTransacoes(string responsavel, [FromQuery] int? mes, [FromQuery] int? ano)
        {
            if (mes.HasValue || ano.HasValue)
            {
                var query = _context.Transacoes
                    .AsNoTracking()
                    .Where(t => t.Responsavel == responsavel);

                if (ano.HasValue)
                {
                    query = query.Where(t => t.Data.Year == ano.Value);
                }

                if (mes.HasValue)
                {
                    query = query.Where(t => t.Data.Month == mes.Value);
                }

                var transacoesFiltradas = await query
                    .OrderByDescending(t => t.Data)
                    .ToListAsync();

                return Ok(transacoesFiltradas);
            }

            if (_cache.TryGetValue(CacheKeys.Transacoes(responsavel), out List<Transacao>? cachedTransacoes) && cachedTransacoes is not null)
            {
                return Ok(cachedTransacoes);
            }

            var transacoes = await _context.Transacoes
                .AsNoTracking()
                .Where(t => t.Responsavel == responsavel)
                .OrderByDescending(t => t.Data)
                .ToListAsync();

            _cache.Set(CacheKeys.Transacoes(responsavel), transacoes, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(45),
                SlidingExpiration = TimeSpan.FromSeconds(20)
            });

            return Ok(transacoes);
        }

        [HttpPost]
        public async Task<ActionResult<Transacao>> PostTransacao(Transacao transacao)
        {
            transacao.Id = 0;

            if (transacao.Data.Kind == DateTimeKind.Unspecified)
                transacao.Data = DateTime.SpecifyKind(transacao.Data, DateTimeKind.Utc);
            else
                transacao.Data = transacao.Data.ToUniversalTime();

            if (transacao.Tipo == "Saída")
                transacao.Valor = -Math.Abs(transacao.Valor);
            else
                transacao.Valor = Math.Abs(transacao.Valor);

            _context.Transacoes.Add(transacao);
            await _context.SaveChangesAsync();
            InvalidateDashboardCache();

            return Ok(transacao);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransacao(int id)
        {
            var transacao = await _context.Transacoes.FindAsync(id);
            if (transacao == null) return NotFound();

            _context.Transacoes.Remove(transacao);
            await _context.SaveChangesAsync();
            InvalidateDashboardCache();
            return NoContent();
        }

        [HttpGet("totais")]
        [ResponseCache(Duration = 30, Location = ResponseCacheLocation.Any)]
        public async Task<IActionResult> GetTotais()
        {
            var resumo = new
            {
                TotalMeu = await _context.Transacoes.Where(t => t.Responsavel == "Eu").SumAsync(t => t.Valor),
                TotalDela = await _context.Transacoes.Where(t => t.Responsavel == "Namorada").SumAsync(t => t.Valor)
            };

            return Ok(resumo);
        }

        [HttpPost("lote")]
        public async Task<IActionResult> PostTransacoesLote([FromBody] List<Transacao> transacoes)
        {
            if (transacoes == null || !transacoes.Any())
                return BadRequest("A lista de transações está vazia.");

            try
            {
                foreach (var transacao in transacoes)
                {
                    transacao.Id = 0;

                    if (transacao.Data.Kind == DateTimeKind.Unspecified)
                        transacao.Data = DateTime.SpecifyKind(transacao.Data, DateTimeKind.Utc);
                    else
                        transacao.Data = transacao.Data.ToUniversalTime();

                    if (transacao.Tipo == "Saída")
                        transacao.Valor = -Math.Abs(transacao.Valor);
                    else
                        transacao.Valor = Math.Abs(transacao.Valor);
                }

                _context.Transacoes.AddRange(transacoes);
                await _context.SaveChangesAsync();
                InvalidateDashboardCache();

                var entradas = transacoes.Where(t => t.Valor > 0).Sum(t => t.Valor);
                var saidas = transacoes.Where(t => t.Valor < 0).Sum(t => t.Valor);

                try
                {
                    await _waService.EnviarMensagemParaCasal(
                        $"EXTRATO IMPORTADO\n\n" +
                        $"Processamos *{transacoes.Count}* novas transações.\n" +
                        $"Ganhos: {entradas:C}\n" +
                        $"Gastos: {Math.Abs(saidas):C}");
                }
                catch
                {
                }

                return Ok(new { mensagem = $"{transacoes.Count} transações importadas!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERRO NO LOTE: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"DETALHE: {ex.InnerException.Message}");
                return StatusCode(500, $"Erro: {ex.Message}");
            }
        }

        private void InvalidateDashboardCache()
        {
            _cache.Remove(CacheKeys.DashboardResumo);
            _cache.Remove(CacheKeys.DashboardHome);
            _cache.Remove(CacheKeys.Transacoes("Eu"));
            _cache.Remove(CacheKeys.Transacoes("Namorada"));
        }
    }
}

