using System.ComponentModel.DataAnnotations;

namespace MinhaVidaAPI.Models
{
    public class Transacao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Descricao { get; set; } = string.Empty;

        public decimal Valor { get; set; }

        public DateTime Data { get; set; } = DateTime.Now;

        // "Eu" ou "Namorada" (Secret Studio)
        public string Responsavel { get; set; } = "Eu";

        public string Categoria { get; set; } = "Geral";
        public string Tipo { get; set; } = "Saída"; // "Entrada" ou "Saída"
        
        public bool EhPessoal { get; set; } = false;

    }
}