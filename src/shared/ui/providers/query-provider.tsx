import { queryClient } from "@shared/lib/query-client"
import { QueryClientProvider } from "@tanstack/react-query"

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
