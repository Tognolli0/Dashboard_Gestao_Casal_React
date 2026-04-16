using System.ComponentModel.DataAnnotations;

namespace MinhaVidaAPI.Models
{
    public class ChecklistItem
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(7)]
        public string MesReferencia { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string Titulo { get; set; } = string.Empty;

        public bool Concluido { get; set; }

        public int Ordem { get; set; }
    }
}
