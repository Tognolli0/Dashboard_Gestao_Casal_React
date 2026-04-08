using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;
using MinhaVidaAPI.Workers;

var builder = WebApplication.CreateBuilder(args);

// 1. BANCO DE DADOS
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. CONFIGURAÇÃO DE CORS (O que resolve o erro do Front)
builder.Services.AddCors(options =>
{
    options.AddPolicy("Livre", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 3. COMPRESSÃO E PERFORMANCE
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

// 4. SEUS SERVIÇOS CUSTOMIZADOS (WhatsApp, OCR, etc)
builder.Services.AddScoped<WhatsAppService>();
builder.Services.AddScoped<OCRService>();
builder.Services.AddHttpClient();
builder.Services.AddHostedService<ResumoWorker>();

// 5. INFRAESTRUTURA API
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- PIPELINE DE EXECUÇÃO ---

// IMPORTANTE: O CORS deve ser um dos primeiros para o navegador não barrar
app.UseCors("Livre");

// Swagger sempre ativo para facilitar seu debug no Render
app.UseSwagger();
app.UseSwaggerUI();

app.UseResponseCompression();

// Desabilitado para o Render gerenciar o certificado SSL sozinho
// app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// Rota de teste para saber se a API está viva
app.MapGet("/", () => "API Always Together - Online 🚀");

app.Run();