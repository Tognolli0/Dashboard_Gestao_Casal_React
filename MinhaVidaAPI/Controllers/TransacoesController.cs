using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        public TransacoesController(AppDbContext context, WhatsAppService waService)
        {
            _context = context;
            _waService = waService;
        }

        // GET: api/transacoes/{responsavel}
        [HttpGet("{responsavel}")]
        public async Task<ActionResult<IEnumerable<Transacao>>> GetTransacoes(string responsavel)
        {
            return await _context.Transacoes
                .AsNoTracking()
                .Where(t => t.Responsavel == responsavel)
                .OrderByDescending(t => t.Data)
                .ToListAsync();
        }

        // POST: api/transacoes
        [HttpPost]
        public async Task<ActionResult<Transacao>> PostTransacao(Transacao transacao)
        {
            // Garante novo ID
            transacao.Id = 0;

            // Normaliza timezone para PostgreSQL
            if (transacao.Data.Kind == DateTimeKind.Unspecified)
                transacao.Data = DateTime.SpecifyKind(transacao.Data, DateTimeKind.Utc);
            else
                transacao.Data = transacao.Data.ToUniversalTime();

            // Garante que saídas têm valor negativo e entradas positivo
            if (transacao.Tipo == "Saída")
                transacao.Valor = -Math.Abs(transacao.Valor);
            else
                transacao.Valor = Math.Abs(transacao.Valor);

            _context.Transacoes.Add(transacao);
            await _context.SaveChangesAsync();

            return Ok(transacao);
        }

        // DELETE: api/transacoes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransacao(int id)
        {
            var transacao = await _context.Transacoes.FindAsync(id);
            if (transacao == null) return NotFound();

            _context.Transacoes.Remove(transacao);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/transacoes/totais
        [HttpGet("totais")]
        public async Task<IActionResult> GetTotais()
        {
            var transacoes = await _context.Transacoes.AsNoTracking().ToListAsync();
            var resumo = new
            {
                TotalMeu = transacoes.Where(t => t.Responsavel == "Eu").Sum(t => t.Valor),
                TotalDela = transacoes.Where(t => t.Responsavel == "Namorada").Sum(t => t.Valor)
            };
            return Ok(resumo);
        }

        // POST: api/transacoes/lote
        [HttpPost("lote")]
        public async Task<IActionResult> PostTransacoesLote([FromBody] List<Transacao> transacoes)
        {
            if (transacoes == null || !transacoes.Any())
                return BadRequest("A lista de transações está vazia.");

            try
            {
                foreach (var t in transacoes)
                {
                    t.Id = 0;

                    if (t.Data.Kind == DateTimeKind.Unspecified)
                        t.Data = DateTime.SpecifyKind(t.Data, DateTimeKind.Utc);
                    else
                        t.Data = t.Data.ToUniversalTime();

                    if (t.Tipo == "Saída")
                        t.Valor = -Math.Abs(t.Valor);
                    else
                        t.Valor = Math.Abs(t.Valor);
                }

                _context.Transacoes.AddRange(transacoes);
                await _context.SaveChangesAsync();

                var entradas = transacoes.Where(t => t.Valor > 0).Sum(t => t.Valor);
                var saidas = transacoes.Where(t => t.Valor < 0).Sum(t => t.Valor);

                try
                {
                    await _waService.EnviarMensagemParaCasal(
                        $"📊 *EXTRATO IMPORTADO!*\n\n" +
                        $"Processamos *{transacoes.Count}* novas transações.\n" +
                        $"💰 Ganhos: {entradas:C}\n" +
                        $"💸 Gastos: {Math.Abs(saidas):C}");
                }
                catch { }

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
    }
}