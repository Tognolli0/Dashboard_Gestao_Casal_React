using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;

namespace MinhaVidaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retorna tudo que o Home.razor precisa em UMA única chamada.
        /// OTIMIZADO: queries paralelas em vez de sequenciais.
        /// </summary>
        [HttpGet("resumo")]
        [ResponseCache(Duration = 30, Location = ResponseCacheLocation.Any)]
        public async Task<IActionResult> GetResumo()
        {
            // Executa todas as queries em PARALELO — reduz latência de 4x para 1x
            var taskEu = _context.Transacoes
                .AsNoTracking()
                .Where(t => t.Responsavel == "Eu")
                .Select(t => new {
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

            var taskDela = _context.Transacoes
                .AsNoTracking()
                .Where(t => t.Responsavel == "Namorada")
                .Select(t => new {
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

            var taskMetas = _context.Metas
                .AsNoTracking()
                .Select(m => new {
                    m.Id,
                    m.Titulo,
                    m.ValorObjetivo,
                    m.ValorGuardado,
                    m.Responsavel
                })
                .ToListAsync();

            var taskDesejos = _context.Desejos
                .AsNoTracking()
                .Select(d => new {
                    d.Id,
                    d.Titulo,
                    d.DataAlvo,
                    d.Icone,
                    d.Concluido
                })
                .ToListAsync();

            // Aguarda tudo em paralelo
            await Task.WhenAll(taskEu, taskDela, taskMetas, taskDesejos);

            return Ok(new
            {
                TransacoesEu = taskEu.Result,
                TransacoesDela = taskDela.Result,
                Metas = taskMetas.Result,
                Desejos = taskDesejos.Result
            });
        }
    }
}