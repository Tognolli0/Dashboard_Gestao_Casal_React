using Microsoft.EntityFrameworkCore;
using MinhaVidaAPI.Models;

namespace MinhaVidaAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Transacao> Transacoes { get; set; }
        public DbSet<Meta> Metas { get; set; }
        public DbSet<Desejo> Desejos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Nomes de tabela em lowercase — obrigatório para PostgreSQL
            modelBuilder.Entity<Transacao>().ToTable("transacoes");
            modelBuilder.Entity<Meta>().ToTable("metas");
            modelBuilder.Entity<Desejo>().ToTable("desejos");

            // Índices nas colunas mais consultadas
            modelBuilder.Entity<Transacao>(entity =>
            {
                entity.HasIndex(t => t.Responsavel);
                entity.HasIndex(t => t.Data);
                entity.HasIndex(t => new { t.Responsavel, t.Data });
            });
        }
    }
}