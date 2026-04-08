using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Models;

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

        [HttpGet]
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
            // Garante novo ID
            desejo.Id = 0;

            // Normaliza timezone: PostgreSQL precisa de UTC
            if (desejo.DataAlvo.Kind == DateTimeKind.Unspecified)
                desejo.DataAlvo = DateTime.SpecifyKind(desejo.DataAlvo, DateTimeKind.Utc);
            else
                desejo.DataAlvo = desejo.DataAlvo.ToUniversalTime();

            _context.Desejos.Add(desejo);
            await _context.SaveChangesAsync();

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
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Desejos.Any(e => e.Id == id)) return NotFound();
                else throw;
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

            return NoContent();
        }
    }
}