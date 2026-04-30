using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Data;
using MinhaVidaAPI.Services;
using MinhaVidaAPI.Workers;
using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: false);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var databaseProvider = builder.Configuration["DatabaseProvider"] ?? "Postgres";

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

app.MapGet("/", () => Results.Ok(new
{
    status = "online",
    time = DateTime.UtcNow,
    message = "API Always Together"
}));

app.MapGet("/api/status", () => Results.Ok(new
{
    status = "online",
    time = DateTime.UtcNow,
    provider = databaseProvider
}));

app.MapGet("/healthz", () => Results.Ok(new
{
    status = "healthy",
    time = DateTime.UtcNow
}));

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
        else
        {
            if (!app.Environment.IsDevelopment() && applyMigrationsOnStartup)
            {
                await db.Database.MigrateAsync();
            }

            await EnsurePostgresSchemaAsync(db);
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Erro ao preparar banco de dados.");
    }
}

app.Run();

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

static async Task EnsurePostgresSchemaAsync(AppDbContext db)
{
    var sql = """
        ALTER TABLE IF EXISTS metas
        ADD COLUMN IF NOT EXISTS "EhReservaEmergencia" boolean NOT NULL DEFAULT false;

        ALTER TABLE IF EXISTS metas
        ADD COLUMN IF NOT EXISTS "CriadaEm" timestamp with time zone NOT NULL DEFAULT NOW();

        ALTER TABLE IF EXISTS metas
        ADD COLUMN IF NOT EXISTS "AtualizadaEm" timestamp with time zone NOT NULL DEFAULT NOW();

        UPDATE metas
        SET "CriadaEm" = COALESCE("CriadaEm", NOW()),
            "AtualizadaEm" = COALESCE("AtualizadaEm", NOW());

        CREATE TABLE IF NOT EXISTS checklist_items (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "MesReferencia" character varying(7) NOT NULL,
            "Titulo" character varying(120) NOT NULL,
            "Concluido" boolean NOT NULL DEFAULT false,
            "Ordem" integer NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS "IX_checklist_items_MesReferencia" ON checklist_items ("MesReferencia");
        CREATE INDEX IF NOT EXISTS "IX_checklist_items_MesReferencia_Ordem" ON checklist_items ("MesReferencia", "Ordem");
        CREATE INDEX IF NOT EXISTS "IX_transacoes_Data" ON transacoes ("Data");
        CREATE INDEX IF NOT EXISTS "IX_transacoes_Responsavel" ON transacoes ("Responsavel");
        CREATE INDEX IF NOT EXISTS "IX_transacoes_Responsavel_Data" ON transacoes ("Responsavel", "Data");
        CREATE INDEX IF NOT EXISTS "IX_transacoes_Tipo_Data" ON transacoes ("Tipo", "Data");
        CREATE INDEX IF NOT EXISTS "IX_transacoes_Categoria_Data" ON transacoes ("Categoria", "Data");
        """;

    await db.Database.ExecuteSqlRawAsync(sql);
}
