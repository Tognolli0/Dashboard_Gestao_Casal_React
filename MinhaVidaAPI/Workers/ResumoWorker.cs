using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MinhaVidaAPI.Workers
{
    public class ResumoWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly WhatsAppService _waService;

        public ResumoWorker(IServiceProvider serviceProvider, WhatsAppService waService)
        {
            _serviceProvider = serviceProvider;
            _waService = waService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // O robô fica a correr enquanto a API estiver ligada
            while (!stoppingToken.IsCancellationRequested)
            {
                var agora = DateTime.Now;

                // Configurado para enviar Domingo às 20h00
                if (agora.DayOfWeek == DayOfWeek.Sunday && agora.Hour == 20 && agora.Minute == 0)
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                        // Calcula o saldo total somando Entradas e subtraindo Saídas
                        var transacoes = await context.Transacoes.ToListAsync();
                        var saldoTotal = transacoes.Sum(t => t.Tipo == "Entrada" ? (double)t.Valor : (double)-t.Valor);

                        // Adiciona o saldo fixo da reserva conjunta que definimos no Blazor
                        var saldoConsolidado = saldoTotal;

                        // Busca a meta mais próxima
                        var proximaMeta = await context.Metas.OrderBy(m => m.ValorObjetivo).FirstOrDefaultAsync();

                        string mensagem = $"📊 *RESUMO SEMANAL DO CASAL* ❤️\n\n" +
                                         $"💰 *Patrimônio:* {saldoConsolidado.ToString("C")}\n" +
                                         $"🎯 *Meta Ativa:* {proximaMeta?.Titulo ?? "Nenhuma"}\n" +
                                         $"🚀 _Foco total no nosso futuro!_";

                        try
                        {
                            // CHAMADA CORRIGIDA: Agora envia para os dois (conforme configurado no Service)
                            await _waService.EnviarMensagemParaCasal(mensagem);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Erro ao enviar WhatsApp: {ex.Message}");
                        }
                    }

                    // Espera 61 segundos para não repetir o envio no mesmo minuto
                    await Task.Delay(61000, stoppingToken);
                }

                // Verifica o relógio a cada 30 segundos
                await Task.Delay(30000, stoppingToken);
            }
        }
    }
}