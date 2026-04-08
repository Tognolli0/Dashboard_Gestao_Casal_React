using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;

namespace MinhaVidaAPI.Workers
{
    /// <summary>
    /// Envia resumo semanal via WhatsApp todo Domingo às 20h.
    /// CORRIGIDO: usa sleep inteligente em vez de loop a cada 30s.
    /// </summary>
    public class ResumoWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ResumoWorker> _logger;

        public ResumoWorker(IServiceProvider serviceProvider, ILogger<ResumoWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var agora = DateTime.Now;
                var proximoDomingo = ProximoDisparo(agora);
                var delay = proximoDomingo - agora;

                _logger.LogInformation("[ResumoWorker] Próximo disparo em: {Tempo:dd/MM HH:mm}", proximoDomingo);

                // Dorme até o momento certo — sem ficar acordado a cada 30s
                try
                {
                    await Task.Delay(delay, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }

                await EnviarResumoAsync(stoppingToken);

                // Aguarda 61s para não disparar duas vezes no mesmo minuto
                await Task.Delay(TimeSpan.FromSeconds(61), stoppingToken);
            }
        }

        private static DateTime ProximoDisparo(DateTime agora)
        {
            // Calcula quantos dias até o próximo Domingo
            int diasAteDomingo = ((int)DayOfWeek.Sunday - (int)agora.DayOfWeek + 7) % 7;
            if (diasAteDomingo == 0 && agora.Hour >= 20) diasAteDomingo = 7; // já passou hoje

            var proximoDomingo = agora.Date.AddDays(diasAteDomingo).AddHours(20);
            return proximoDomingo;
        }

        private async Task EnviarResumoAsync(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var waService = scope.ServiceProvider.GetRequiredService<WhatsAppService>();

                var transacoes = await context.Transacoes.AsNoTracking().ToListAsync(stoppingToken);
                var saldoTotal = transacoes.Sum(t =>
                    t.Tipo == "Entrada" ? (double)t.Valor : -(double)t.Valor);

                var proximaMeta = await context.Metas
                    .AsNoTracking()
                    .OrderBy(m => m.ValorObjetivo)
                    .FirstOrDefaultAsync(stoppingToken);

                string mensagem =
                    $"📊 *RESUMO SEMANAL DO CASAL* ❤️\n\n" +
                    $"💰 *Patrimônio:* {saldoTotal:C}\n" +
                    $"🎯 *Meta Ativa:* {proximaMeta?.Titulo ?? "Nenhuma"}\n" +
                    $"🚀 _Foco total no nosso futuro!_";

                await waService.EnviarMensagemParaCasal(mensagem);
                _logger.LogInformation("[ResumoWorker] Resumo semanal enviado com sucesso.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ResumoWorker] Erro ao enviar resumo.");
            }
        }
    }
}