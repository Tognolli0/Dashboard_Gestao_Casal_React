namespace MinhaVidaAPI.Services
{
    public static class CacheKeys
    {
        public const string DashboardResumo = "dashboard-resumo";
        public const string DashboardHome = "dashboard-home";
        public const string Metas = "metas";
        public const string Desejos = "desejos";

        public static string Transacoes(string responsavel) => $"transacoes-{responsavel.ToLowerInvariant()}";
        public static string TransacoesPeriodo(string responsavel, int ano, int mes) => $"transacoes-{responsavel.ToLowerInvariant()}-{ano}-{mes}";
        public static string TransacoesPeriodoTodos(int ano, int mes) => $"transacoes-todos-{ano}-{mes}";
    }
}
