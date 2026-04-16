import { QueryClient } from '@tanstack/react-query'

export const DASHBOARD_QUERY_KEY = ['dashboard-resumo'] as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
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

