using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;
using MinhaVidaAPI.Workers;
using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ── 1. BANCO DE DADOS ────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsql =>
    {
        npgsql.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
        npgsql.CommandTimeout(30);
    });

    if (!builder.Environment.IsDevelopment())
        options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
});

// ── 2. CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("Livre", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// ── 3. COMPRESSÃO ────────────────────────────────────────────────────────────
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        new[] { "application/json", "text/json" });
});

builder.Services.Configure<BrotliCompressionProviderOptions>(o =>
    o.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(o =>
    o.Level = CompressionLevel.Fastest);

// ── 4. CACHE ─────────────────────────────────────────────────────────────────
builder.Services.AddResponseCaching();

// ── 5. CONTROLLERS com JSON camelCase ────────────────────────────────────────
// CRÍTICO: sem isso, backend retorna "TransacoesEu" mas React espera "transacoesEu"
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// ── 6. SERVIÇOS ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<WhatsAppService>();
builder.Services.AddScoped<OCRService>();
builder.Services.AddHttpClient();

// ── 7. WORKERS ───────────────────────────────────────────────────────────────
builder.Services.AddHostedService<ResumoWorker>();
builder.Services.AddHostedService<KeepAliveWorker>();

// ── 8. SWAGGER ───────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ── PIPELINE ─────────────────────────────────────────────────────────────────
app.UseCors("Livre");
app.UseResponseCompression();
app.UseResponseCaching();

app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Minha Vida API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => Results.Ok(new
{
    status = "online",
    time = DateTime.UtcNow,
    message = "API Always Together 🚀"
}));

// ── MIGRATE ON STARTUP ───────────────────────────────────────────────────────
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
        logger.LogError(ex, "Erro ao aplicar migrations.");
    }
}

app.Run();