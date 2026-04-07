using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data; // Ajuste para o namespace do seu AppDbContext
using MinhaVidaAPI.Models; // Ajuste para o namespace do seu Model Desejo

namespace MinhaVidaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DesejosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DesejosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/desejos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Desejo>>> GetDesejos()
        {
            return await _context.Desejos.AsNoTracking().ToListAsync();
        }

        // GET: api/desejos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Desejo>> GetDesejo(int id)
        {
            var desejo = await _context.Desejos.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);

            if (desejo == null) return NotFound();

            return desejo;
        }

        // POST: api/desejos
        [HttpPost]
        public async Task<ActionResult<Desejo>> PostDesejo(Desejo desejo)
        {
            _context.Desejos.Add(desejo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDesejo), new { id = desejo.Id }, desejo);
        }

        // DELETE: api/desejos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDesejo(int id)
        {
            var desejo = await _context.Desejos.FindAsync(id);
            if (desejo == null) return NotFound();

            _context.Desejos.Remove(desejo);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/desejos/5 (Para marcar como concluído)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDesejo(int id, Desejo desejo)
        {
            if (id != desejo.Id) return BadRequest();

            _context.Entry(desejo).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Desejos.Any(e => e.Id == id)) return NotFound();
                else throw;
            }

            return NoContent();
        }
    }
}