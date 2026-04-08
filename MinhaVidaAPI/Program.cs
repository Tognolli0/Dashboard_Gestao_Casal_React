using Microsoft.AspNetCore.ResponseCompression;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;
using MinhaVidaAPI.Workers;

var builder = WebApplication.CreateBuilder(args);

// Força a leitura da string de conexão
// Pegamos a string de conexão
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Usando o nome completo do método para o editor não apagar o using
builder.Services.AddDbContext<AppDbContext>(options =>
    Microsoft.EntityFrameworkCore.NpgsqlDbContextOptionsBuilderExtensions.UseNpgsql(options, connectionString));

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

builder.Services.AddCors(options =>
{
    options.AddPolicy("Livre", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("Livre");
app.UseSwagger();
app.UseSwaggerUI();
app.UseResponseCompression();
//app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();