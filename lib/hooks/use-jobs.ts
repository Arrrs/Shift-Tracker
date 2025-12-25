/**
 * React Query hook for jobs data
 * Automatically caches and deduplicates requests
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobs, createJob, updateJob, deleteJob } from '@/app/(authenticated)/jobs/actions';
import { toast } from 'sonner';

/**
 * Query key for jobs
 * Centralized so we can invalidate properly
 */
export const jobsQueryKey = ['jobs'] as const;

/**
 * Fetch all jobs with automatic caching
 *
 * Benefits:
 * - Automatic deduplication: Multiple components requesting jobs = 1 API call
 * - Auto-refresh: Data refetches on window focus
 * - Loading/error states: Built-in, no manual useState needed
 * - Cache: Data persists for 5 minutes before refetching
 *
 * @example
 * const { data: jobs, isLoading, error } = useJobs();
 */
export function useJobs() {
  return useQuery({
    queryKey: jobsQueryKey,
    queryFn: async () => {
      const result = await getJobs();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.jobs || [];
    },
    // Additional options can override defaults
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get only active jobs
 */
export function useActiveJobs() {
  const { data: jobs, ...rest } = useJobs();
  return {
    data: jobs?.filter(job => job.is_active) || [],
    ...rest,
  };
}

/**
 * Create a new job with optimistic updates for instant UI feedback
 *
 * Uses optimistic updates pattern:
 * 1. Immediately updates the cache with the new job
 * 2. Shows the job in the UI instantly (no loading spinner)
 * 3. Rolls back if the server request fails
 *
 * @example
 * const createJobMutation = useCreateJob();
 * createJobMutation.mutate(jobData);
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createJob,
    // Optimistic update: Update cache immediately before server responds
    onMutate: async (newJob) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: jobsQueryKey });

      // Snapshot the previous value for rollback
      const previousJobs = queryClient.getQueryData(jobsQueryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(jobsQueryKey, (old: any) => {
        const optimisticJob = {
          ...newJob,
          id: `temp-${Date.now()}`, // Temporary ID until server responds
          created_at: new Date().toISOString(),
          user_id: 'current-user', // Will be replaced by server response
        };
        return [...(old || []), optimisticJob];
      });

      // Return context with snapshot
      return { previousJobs };
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate to get accurate server data (replaces temp ID with real ID)
        queryClient.invalidateQueries({ queryKey: jobsQueryKey });
        toast.success('Job created successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error, newJob, context) => {
      // Rollback to previous state on error
      if (context?.previousJobs) {
        queryClient.setQueryData(jobsQueryKey, context.previousJobs);
      }
      toast.error('Failed to create job');
      console.error('Create job error:', error);
    },
  });
}

/**
 * Update existing job with optimistic updates for instant UI feedback
 *
 * Updates the job in the cache immediately, then syncs with server.
 * If the server request fails, rolls back to the previous state.
 */
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateJob>[1] }) =>
      updateJob(id, updates),
    // Optimistic update: Update cache immediately
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: jobsQueryKey });

      const previousJobs = queryClient.getQueryData(jobsQueryKey);

      // Optimistically update the job
      queryClient.setQueryData(jobsQueryKey, (old: any) => {
        return old?.map((job: any) =>
          job.id === id ? { ...job, ...updates } : job
        ) || [];
      });

      return { previousJobs };
    },
    onSuccess: (result) => {
      if (result.success) {
        // Sync with server to ensure consistency
        queryClient.invalidateQueries({ queryKey: jobsQueryKey });
        toast.success('Job updated successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousJobs) {
        queryClient.setQueryData(jobsQueryKey, context.previousJobs);
      }
      toast.error('Failed to update job');
      console.error('Update job error:', error);
    },
  });
}

/**
 * Delete job with optimistic updates for instant UI feedback
 *
 * Removes the job from the cache immediately, then syncs with server.
 * If the server request fails, restores the job.
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, deleteEntries }: { id: string; deleteEntries?: boolean }) =>
      deleteJob(id, deleteEntries),
    // Optimistic update: Remove from cache immediately
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: jobsQueryKey });

      const previousJobs = queryClient.getQueryData(jobsQueryKey);

      // Optimistically remove the job
      queryClient.setQueryData(jobsQueryKey, (old: any) => {
        return old?.filter((job: any) => job.id !== id) || [];
      });

      return { previousJobs };
    },
    onSuccess: (result) => {
      if (result.success) {
        // Sync with server
        queryClient.invalidateQueries({ queryKey: jobsQueryKey });
        toast.success('Job deleted successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousJobs) {
        queryClient.setQueryData(jobsQueryKey, context.previousJobs);
      }
      toast.error('Failed to delete job');
      console.error('Delete job error:', error);
    },
  });
}
