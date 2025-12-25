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
 * Hook to create a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: (result) => {
      if (result.category && !result.error) {
        queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
        toast.success("Category created successfully");
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create category");
    },
  });
}

/**
 * Hook to update an existing category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: Parameters<typeof updateCategory>[1];
    }) => updateCategory(categoryId, data),
    onSuccess: (result) => {
      if (result.category && !result.error) {
        queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
        toast.success("Category updated successfully");
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update category");
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
        toast.success("Category deleted successfully");
      } else {
        toast.error(result.error);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete category");
    },
  });
}
