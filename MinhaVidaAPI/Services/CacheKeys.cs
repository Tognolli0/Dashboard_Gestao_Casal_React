namespace MinhaVidaAPI.Services
{
    public static class CacheKeys
    {
        public const string DashboardResumo = "dashboard-resumo";
        public const string Metas = "metas";
        public const string Desejos = "desejos";

        public static string Transacoes(string responsavel) => $"transacoes-{responsavel.ToLowerInvariant()}";
    }
}
