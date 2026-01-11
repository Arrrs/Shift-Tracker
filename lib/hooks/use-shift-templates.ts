/**
 * React Query hooks for shift templates
 * Handles shift template CRUD operations with automatic caching
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getShiftTemplates,
  createShiftTemplate,
  updateShiftTemplate,
  deleteShiftTemplate,
} from '@/app/(authenticated)/jobs/actions';
import { toast } from 'sonner';

/**
 * Query key factory for shift templates
 */
export const shiftTemplatesKeys = {
  all: ['shift-templates'] as const,
  lists: () => [...shiftTemplatesKeys.all, 'list'] as const,
  list: (jobId: string) => [...shiftTemplatesKeys.lists(), jobId] as const,
};

/**
 * Fetch shift templates for a job
 */
export function useShiftTemplates(jobId: string) {
  return useQuery({
    queryKey: shiftTemplatesKeys.list(jobId),
    queryFn: async () => {
      const result = await getShiftTemplates(jobId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.templates || [];
    },
    enabled: !!jobId && !jobId.startsWith('temp-'), // Don't fetch for temporary IDs
  });
}

/**
 * Create a new shift template
 */
export function useCreateShiftTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      data,
    }: {
      jobId: string;
      data: Parameters<typeof createShiftTemplate>[1];
    }) => createShiftTemplate(jobId, data),
    onSuccess: (result, variables) => {
      if (result.template && !result.error) {
        // Invalidate templates for this job
        queryClient.invalidateQueries({
          queryKey: shiftTemplatesKeys.list(variables.jobId),
        });
        toast.success('Template created successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to create template');
      console.error('Create template error:', error);
    },
  });
}

/**
 * Update an existing shift template
 */
export function useUpdateShiftTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string;
      data: Parameters<typeof updateShiftTemplate>[1];
    }) => updateShiftTemplate(templateId, data),
    onSuccess: (result) => {
      if (result.template && !result.error) {
        // Invalidate all template lists (we don't know which job it belongs to)
        queryClient.invalidateQueries({
          queryKey: shiftTemplatesKeys.lists(),
        });
        toast.success('Template updated successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to update template');
      console.error('Update template error:', error);
    },
  });
}

/**
 * Delete a shift template
 */
export function useDeleteShiftTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => deleteShiftTemplate(templateId),
    onSuccess: (result) => {
      if (!result.error) {
        // Invalidate all template lists
        queryClient.invalidateQueries({
          queryKey: shiftTemplatesKeys.lists(),
        });
        toast.success('Template deleted successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to delete template');
      console.error('Delete template error:', error);
    },
  });
}
