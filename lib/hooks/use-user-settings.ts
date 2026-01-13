/**
 * React Hook for User Settings
 * Provides access to user settings with React Query for caching and auto-refresh
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, setSettings, UserSettings } from '@/lib/utils/user-settings';

const SETTINGS_QUERY_KEY = ['user-settings'];

/**
 * Hook to get user settings
 * Returns settings with loading and error states
 */
export function useUserSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: getSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to update user settings
 * Automatically updates cache and syncs to database
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      await setSettings(newSettings);
      return newSettings;
    },
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: SETTINGS_QUERY_KEY });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(SETTINGS_QUERY_KEY);

      // Optimistically update cache
      if (previousSettings) {
        queryClient.setQueryData<UserSettings>(SETTINGS_QUERY_KEY, {
          ...previousSettings,
          ...newSettings,
        });
      }

      return { previousSettings };
    },
    onError: (_error, _newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(SETTINGS_QUERY_KEY, context.previousSettings);
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });
}

/**
 * Hook to get just the primary currency (convenience)
 */
export function usePrimaryCurrency(): string {
  const { data: settings } = useUserSettings();
  return settings?.primary_currency || 'USD';
}
