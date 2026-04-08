using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;
using MinhaVidaAPI.Workers;

var builder = WebApplication.CreateBuilder(args);

// 1. CONFIGURAÇÃO DE SERVIÇOS (O que a API "sabe" fazer)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configuração do CORS - Definindo a política "Livre"
builder.Services.AddCors(options =>
{
    options.AddPolicy("Livre", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

builder.Services.AddScoped<WhatsAppService>();
builder.Services.AddScoped<OCRService>();
builder.Services.AddHttpClient();
builder.Services.AddHostedService<ResumoWorker>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 2. PIPELINE DE EXECUÇÃO (A ordem aqui IMPORTA MUITO)

// O CORS DEVE ser a primeira coisa. 
// Isso garante que mesmo em erro ou lentidão, o Header de permissão seja enviado.
app.UseCors("Livre");

// Swagger configurado para aparecer em Produção (Render) para testes
app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Minha Vida API v1");
    c.RoutePrefix = "swagger"; // Swagger disponível em /swagger
});

app.UseResponseCompression();

// UseAuthorization deve vir depois do CORS
app.UseAuthorization();

app.MapControllers();

// Rota para testar se a API está acordada sem precisar de banco
app.MapGet("/", () => "API Always Together - Online e Autorizada 🚀");

app.Run();