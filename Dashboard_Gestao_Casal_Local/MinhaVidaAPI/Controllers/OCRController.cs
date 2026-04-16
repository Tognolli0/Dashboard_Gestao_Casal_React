using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MinhaVidaAPI.Services;
using System;
using System.Threading.Tasks;

namespace MinhaVidaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OCRController : ControllerBase
    {
        private readonly OCRService _ocrService;

        public OCRController(OCRService ocrService)
        {
            _ocrService = ocrService;
        }

        [HttpPost("analisar")]
        public async Task<IActionResult> AnalisarComprovante(IFormFile file)
        {
            // 1. Validação do arquivo
            if (file == null || file.Length == 0)
                return BadRequest("Nenhum arquivo de imagem foi enviado.");

            // Aceita formatos comuns de imagem
            if (!file.ContentType.StartsWith("image/"))
                return BadRequest("O arquivo enviado não é uma imagem válida.");

            try
            {
                // 2. Abre o stream da imagem
                using var stream = file.OpenReadStream();

                // 3. Chama o serviço da Azure
                var textoExtraido = await _ocrService.LerTextoDaImagemAsync(stream);

                if (string.IsNullOrEmpty(textoExtraido))
                {
                    return NotFound("A Azure não conseguiu identificar nenhum texto nesta imagem.");
                }

                // 4. Retorno com propriedades em PascalCase (Maiúsculas) 
                // para casar com o GetProperty("TextoBruto") do Dashboard
                return Ok(new
                {
                    Sucesso = true,
                    TextoBruto = textoExtraido
                });
            }
            catch (Exception ex)
            {
                // Imprime o erro no console da API para debug
                Console.WriteLine($"[OCR ERROR]: {ex.Message}");

                return StatusCode(500, new
                {
                    Sucesso = false,
                    Mensagem = $"Erro interno ao processar OCR: {ex.Message}"
                });
            }
        }
    }
}