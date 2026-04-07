using Azure;
using Azure.AI.Vision.ImageAnalysis;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace MinhaVidaAPI.Services
{
    public class OCRService
    {

        // No OCRService.cs da API
        private readonly string endpoint = "https://ocrreservaconjunta.cognitiveservices.azure.com/"; // REMOVA A BARRA NO FINAL
        private readonly string key = ""; // Verifique se não há espaços antes ou depois

        public async Task<string> LerTextoDaImagemAsync(Stream imagemStream)
        {
            try
            {
                // O .TrimEnd('/') garante que não haja erro de URL se houver uma barra no final
                var client = new ImageAnalysisClient(new Uri(endpoint.TrimEnd('/')), new AzureKeyCredential(key));

                var result = await client.AnalyzeAsync(
                    BinaryData.FromStream(imagemStream),
                    VisualFeatures.Read);

                var linhasDeTexto = result.Value.Read.Blocks
                    .SelectMany(b => b.Lines)
                    .Select(l => l.Text);

                return string.Join("\n", linhasDeTexto);
            }
            catch (Exception ex)
            {
                // Isso vai mostrar o erro exato no console da sua API
                Console.WriteLine($"Erro Azure OCR: {ex.Message}");
                throw;
            }
        }
    }
}