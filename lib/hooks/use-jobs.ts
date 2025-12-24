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
 * Create a new job with automatic cache invalidation
 *
 * @example
 * const createJobMutation = useCreateJob();
 * createJobMutation.mutate(jobData, {
 *   onSuccess: () => toast.success('Job created!'),
 * });
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createJob,
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate jobs query to trigger refetch
        queryClient.invalidateQueries({ queryKey: jobsQueryKey });
        toast.success('Job created successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to create job');
      console.error('Create job error:', error);
    },
  });
}

/**
 * Update existing job with automatic cache invalidation
 */
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateJob>[1] }) =>
      updateJob(id, updates),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: jobsQueryKey });
        toast.success('Job updated successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to update job');
      console.error('Update job error:', error);
    },
  });
}

/**
 * Delete job with automatic cache invalidation
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, deleteEntries }: { id: string; deleteEntries?: boolean }) =>
      deleteJob(id, deleteEntries),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: jobsQueryKey });
        toast.success('Job deleted successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to delete job');
      console.error('Delete job error:', error);
    },
  });
}
