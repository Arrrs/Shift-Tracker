/**
 * React Query hooks for financial categories
 * Handles category CRUD operations with automatic caching
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFinancialCategories,
  createFinancialCategory,
  updateFinancialCategory,
  deleteFinancialCategory,
  archiveCategory,
  unarchiveCategory,
} from '@/app/(authenticated)/categories/actions';
import { toast } from 'sonner';

/**
 * Query key factory for financial categories
 */
export const financialCategoriesKeys = {
  all: ['financial-categories'] as const,
  lists: () => [...financialCategoriesKeys.all, 'list'] as const,
  list: () => [...financialCategoriesKeys.lists()] as const,
};

/**
 * Fetch all financial categories for the current user
 *
 * @example
 * const { data: categories, isLoading } = useFinancialCategories();
 */
export function useFinancialCategories() {
  return useQuery({
    queryKey: financialCategoriesKeys.list(),
    queryFn: async () => {
      const result = await getFinancialCategories();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.categories || [];
    },
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
  });
}

/**
 * Create a new financial category
 *
 * @example
 * const createCategory = useCreateFinancialCategory();
 * createCategory.mutate({ name: 'Food', type: 'expense' });
 */
export function useCreateFinancialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFinancialCategory,
    onSuccess: (result) => {
      if (result.category && !result.error) {
        queryClient.invalidateQueries({ queryKey: financialCategoriesKeys.lists() });
        toast.success('Category created successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to create category');
      console.error('Create category error:', error);
    },
  });
}

/**
 * Update an existing financial category
 *
 * @example
 * const updateCategory = useUpdateFinancialCategory();
 * updateCategory.mutate({ id: '123', data: { name: 'Updated Name' } });
 */
export function useUpdateFinancialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateFinancialCategory>[1];
    }) => updateFinancialCategory(id, data),
    onSuccess: (result) => {
      if (result.category && !result.error) {
        queryClient.invalidateQueries({ queryKey: financialCategoriesKeys.lists() });
        toast.success('Category updated successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to update category');
      console.error('Update category error:', error);
    },
  });
}

/**
 * Delete a financial category
 *
 * @example
 * const deleteCategory = useDeleteFinancialCategory();
 * deleteCategory.mutate('category-id-123');
 */
export function useDeleteFinancialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFinancialCategory(id),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: financialCategoriesKeys.lists() });
        toast.success('Category deleted successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to delete category');
      console.error('Delete category error:', error);
    },
  });
}

/**
 * Archive a financial category
 *
 * @example
 * const archiveCategory = useArchiveCategory();
 * archiveCategory.mutate('category-id-123');
 */
export function useArchiveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveCategory(id),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: financialCategoriesKeys.lists() });
        toast.success('Category archived successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to archive category');
      console.error('Archive category error:', error);
    },
  });
}

/**
 * Unarchive a financial category
 *
 * @example
 * const unarchiveCategory = useUnarchiveCategory();
 * unarchiveCategory.mutate('category-id-123');
 */
export function useUnarchiveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unarchiveCategory(id),
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: financialCategoriesKeys.lists() });
        toast.success('Category unarchived successfully');
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      toast.error('Failed to unarchive category');
      console.error('Unarchive category error:', error);
    },
  });
}
