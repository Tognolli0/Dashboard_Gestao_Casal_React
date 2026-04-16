using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Models;

namespace MinhaVidaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChecklistController : ControllerBase
    {
        private static readonly string[] DefaultItems =
        {
            "Pagar contas fixas",
            "Revisar cartões",
            "Aportar nas metas",
            "Fechar saldo do mês",
            "Revisar gastos excessivos"
        };

        private readonly AppDbContext _context;

        public ChecklistController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChecklistItem>>> GetChecklist([FromQuery] string? mes = null)
        {
            var mesReferencia = NormalizeMes(mes);
            await EnsureChecklistMesAsync(mesReferencia);

            var items = await _context.ChecklistItems
                .AsNoTracking()
                .Where(c => c.MesReferencia == mesReferencia)
                .OrderBy(c => c.Ordem)
                .ThenBy(c => c.Id)
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost]
        public async Task<ActionResult<ChecklistItem>> AddChecklistItem([FromBody] ChecklistItem input)
        {
            var mesReferencia = NormalizeMes(input.MesReferencia);
            await EnsureChecklistMesAsync(mesReferencia);

            var proximaOrdem = await _context.ChecklistItems
                .Where(c => c.MesReferencia == mesReferencia)
                .Select(c => (int?)c.Ordem)
                .MaxAsync() ?? -1;

            var item = new ChecklistItem
            {
                MesReferencia = mesReferencia,
                Titulo = input.Titulo.Trim(),
                Concluido = input.Concluido,
                Ordem = proximaOrdem + 1
            };

            _context.ChecklistItems.Add(item);
            await _context.SaveChangesAsync();

            return Ok(item);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ChecklistItem>> UpdateChecklistItem(int id, [FromBody] ChecklistItem input)
        {
            var item = await _context.ChecklistItems.FindAsync(id);
            if (item == null) return NotFound();

            item.Titulo = string.IsNullOrWhiteSpace(input.Titulo) ? item.Titulo : input.Titulo.Trim();
            item.Concluido = input.Concluido;
            item.Ordem = input.Ordem;

            await _context.SaveChangesAsync();

            return Ok(item);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChecklistItem(int id)
        {
            var item = await _context.ChecklistItems.FindAsync(id);
            if (item == null) return NotFound();

            _context.ChecklistItems.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("reset")]
        public async Task<IActionResult> ResetChecklist([FromQuery] string? mes = null)
        {
            var mesReferencia = NormalizeMes(mes);
            var items = await _context.ChecklistItems
                .Where(c => c.MesReferencia == mesReferencia)
                .ToListAsync();

            _context.ChecklistItems.RemoveRange(items);
            await _context.SaveChangesAsync();
            await EnsureChecklistMesAsync(mesReferencia);

            return NoContent();
        }

        private async Task EnsureChecklistMesAsync(string mesReferencia)
        {
            var exists = await _context.ChecklistItems
                .AsNoTracking()
                .AnyAsync(c => c.MesReferencia == mesReferencia);

            if (exists)
            {
                return;
            }

            var defaults = DefaultItems.Select((titulo, index) => new ChecklistItem
            {
                MesReferencia = mesReferencia,
                Titulo = titulo,
                Concluido = false,
                Ordem = index
            });

            _context.ChecklistItems.AddRange(defaults);
            await _context.SaveChangesAsync();
        }

        private static string NormalizeMes(string? mes)
        {
            if (!string.IsNullOrWhiteSpace(mes) && mes.Length >= 7)
            {
                return mes[..7];
            }

            return DateTime.Now.ToString("yyyy-MM");
        }
    }
}
