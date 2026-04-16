using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;
using MinhaVidaAPI.Workers;
using System.Diagnostics;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: false);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var databaseProvider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
var configuredPort = builder.Configuration.GetValue("App:Port", 5163);
var appPort = GetAvailablePort(configuredPort);

builder.Services.AddDbContextPool<AppDbContext>(options =>
{
    if (string.Equals(databaseProvider, "Sqlite", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlite(connectionString);
    }
    else
    {
        options.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorCodesToAdd: null);
            npgsql.CommandTimeout(15);
        });
    }

    if (!builder.Environment.IsDevelopment())
    {
        options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
    }
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Livre", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        new[] { "application/json", "text/json" });
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
    options.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
    options.Level = CompressionLevel.Fastest);

builder.Services.AddMemoryCache();
builder.Services.AddResponseCaching();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddScoped<WhatsAppService>();
builder.Services.AddScoped<OCRService>();
builder.Services.AddHttpClient();
builder.Services.AddHostedService<ResumoWorker>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.Urls.Clear();
app.Urls.Add($"http://127.0.0.1:{appPort}");

app.UseCors("Livre");
app.UseResponseCompression();
app.UseResponseCaching();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Minha Vida API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/api/status", () => Results.Ok(new
{
    status = "online",
    time = DateTime.UtcNow,
    message = "API Always Together"
}));

app.MapGet("/healthz", () => Results.Ok(new
{
    status = "healthy",
    time = DateTime.UtcNow
}));

app.MapFallback(async context =>
{
    var indexPath = Path.Combine(app.Environment.WebRootPath ?? string.Empty, "index.html");
    if (File.Exists(indexPath))
    {
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.SendFileAsync(indexPath);
        return;
    }

    context.Response.StatusCode = StatusCodes.Status404NotFound;
});

var applyMigrationsOnStartup = builder.Configuration.GetValue("APPLY_MIGRATIONS_ON_STARTUP", false);

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (string.Equals(databaseProvider, "Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            await db.Database.EnsureCreatedAsync();
            await EnsureSqliteSchemaAsync(db);
        }
        else if (!app.Environment.IsDevelopment() && applyMigrationsOnStartup)
        {
            await db.Database.MigrateAsync();
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Erro ao preparar banco de dados.");
    }
}

if (!app.Environment.IsDevelopment())
{
    app.Lifetime.ApplicationStarted.Register(() =>
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = $"http://127.0.0.1:{appPort}",
                UseShellExecute = true
            });
        }
        catch
        {
        }
    });
}

app.Run();

static int GetAvailablePort(int startPort)
{
    for (var port = startPort; port < startPort + 20; port++)
    {
        try
        {
            using var listener = new TcpListener(IPAddress.Loopback, port);
            listener.Start();
            return port;
        }
        catch (SocketException)
        {
        }
    }

    throw new InvalidOperationException("Nenhuma porta local disponivel para iniciar o aplicativo.");
}

static async Task EnsureSqliteSchemaAsync(AppDbContext db)
{
    await using var connection = (SqliteConnection)db.Database.GetDbConnection();
    if (connection.State != System.Data.ConnectionState.Open)
    {
        await connection.OpenAsync();
    }

    var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    await using (var command = connection.CreateCommand())
    {
        command.CommandText = "PRAGMA table_info(metas);";
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            columns.Add(reader.GetString(1));
        }
    }

    if (!columns.Contains("EhReservaEmergencia"))
    {
        await using var alter = connection.CreateCommand();
        alter.CommandText = "ALTER TABLE metas ADD COLUMN EhReservaEmergencia INTEGER NOT NULL DEFAULT 0;";
        await alter.ExecuteNonQueryAsync();
    }

    if (!columns.Contains("CriadaEm"))
    {
        await using var alter = connection.CreateCommand();
        alter.CommandText = "ALTER TABLE metas ADD COLUMN CriadaEm TEXT NOT NULL DEFAULT '2000-01-01T00:00:00Z';";
        await alter.ExecuteNonQueryAsync();
    }

    if (!columns.Contains("AtualizadaEm"))
    {
        await using var alter = connection.CreateCommand();
        alter.CommandText = "ALTER TABLE metas ADD COLUMN AtualizadaEm TEXT NOT NULL DEFAULT '2000-01-01T00:00:00Z';";
        await alter.ExecuteNonQueryAsync();
    }

    await using (var normalizeDates = connection.CreateCommand())
    {
        normalizeDates.CommandText =
            """
            UPDATE metas
            SET CriadaEm = CASE
                    WHEN CriadaEm IS NULL OR CriadaEm = '' OR CriadaEm = '2000-01-01T00:00:00Z'
                    THEN CURRENT_TIMESTAMP
                    ELSE CriadaEm
                END,
                AtualizadaEm = CASE
                    WHEN AtualizadaEm IS NULL OR AtualizadaEm = '' OR AtualizadaEm = '2000-01-01T00:00:00Z'
                    THEN CURRENT_TIMESTAMP
                    ELSE AtualizadaEm
                END;
            """;
        await normalizeDates.ExecuteNonQueryAsync();
    }

    await using var createChecklist = connection.CreateCommand();
    createChecklist.CommandText =
        """
        CREATE TABLE IF NOT EXISTS checklist_items (
            Id INTEGER NOT NULL CONSTRAINT PK_checklist_items PRIMARY KEY AUTOINCREMENT,
            MesReferencia TEXT NOT NULL,
            Titulo TEXT NOT NULL,
            Concluido INTEGER NOT NULL DEFAULT 0,
            Ordem INTEGER NOT NULL DEFAULT 0
        );
        """;
    await createChecklist.ExecuteNonQueryAsync();

    await using var indexMes = connection.CreateCommand();
    indexMes.CommandText = "CREATE INDEX IF NOT EXISTS IX_checklist_items_MesReferencia ON checklist_items (MesReferencia);";
    await indexMes.ExecuteNonQueryAsync();

    await using var indexMesOrdem = connection.CreateCommand();
    indexMesOrdem.CommandText = "CREATE INDEX IF NOT EXISTS IX_checklist_items_MesReferencia_Ordem ON checklist_items (MesReferencia, Ordem);";
    await indexMesOrdem.ExecuteNonQueryAsync();
}
