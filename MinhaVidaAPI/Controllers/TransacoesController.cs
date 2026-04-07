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
                .Where(t => t.Responsavel == responsavel)
                .OrderByDescending(t => t.Data) // Ordenar por data desc por padrão
                .ToListAsync();
        }

        // POST: api/transacoes (Lançamento individual)
        [HttpPost]
        public async Task<ActionResult<Transacao>> PostTransacao(Transacao transacao)
        {
            _context.Transacoes.Add(transacao);
            await _context.SaveChangesAsync();
            return Ok(transacao);
        }

        // DELETE: api/transacoes/{id}  ← ENDPOINT QUE ESTAVA FALTANDO
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransacao(int id)
        {
            var transacao = await _context.Transacoes.FindAsync(id);
            if (transacao == null) return NotFound();

            _context.Transacoes.Remove(transacao);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/transacoes/resumo
        [HttpGet("totais")]
        public async Task<IActionResult> GetResumo()
        {
            var transacoes = await _context.Transacoes.ToListAsync();
            var resumo = new
            {
                TotalMeu = transacoes.Where(t => t.Responsavel == "Eu").Sum(t => t.Valor),
                TotalDela = transacoes.Where(t => t.Responsavel == "Namorada").Sum(t => t.Valor)
            };
            return Ok(resumo);
        }

        // POST: api/transacoes/lote (Importação CSV)
        [HttpPost("lote")]
        public async Task<IActionResult> PostTransacoesLote([FromBody] List<Transacao> transacoes)
        {
            if (transacoes == null || !transacoes.Any())
                return BadRequest("A lista de transações está vazia.");

            try
            {
                foreach (var t in transacoes) t.Id = 0; // Força novo ID

                _context.Transacoes.AddRange(transacoes);
                await _context.SaveChangesAsync();

                var entradas = transacoes.Where(t => t.Valor > 0).Sum(t => t.Valor);
                var saidas = transacoes.Where(t => t.Valor < 0).Sum(t => t.Valor);

                await _waService.EnviarMensagemParaCasal(
                    $"📊 *EXTRATO IMPORTADO!*\n\n" +
                    $"Processamos *{transacoes.Count}* novas transações no Dashboard.\n" +
                    $"💰 Ganhos: {entradas:C}\n" +
                    $"💸 Gastos: {Math.Abs(saidas):C}"
                );

                return Ok(new { mensagem = $"{transacoes.Count} transações importadas com sucesso!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERRO NO LOTE: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"DETALHE: {ex.InnerException.Message}");

                return StatusCode(500, $"Erro no banco de dados: {ex.Message}");
            }
        }
    }
}