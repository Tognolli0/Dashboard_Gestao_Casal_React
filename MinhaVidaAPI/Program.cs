using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;
using MinhaVidaAPI.Workers;
using System.IO.Compression;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração Híbrida de Banco de Dados
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (builder.Environment.IsDevelopment())
{
    // Local: Usa o arquivo SQLite que você enviou
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(connectionString));
}
else
{
    // Web (Render): Usa o PostgreSQL do Supabase
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));
}

// 2. Registro da Compressão (Obrigatório para evitar erros de ativação)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);

// 3. Serviços de Negócio
builder.Services.AddSingleton<WhatsAppService>();
builder.Services.AddSingleton<OCRService>();
builder.Services.AddHostedService<ResumoWorker>();

// 4. CORS - Configurado para aceitar Localhost e Vercel
builder.Services.AddCors(options =>
{
    options.AddPolicy("Livre", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- MIDDLEWARES (A ORDEM É VITAL) ---

app.UseCors("Livre");
app.UseResponseCompression();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "MinhaVida API v1");
    // Removido o RoutePrefix vazio para não dar erro de JSON no Blazor
});

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();