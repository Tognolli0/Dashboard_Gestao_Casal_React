using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;
using MinhaVidaAPI.Workers;
using System.IO.Compression;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração Híbrida de Banco de Dados
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
//if (builder.Environment.IsDevelopment())
//{
//    // Local: SQLite
//    builder.Services.AddDbContext<AppDbContext>(options =>
//        options.UseSqlite(connectionString));
//}
//else
//{
// Web (Render): PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
//}

// 2. Registro da Compressão
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);

// 3. Serviços de Negócio (CORRIGIDO: De Singleton para Scoped)
// Isso permite que eles usem o AppDbContext sem dar erro 500
builder.Services.AddScoped<WhatsAppService>();
builder.Services.AddScoped<OCRService>();

// Adiciona suporte a requisições HTTP para os serviços (necessário para APIs externas)
builder.Services.AddHttpClient();

builder.Services.AddHostedService<ResumoWorker>();

// 4. CORS
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

// CORS deve vir antes de quase tudo
app.UseCors("Livre");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "MinhaVida API v1");
    });
}

app.UseResponseCompression();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();