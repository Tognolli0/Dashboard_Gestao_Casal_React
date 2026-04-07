using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Models;

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

        // GET: api/dashboard/resumo
        // Retorna tudo que o Home.razor precisa em UMA única chamada
        [HttpGet("resumo")]
        public async Task<IActionResult> GetResumo()
        {
            var transacoesEu = await _context.Transacoes
                .AsNoTracking().Where(t => t.Responsavel == "Eu").ToListAsync();

            var transacoesDela = await _context.Transacoes
                .AsNoTracking().Where(t => t.Responsavel == "Namorada").ToListAsync();

            var metas = await _context.Metas.AsNoTracking().ToListAsync();

            var desejos = await _context.Desejos.AsNoTracking().ToListAsync();

            return Ok(new
            {
                TransacoesEu = transacoesEu,
                TransacoesDela = transacoesDela,
                Metas = metas,
                Desejos = desejos
            });
        }
    }
}