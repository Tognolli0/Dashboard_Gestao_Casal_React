using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MinhaVidaAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "desejos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Titulo = table.Column<string>(type: "TEXT", nullable: false),
                    DataAlvo = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Icone = table.Column<string>(type: "TEXT", nullable: false),
                    Concluido = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_desejos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "metas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Titulo = table.Column<string>(type: "TEXT", nullable: false),
                    ValorObjetivo = table.Column<double>(type: "REAL", nullable: false),
                    ValorGuardado = table.Column<double>(type: "REAL", nullable: false),
                    Responsavel = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_metas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "transacoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Descricao = table.Column<string>(type: "TEXT", nullable: false),
                    Valor = table.Column<decimal>(type: "TEXT", nullable: false),
                    Data = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Responsavel = table.Column<string>(type: "TEXT", nullable: false),
                    Categoria = table.Column<string>(type: "TEXT", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", nullable: false),
                    EhPessoal = table.Column<bool>(type: "INTEGER", nullable: false)
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
