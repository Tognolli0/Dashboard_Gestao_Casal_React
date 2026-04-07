using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MinhaVidaAPI.Models
{
    public class Meta
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O título é obrigatório")]
        public string Titulo { get; set; } = string.Empty;

        public double ValorObjetivo { get; set; }

        public double ValorGuardado { get; set; }

        public string Responsavel { get; set; } = "Casal";

        // Propriedade calculada: Facilita a exibição no Blazor e no WhatsApp
        // O [NotMapped] avisa o Banco de Dados para ignorar este campo
        [NotMapped]
        public double Porcentagem => ValorObjetivo > 0
            ? Math.Round((ValorGuardado / ValorObjetivo) * 100, 1)
            : 0;
    }

    // Esta é a View Model que o seu Controller de Aporte precisa
    public class AporteVM
    {
        public double Valor { get; set; }
    }
}