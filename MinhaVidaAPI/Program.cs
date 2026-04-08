using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;
using MinhaVidaAPI.Workers;
using System.IO.Compression;

var builder = WebApplication.CreateBuilder(args);

// ── 1. BANCO DE DADOS ────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsql =>
    {
        // Retry automático em caso de falha transitória (Supabase pode ter spikes)
        npgsql.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);

        // Timeout de comando: 30s é suficiente para queries simples
        npgsql.CommandTimeout(30);
    });

    // Em produção, desabilita o tracking por padrão (ganho de performance)
    if (!builder.Environment.IsDevelopment())
        options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
});

// ── 2. CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("Livre", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ── 3. COMPRESSÃO ────────────────────────────────────────────────────────────
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "text/json"
    });
});

builder.Services.Configure<BrotliCompressionProviderOptions>(o =>
    o.Level = CompressionLevel.Fastest);

builder.Services.Configure<GzipCompressionProviderOptions>(o =>
    o.Level = CompressionLevel.Fastest);

// ── 4. CACHE DE RESPOSTA ─────────────────────────────────────────────────────
builder.Services.AddResponseCaching();

// ── 5. SERVIÇOS ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<WhatsAppService>();
builder.Services.AddScoped<OCRService>();
builder.Services.AddHttpClient(); // usado pelo KeepAliveWorker

// ── 6. WORKERS ───────────────────────────────────────────────────────────────
builder.Services.AddHostedService<ResumoWorker>();
builder.Services.AddHostedService<KeepAliveWorker>(); // Evita cold start do Render

// ── 7. CONTROLLERS & SWAGGER ─────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ── PIPELINE (ORDEM IMPORTA) ─────────────────────────────────────────────────

// 1. CORS sempre primeiro
app.UseCors("Livre");

// 2. Compressão antes do cache (comprime antes de cachear)
app.UseResponseCompression();

// 3. Cache de resposta
app.UseResponseCaching();

// 4. Swagger
app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Minha Vida API v1");
    c.RoutePrefix = "swagger";
});

// 5. Autorização
app.UseAuthorization();

// 6. Controllers
app.MapControllers();

// 7. Health check / keep-alive endpoint (sem banco)
app.MapGet("/", () => Results.Ok(new
{
    status = "online",
    timestamp = DateTime.UtcNow,
    message = "API Always Together 🚀"
}));

// ── MIGRATE ON STARTUP (apenas em produção) ───────────────────────────────────
if (!app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Erro ao aplicar migrations na inicialização.");
    }
}

app.Run();