using Microsoft.AspNetCore.Mvc;
using MinhaVidaAPI.Services;
using System.Threading.Tasks;

namespace MinhaVidaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WhatsAppController : ControllerBase
    {
        private readonly WhatsAppService _waService;

        public WhatsAppController(WhatsAppService waService)
        {
            _waService = waService;
        }

        // POST: api/whatsapp/enviar-teste
        [HttpPost("enviar-teste")]
        public async Task<IActionResult> EnviarTeste()
        {
            try
            {
                // ATUALIZADO: Agora usa o método que envia para o casal
                await _waService.EnviarMensagemParaCasal("✅ *Conexão Ativa!* O sistema do casal está configurado corretamente e pronto para as notificações. 🚀");
                return Ok(new { mensagem = "Mensagem de teste enviada para os dois celulares!" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        // POST: api/whatsapp/notificar-custom
        [HttpPost("notificar-custom")]
        public async Task<IActionResult> EnviarCustom([FromBody] string mensagem)
        {
            if (string.IsNullOrEmpty(mensagem)) return BadRequest("A mensagem não pode estar vazia.");

            try
            {
                // ATUALIZADO: Agora usa o método que envia para o casal
                await _waService.EnviarMensagemParaCasal($"🔔 *Notificação do Dashboard:* {mensagem}");
                return Ok(new { status = "Mensagem personalizada enviada para o casal!" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }
    }
}