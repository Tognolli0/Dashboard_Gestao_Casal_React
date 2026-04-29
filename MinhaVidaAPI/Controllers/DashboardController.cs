using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;

namespace MinhaVidaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;

        public DashboardController(AppDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        [HttpGet("resumo")]
        [ResponseCache(Duration = 30, Location = ResponseCacheLocation.Any)]
        public async Task<IActionResult> GetResumo()
        {
            if (_cache.TryGetValue(CacheKeys.DashboardResumo, out object? cachedResumo) && cachedResumo is not null)
            {
                return Ok(cachedResumo);
            }

            var transacoes = await _context.Transacoes
                .AsNoTracking()
                .OrderByDescending(t => t.Data)
                .Select(t => new
                {
                    t.Id,
                    t.Descricao,
                    t.Valor,
                    t.Data,
                    t.Responsavel,
                    t.Categoria,
                    t.Tipo,
                    t.EhPessoal
                })
                .ToListAsync();

            var metas = await _context.Metas
                .AsNoTracking()
                .Select(m => new
                {
                    m.Id,
                    m.Titulo,
                    m.ValorObjetivo,
                    m.ValorGuardado,
                    m.Responsavel,
                    m.EhReservaEmergencia,
                    m.CriadaEm,
                    m.AtualizadaEm
                })
                .ToListAsync();

            var desejos = await _context.Desejos
                .AsNoTracking()
                .OrderBy(d => d.DataAlvo)
                .Select(d => new
                {
                    d.Id,
                    d.Titulo,
                    d.DataAlvo,
                    d.Icone,
                    d.Concluido
                })
                .ToListAsync();

            var resumo = new
            {
                TransacoesEu = transacoes.Where(t => t.Responsavel == "Eu").ToList(),
                TransacoesDela = transacoes.Where(t => t.Responsavel == "Namorada").ToList(),
                Metas = metas,
                Desejos = desejos
            };

            _cache.Set(CacheKeys.DashboardResumo, resumo, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(45),
                SlidingExpiration = TimeSpan.FromSeconds(20)
            });

            return Ok(resumo);
        }

        [HttpGet("home")]
        [ResponseCache(Duration = 20, Location = ResponseCacheLocation.Any)]
        public async Task<IActionResult> GetHomeResumo()
        {
            if (_cache.TryGetValue(CacheKeys.DashboardHome, out object? cachedHome) && cachedHome is not null)
            {
                return Ok(cachedHome);
            }

            var now = DateTime.Now;
            var currentMonth = now.Month;

            var metas = await _context.Metas
                .AsNoTracking()
                .Select(m => new
                {
                    m.Id,
                    m.Titulo,
                    m.ValorObjetivo,
                    m.ValorGuardado,
                    m.Responsavel,
                    m.EhReservaEmergencia,
                    m.CriadaEm,
                    m.AtualizadaEm
                })
                .ToListAsync();

            var desejos = await _context.Desejos
                .AsNoTracking()
                .OrderBy(d => d.DataAlvo)
                .Select(d => new
                {
                    d.Id,
                    d.Titulo,
                    d.DataAlvo,
                    d.Icone,
                    d.Concluido
                })
                .ToListAsync();

            var fluxoPorResponsavel = await _context.Transacoes
                .AsNoTracking()
                .GroupBy(t => t.Responsavel)
                .Select(g => new
                {
                    Responsavel = g.Key,
                    Entradas = g.Where(t => t.Tipo == "Entrada").Sum(t => (double?)t.Valor) ?? 0,
                    Saidas = g.Where(t => t.Tipo != "Entrada").Sum(t => (double?)Math.Abs(t.Valor)) ?? 0,
                    Saldo = g.Sum(t => (double?)t.Valor) ?? 0,
                })
                .ToListAsync();

            var mensalAgrupado = await _context.Transacoes
                .AsNoTracking()
                .GroupBy(t => new { Month = t.Data.Month, t.Responsavel, IsEntrada = t.Tipo == "Entrada" })
                .Select(g => new
                {
                    g.Key.Month,
                    g.Key.Responsavel,
                    g.Key.IsEntrada,
                    Total = g.Sum(t => (double?)Math.Abs(t.Valor)) ?? 0
                })
                .ToListAsync();

            var categoriasHistoricas = await _context.Transacoes
                .AsNoTracking()
                .Where(t => t.Tipo != "Entrada")
                .GroupBy(t => t.Categoria)
                .Select(g => new
                {
                    Categoria = g.Key,
                    Total = g.Sum(t => (double?)Math.Abs(t.Valor)) ?? 0
                })
                .OrderByDescending(g => g.Total)
                .Take(6)
                .ToListAsync();

            var categoriasMesAtual = await _context.Transacoes
                .AsNoTracking()
                .Where(t => t.Tipo != "Entrada" && t.Data.Month == currentMonth)
                .GroupBy(t => t.Categoria)
                .Select(g => new
                {
                    Categoria = g.Key,
                    Total = g.Sum(t => (double?)Math.Abs(t.Valor)) ?? 0
                })
                .OrderByDescending(g => g.Total)
                .ToListAsync();

            var fluxoEu = fluxoPorResponsavel.FirstOrDefault(item => item.Responsavel == "Eu");
            var fluxoDela = fluxoPorResponsavel.FirstOrDefault(item => item.Responsavel == "Namorada");

            var evolucaoMensal = Enumerable.Range(1, 12)
                .Select(month => new
                {
                    mes = GetMonthLabel(month),
                    entradas = Math.Round(mensalAgrupado.Where(item => item.Month == month && item.IsEntrada).Sum(item => item.Total), 2),
                    saidas = Math.Round(mensalAgrupado.Where(item => item.Month == month && !item.IsEntrada).Sum(item => item.Total), 2),
                    diogo = Math.Round(mensalAgrupado.Where(item => item.Month == month && item.Responsavel == "Eu").Sum(item => item.IsEntrada ? item.Total : -item.Total), 2),
                    beatriz = Math.Round(mensalAgrupado.Where(item => item.Month == month && item.Responsavel == "Namorada").Sum(item => item.IsEntrada ? item.Total : -item.Total), 2),
                })
                .Select(item => new
                {
                    item.mes,
                    item.entradas,
                    item.saidas,
                    saldo = Math.Round(item.entradas - item.saidas, 2),
                    item.diogo,
                    item.beatriz
                })
                .ToList();

            var entradasMes = evolucaoMensal[currentMonth - 1].entradas;
            var saidasMes = evolucaoMensal[currentMonth - 1].saidas;
            var saldoMes = evolucaoMensal[currentMonth - 1].saldo;
            var taxaPoupanca = entradasMes > 0
                ? (int)Math.Round((saldoMes / entradasMes) * 100, MidpointRounding.AwayFromZero)
                : 0;

            var categoriaTopMes = categoriasMesAtual.FirstOrDefault();

            var metasAtivas = metas
                .Where(meta => !meta.EhReservaEmergencia)
                .OrderByDescending(meta => meta.ValorGuardado / Math.Max(meta.ValorObjetivo, 1))
                .ToList();

            var reservaEmergencia = metas.FirstOrDefault(meta => meta.EhReservaEmergencia);
            var totalMetas = metasAtivas.Sum(meta => meta.ValorObjetivo);
            var totalGuardadoMetas = metasAtivas.Sum(meta => meta.ValorGuardado);
            var progressoMetas = totalMetas > 0
                ? (int)Math.Round((totalGuardadoMetas / totalMetas) * 100, MidpointRounding.AwayFromZero)
                : 0;
            var metasConcluidas = metasAtivas.Count(meta => meta.ValorGuardado >= meta.ValorObjetivo);
            var bucketsAbertos = desejos.Count(item => !item.Concluido);

            var scoreFinanceiro = Math.Max(0, Math.Min(100,
                45 +
                (saldoMes >= 0 ? 20 : -20) +
                (taxaPoupanca >= 20 ? 15 : taxaPoupanca > 0 ? 5 : -10) +
                (progressoMetas >= 50 ? 10 : progressoMetas > 0 ? 5 : 0) +
                ((categoriaTopMes?.Total ?? 0) > 0 && saidasMes > 0 && (categoriaTopMes!.Total / saidasMes) > 0.45 ? -10 : 10)
            ));

            var destaquePrincipal = saldoMes >= 0
                ? $"Vocês fecharam o mês com {saldoMes:C2} livres até aqui."
                : $"As saídas do mês estão {Math.Abs(saldoMes):C2} acima da sobra atual.";

            var acaoRecomendada = saldoMes < 0
                ? "Revisem a categoria mais pesada e segurem gastos variáveis nesta semana."
                : progressoMetas < 100
                    ? "Excelente momento para direcionar parte da sobra do mês para uma meta ativa."
                    : "Com metas bem encaminhadas, vale criar uma nova reserva estratégica para os próximos planos.";

            var saidasRecentes = evolucaoMensal
                .Select(item => item.saidas)
                .Where(value => value > 0)
                .TakeLast(3)
                .ToList();

            var mediaSaidasRecentes = saidasRecentes.Count > 0
                ? saidasRecentes.Average()
                : saidasMes;

            var objetivoIdealReserva = Math.Max(mediaSaidasRecentes * 6, mediaSaidasRecentes > 0 ? mediaSaidasRecentes : 0);
            var coberturaReservaMeses = mediaSaidasRecentes > 0 && reservaEmergencia is not null
                ? reservaEmergencia.ValorGuardado / mediaSaidasRecentes
                : 0;
            var faltanteReservaIdeal = Math.Max(objetivoIdealReserva - (reservaEmergencia?.ValorGuardado ?? 0), 0);

            var categoriasChart = categoriasHistoricas
                .Select((item, index) => new
                {
                    name = item.Categoria,
                    value = Math.Round(item.Total, 2),
                    color = GetChartColor(index)
                })
                .ToList();

            var mediaSaidasHistorica = evolucaoMensal
                .Where(item => item.saidas > 0)
                .Select(item => item.saidas)
                .DefaultIfEmpty(0)
                .Average();

            var categoriaPeso = saidasMes > 0 && categoriaTopMes is not null
                ? categoriaTopMes.Total / saidasMes
                : 0;

            var metasParadas = metasAtivas
                .Where(meta => meta.ValorGuardado < meta.ValorObjetivo)
                .Select(meta => new
                {
                    Meta = meta,
                    DiasParada = (int)Math.Floor((DateTime.Now - meta.AtualizadaEm).TotalDays)
                })
                .Where(item => item.DiasParada >= 45)
                .OrderByDescending(item => item.DiasParada)
                .ToList();

            var alertas = new List<object>();

            if (mediaSaidasHistorica > 0 && saidasMes > mediaSaidasHistorica * 1.2)
            {
                var excesso = saidasMes - mediaSaidasHistorica;
                alertas.Add(new
                {
                    id = "gasto-acima",
                    title = "Gasto acima do normal",
                    message = $"As saídas do mês estão {excesso:C2} acima da média recente do casal.",
                    tone = "rose"
                });
            }

            if ((categoriaTopMes?.Total ?? 0) > 0 && categoriaPeso >= 0.35)
            {
                alertas.Add(new
                {
                    id = "categoria-estourando",
                    title = "Categoria estourando",
                    message = $"{categoriaTopMes!.Categoria} já consome {(categoriaPeso * 100):F0}% das saídas do mês.",
                    tone = "amber"
                });
            }

            if (entradasMes > 0 && (saldoMes < 0 || taxaPoupanca <= 10))
            {
                alertas.Add(new
                {
                    id = "saldo-apertado",
                    title = "Saldo do mês apertando",
                    message = saldoMes < 0
                        ? $"O mês está negativo em {Math.Abs(saldoMes):C2}. Vale segurar gastos variáveis agora."
                        : $"A sobra do mês caiu para {taxaPoupanca}%, abaixo da faixa confortável.",
                    tone = saldoMes < 0 ? "rose" : "amber"
                });
            }

            if (metasParadas.Count > 0)
            {
                var metaParada = metasParadas[0];
                alertas.Add(new
                {
                    id = "meta-parada",
                    title = "Meta parada há muito tempo",
                    message = $"{metaParada.Meta.Titulo} está sem aporte há {metaParada.DiasParada} dias. Um pequeno reforço já reacende o plano.",
                    tone = "indigo"
                });
            }

            if (alertas.Count == 0)
            {
                alertas.Add(new
                {
                    id = "sem-alertas",
                    title = "Painel estável",
                    message = "Sem alertas críticos agora. O momento está bom para manter constância e reforçar metas.",
                    tone = "green"
                });
            }

            var response = new
            {
                metas = metas,
                desejos = desejos,
                reservaEmergencia,
                totais = new
                {
                    eu = Math.Round(fluxoEu?.Saldo ?? 0, 2),
                    bia = Math.Round(fluxoDela?.Saldo ?? 0, 2),
                    juntos = Math.Round((fluxoEu?.Saldo ?? 0) + (fluxoDela?.Saldo ?? 0), 2)
                },
                fluxoEu = new
                {
                    entradas = Math.Round(fluxoEu?.Entradas ?? 0, 2),
                    saidas = Math.Round(fluxoEu?.Saidas ?? 0, 2),
                    saldo = Math.Round(fluxoEu?.Saldo ?? 0, 2)
                },
                fluxoDela = new
                {
                    entradas = Math.Round(fluxoDela?.Entradas ?? 0, 2),
                    saidas = Math.Round(fluxoDela?.Saidas ?? 0, 2),
                    saldo = Math.Round(fluxoDela?.Saldo ?? 0, 2)
                },
                mesAtual = new
                {
                    entradas = Math.Round(entradasMes, 2),
                    saidas = Math.Round(saidasMes, 2),
                    saldo = Math.Round(saldoMes, 2),
                    taxaPoupanca,
                    categoriaTop = new
                    {
                        nome = categoriaTopMes?.Categoria ?? "Sem destaque",
                        total = Math.Round(categoriaTopMes?.Total ?? 0, 2)
                    }
                },
                metasResumo = new
                {
                    totalMetas = Math.Round(totalMetas, 2),
                    totalGuardado = Math.Round(totalGuardadoMetas, 2),
                    progresso = progressoMetas,
                    concluidas = metasConcluidas,
                    bucketsAbertos
                },
                scoreFinanceiro,
                destaquePrincipal,
                acaoRecomendada,
                evolucaoMensal,
                reservaPlanejamento = new
                {
                    objetivoIdeal = Math.Round(objetivoIdealReserva, 2),
                    coberturaMeses = Math.Round(coberturaReservaMeses, 1),
                    faltanteIdeal = Math.Round(faltanteReservaIdeal, 2)
                },
                categoriasChart,
                alertas = alertas.Take(4).ToList()
            };

            _cache.Set(CacheKeys.DashboardHome, response, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30),
                SlidingExpiration = TimeSpan.FromSeconds(15)
            });

            return Ok(response);
        }

        private static string GetMonthLabel(int month) => month switch
        {
            1 => "Jan",
            2 => "Fev",
            3 => "Mar",
            4 => "Abr",
            5 => "Mai",
            6 => "Jun",
            7 => "Jul",
            8 => "Ago",
            9 => "Set",
            10 => "Out",
            11 => "Nov",
            12 => "Dez",
            _ => "-"
        };

        private static string GetChartColor(int index) => index switch
        {
            0 => "#6366f1",
            1 => "#ec4899",
            2 => "#14b8a6",
            3 => "#f59e0b",
            4 => "#8b5cf6",
            5 => "#ef4444",
            _ => "#94a3b8"
        };
    }
}
