using System.Net.Http;

namespace MinhaVidaAPI.Workers
{
    /// <summary>
    /// Pinga a própria API a cada 10 minutos para evitar o "cold start" do Render.
    /// O Render free tier dorme após ~15min de inatividade, causando 30-60s de delay.
    /// </summary>
    public class KeepAliveWorker : BackgroundService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<KeepAliveWorker> _logger;

        public KeepAliveWorker(
            IHttpClientFactory httpClientFactory,
            IConfiguration config,
            ILogger<KeepAliveWorker> logger)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Aguarda 30s antes do primeiro ping (deixa a API subir)
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    // Usa a própria URL da API (configurada no appsettings ou variável de ambiente)
                    var baseUrl = _config["App:BaseUrl"] ?? "https://minhavidaapi.onrender.com";
                    var response = await client.GetAsync($"{baseUrl}/", stoppingToken);
                    _logger.LogInformation("[KeepAlive] Ping OK: {Status}", response.StatusCode);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("[KeepAlive] Ping falhou: {Message}", ex.Message);
                }

                // Pinga a cada 10 minutos (abaixo dos 15min do timeout do Render)
                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
            }
        }
    }
}