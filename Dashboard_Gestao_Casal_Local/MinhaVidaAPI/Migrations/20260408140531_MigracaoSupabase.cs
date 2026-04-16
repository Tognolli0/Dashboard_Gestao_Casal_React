using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MinhaVidaAPI.Migrations
{
    /// <inheritdoc />
    public partial class MigracaoSupabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "desejos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Titulo = table.Column<string>(type: "text", nullable: false),
                    DataAlvo = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Icone = table.Column<string>(type: "text", nullable: false),
                    Concluido = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_desejos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "metas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Titulo = table.Column<string>(type: "text", nullable: false),
                    ValorObjetivo = table.Column<double>(type: "double precision", nullable: false),
                    ValorGuardado = table.Column<double>(type: "double precision", nullable: false),
                    Responsavel = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_metas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "transacoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Descricao = table.Column<string>(type: "text", nullable: false),
                    Valor = table.Column<double>(type: "double precision", nullable: false),
                    Data = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Responsavel = table.Column<string>(type: "text", nullable: false),
                    Categoria = table.Column<string>(type: "text", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    EhPessoal = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transacoes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_transacoes_Data",
                table: "transacoes",
                column: "Data");

            migrationBuilder.CreateIndex(
                name: "IX_transacoes_Responsavel",
                table: "transacoes",
                column: "Responsavel");

            migrationBuilder.CreateIndex(
                name: "IX_transacoes_Responsavel_Data",
                table: "transacoes",
                columns: new[] { "Responsavel", "Data" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "desejos");

            migrationBuilder.DropTable(
                name: "metas");

            migrationBuilder.DropTable(
                name: "transacoes");
        }
    }
}
