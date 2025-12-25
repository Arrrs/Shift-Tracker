"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/(authenticated)/finances/actions";
import { toast } from "sonner";

// Query key factory for categories
export const categoriesKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesKeys.all, "list"] as const,
  list: (type: "income" | "expense") =>
    [...categoriesKeys.lists(), type] as const,
  details: () => [...categoriesKeys.all, "detail"] as const,
  detail: (id: string) => [...categoriesKeys.details(), id] as const,
};

/**
 * Hook to fetch categories by type (income or expense)
 */
export function useCategories(type: "income" | "expense") {
  return useQuery({
    queryKey: categoriesKeys.list(type),
    queryFn: async () => {
      const result = await getCategories(type);
      if (result.error) throw new Error(result.error);
      return result.categories || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
  });
}

/**
 * Hook to create a new category with optimistic updates
 *
 * Immediately adds the category to the cache for instant UI feedback.
 * Rolls back if the server request fails.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    // Optimistic update
    onMutate: async (newCategory: any) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: categoriesKeys.lists() });

      // Snapshot previous state
      const previousCategories = queryClient.getQueryData(
        categoriesKeys.list(newCategory.type as "income" | "expense")
      );

      // Optimistically add new category
      queryClient.setQueryData(
        categoriesKeys.list(newCategory.type as "income" | "expense"),
        (old: any) => {
          const optimisticCategory = {
            ...newCategory,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            user_id: 'current-user',
          };
          return [...(old || []), optimisticCategory];
        }
      );

      return { previousCategories, categoryType: newCategory.type };
    },
    onSuccess: (result) => {
      if (result.category && !result.error) {
        queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
        toast.success("Category created successfully");
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error: Error, newCategory, context) => {
      // Rollback on error
      if (context?.previousCategories && context?.categoryType) {
        queryClient.setQueryData(
          categoriesKeys.list(context.categoryType as "income" | "expense"),
          context.previousCategories
        );
      }
      toast.error(error.message || "Failed to create category");
    },
  });
}

/**
 * Hook to update an existing category with optimistic updates
 *
 * Updates the category in the cache immediately for instant UI feedback.
 * Rolls back if the server request fails.
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: any;
    }) => updateCategory(categoryId, data),
    // Optimistic update
    onMutate: async ({ categoryId, data }: { categoryId: string; data: any }) => {
      await queryClient.cancelQueries({ queryKey: categoriesKeys.lists() });

      // Snapshot both income and expense lists (we don't know which one)
      const previousIncome = queryClient.getQueryData(categoriesKeys.list("income"));
      const previousExpense = queryClient.getQueryData(categoriesKeys.list("expense"));

      // Update both lists (category might be in either)
      const updateList = (old: any) =>
        old?.map((cat: any) =>
          cat.id === categoryId ? { ...cat, ...data } : cat
        ) || [];

      queryClient.setQueryData(categoriesKeys.list("income"), updateList);
      queryClient.setQueryData(categoriesKeys.list("expense"), updateList);

      return { previousIncome, previousExpense };
    },
    onSuccess: (result) => {
      if (result.category && !result.error) {
        queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
        toast.success("Category updated successfully");
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error: Error, variables, context) => {
      // Rollback both lists
      if (context?.previousIncome) {
        queryClient.setQueryData(categoriesKeys.list("income"), context.previousIncome);
      }
      if (context?.previousExpense) {
        queryClient.setQueryData(categoriesKeys.list("expense"), context.previousExpense);
      }
      toast.error(error.message || "Failed to update category");
    },
  });
}

/**
 * Hook to delete a category with optimistic updates
 *
 * Removes the category from the cache immediately for instant UI feedback.
 * Rolls back if the server request fails.
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    // Optimistic update
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: categoriesKeys.lists() });

      // Snapshot both lists
      const previousIncome = queryClient.getQueryData(categoriesKeys.list("income"));
      const previousExpense = queryClient.getQueryData(categoriesKeys.list("expense"));

      // Remove from both lists (category is in one of them)
      const removeFromList = (old: any) =>
        old?.filter((cat: any) => cat.id !== categoryId) || [];

      queryClient.setQueryData(categoriesKeys.list("income"), removeFromList);
      queryClient.setQueryData(categoriesKeys.list("expense"), removeFromList);

      return { previousIncome, previousExpense };
    },
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
        toast.success("Category deleted successfully");
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: Error, categoryId, context) => {
      // Rollback both lists
      if (context?.previousIncome) {
        queryClient.setQueryData(categoriesKeys.list("income"), context.previousIncome);
      }
      if (context?.previousExpense) {
        queryClient.setQueryData(categoriesKeys.list("expense"), context.previousExpense);
      }
      toast.error(error.message || "Failed to delete category");
    },
  });
}
