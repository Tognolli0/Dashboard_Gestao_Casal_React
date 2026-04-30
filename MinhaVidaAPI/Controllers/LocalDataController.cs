using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Models;
using MinhaVidaAPI.Services;
using System.Text.Json;

namespace MinhaVidaAPI.Controllers;

[Route("api/local")]
[ApiController]
public class LocalDataController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;

    public LocalDataController(AppDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    [HttpGet("backup")]
    public async Task<IActionResult> ExportBackup()
    {
        var snapshot = new BackupSnapshot
        {
            GeneratedAt = DateTime.UtcNow,
            Version = 1,
            Transacoes = await _context.Transacoes.AsNoTracking().OrderBy(t => t.Id).ToListAsync(),
            Metas = await _context.Metas.AsNoTracking().OrderBy(m => m.Id).ToListAsync(),
            Desejos = await _context.Desejos.AsNoTracking().OrderBy(d => d.Id).ToListAsync(),
            ChecklistItems = await _context.ChecklistItems.AsNoTracking().OrderBy(c => c.MesReferencia).ThenBy(c => c.Ordem).ToListAsync()
        };

        var json = JsonSerializer.Serialize(snapshot, new JsonSerializerOptions
        {
            WriteIndented = true
        });

        var bytes = System.Text.Encoding.UTF8.GetBytes(json);
        var fileName = $"backup-minha-vida-{DateTime.Now:yyyy-MM-dd-HH-mm}.json";

        return File(bytes, "application/json", fileName);
    }

    [HttpPost("restore")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> ImportBackup(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("Selecione um arquivo de backup.");
        }

        BackupSnapshot? snapshot;
        await using (var stream = file.OpenReadStream())
        {
            snapshot = await JsonSerializer.DeserializeAsync<BackupSnapshot>(stream, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }

        if (snapshot == null)
        {
            return BadRequest("Arquivo de backup invalido.");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();

        _context.Transacoes.RemoveRange(_context.Transacoes);
        _context.Metas.RemoveRange(_context.Metas);
        _context.Desejos.RemoveRange(_context.Desejos);
        _context.ChecklistItems.RemoveRange(_context.ChecklistItems);
        await _context.SaveChangesAsync();

        if (snapshot.Transacoes.Count > 0)
        {
            await _context.Transacoes.AddRangeAsync(snapshot.Transacoes.Select(CloneTransacao));
        }

        if (snapshot.Metas.Count > 0)
        {
            await _context.Metas.AddRangeAsync(snapshot.Metas.Select(CloneMeta));
        }

        if (snapshot.Desejos.Count > 0)
        {
            await _context.Desejos.AddRangeAsync(snapshot.Desejos.Select(CloneDesejo));
        }

        if (snapshot.ChecklistItems.Count > 0)
        {
            await _context.ChecklistItems.AddRangeAsync(snapshot.ChecklistItems.Select(CloneChecklistItem));
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        _cache.Remove(CacheKeys.DashboardResumo);
        _cache.Remove(CacheKeys.DashboardHome);
        _cache.Remove(CacheKeys.DashboardHomeOverview);
        _cache.Remove(CacheKeys.DashboardHomeEvolution);

        return Ok(new
        {
            message = "Backup restaurado com sucesso."
        });
    }

    private static Transacao CloneTransacao(Transacao item) => new()
    {
        Descricao = item.Descricao,
        Valor = item.Valor,
        Data = item.Data,
        Responsavel = item.Responsavel,
        Categoria = item.Categoria,
        Tipo = item.Tipo,
        EhPessoal = item.EhPessoal
    };

    private static Meta CloneMeta(Meta item) => new()
    {
        Titulo = item.Titulo,
        ValorObjetivo = item.ValorObjetivo,
        ValorGuardado = item.ValorGuardado,
        Responsavel = item.Responsavel
    };

    private static Desejo CloneDesejo(Desejo item) => new()
    {
        Titulo = item.Titulo,
        DataAlvo = item.DataAlvo,
        Icone = item.Icone,
        Concluido = item.Concluido
    };

    private static ChecklistItem CloneChecklistItem(ChecklistItem item) => new()
    {
        MesReferencia = item.MesReferencia,
        Titulo = item.Titulo,
        Concluido = item.Concluido,
        Ordem = item.Ordem
    };

    private class BackupSnapshot
    {
        public int Version { get; set; }
        public DateTime GeneratedAt { get; set; }
        public List<Transacao> Transacoes { get; set; } = [];
        public List<Meta> Metas { get; set; } = [];
        public List<Desejo> Desejos { get; set; } = [];
        public List<ChecklistItem> ChecklistItems { get; set; } = [];
    }
}
