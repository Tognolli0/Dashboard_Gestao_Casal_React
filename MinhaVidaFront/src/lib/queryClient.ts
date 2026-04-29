import { QueryClient } from '@tanstack/react-query'

export const DASHBOARD_QUERY_KEY = ['dashboard-resumo'] as const
export const DASHBOARD_HOME_QUERY_KEY = ['dashboard-home-resumo'] as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error: any) => {
        if (failureCount >= 1) return false

        const status = error?.response?.status
        if (!status) return true

        return status === 408 || status === 429 || status >= 502
      },
      retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

