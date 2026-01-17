/**
 * React Query Client Configuration
 * Central configuration for all query behavior
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create a new QueryClient instance with optimized defaults
 *
 * Default behavior:
 * - Queries cache for 5 minutes (staleTime)
 * - Cache persists for 10 minutes (gcTime)
 * - 3 retry attempts on failure
 * - Auto-refetch on window focus
 * - Auto-refetch on reconnect
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,

        // Unused data is garbage collected after 10 minutes
        gcTime: 10 * 60 * 1000,

        // Retry failed requests 3 times with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch on window focus (good for data freshness)
        refetchOnWindowFocus: true,

        // Refetch when network reconnects
        refetchOnReconnect: true,

        // Don't refetch on mount if data is fresh
        refetchOnMount: false,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

/**
 * Singleton QueryClient for client components
 * Ensures we only create one instance in the browser
 */
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return makeQueryClient();
  } else {
    // Browser: create singleton instance
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
