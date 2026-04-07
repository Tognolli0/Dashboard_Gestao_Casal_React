using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;

namespace MinhaVidaAPI.Workers
{
    public class ResumoWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        // REMOVIDO: WhatsAppService não pode ficar aqui pois é Scoped

        public ResumoWorker(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var agora = DateTime.Now;

                // Configurado para enviar Domingo às 20h00
                if (agora.DayOfWeek == DayOfWeek.Sunday && agora.Hour == 20 && agora.Minute == 0)
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                        // BUSCANDO O SERVIÇO AQUI DENTRO (Forma correta para serviços Scoped em Workers)
                        var waService = scope.ServiceProvider.GetRequiredService<WhatsAppService>();

                        // Calcula o saldo total
                        var transacoes = await context.Transacoes.ToListAsync();
                        var saldoTotal = transacoes.Sum(t => t.Tipo == "Entrada" ? (double)t.Valor : (double)-t.Valor);

                        // Busca a meta mais próxima
                        var proximaMeta = await context.Metas.OrderBy(m => m.ValorObjetivo).FirstOrDefaultAsync();

                        string mensagem = $"📊 *RESUMO SEMANAL DO CASAL* ❤️\n\n" +
                                         $"💰 *Patrimônio:* {saldoTotal.ToString("C")}\n" +
                                         $"🎯 *Meta Ativa:* {proximaMeta?.Titulo ?? "Nenhuma"}\n" +
                                         $"🚀 _Foco total no nosso futuro!_";

                        try
                        {
                            await waService.EnviarMensagemParaCasal(mensagem);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Erro ao enviar WhatsApp: {ex.Message}");
                        }
                    }

                    await Task.Delay(61000, stoppingToken);
                }

                await Task.Delay(30000, stoppingToken);
            }
        }
    }
}