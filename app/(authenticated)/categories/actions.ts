"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type FinancialCategory = {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  color: string | null;
  default_amount: number | null;
  default_currency: string | null;
  default_description: string | null;
  is_active: boolean;
  created_at: string;
};

/**
 * Get all financial categories for the current user
 */
export async function getFinancialCategories() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", categories: null };
  }

  const { data, error } = await supabase
    .from("financial_categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return { error: error.message, categories: null };
  }

  return { error: null, categories: data as FinancialCategory[] };
}

/**
 * Create a new financial category
 */
export async function createFinancialCategory(formData: {
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
  default_amount?: number;
  default_currency?: string;
  default_description?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", category: null };
  }

  // Validate required fields
  if (!formData.name || !formData.type) {
    return { error: "Name and type are required", category: null };
  }

  // Check if category with same name and type already exists
  const { data: existing } = await supabase
    .from("financial_categories")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", formData.name)
    .eq("type", formData.type)
    .single();

  if (existing) {
    return { error: "A category with this name and type already exists", category: null };
  }

  const { data, error } = await supabase
    .from("financial_categories")
    .insert({
      user_id: user.id,
      name: formData.name,
      type: formData.type,
      icon: formData.icon || null,
      color: formData.color || null,
      default_amount: formData.default_amount || null,
      default_currency: formData.default_currency || null,
      default_description: formData.default_description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    return { error: error.message, category: null };
  }

  revalidatePath("/categories");
  revalidatePath("/calendar");

  return { error: null, category: data as FinancialCategory };
}

/**
 * Update an existing financial category
 */
export async function updateFinancialCategory(
  categoryId: string,
  formData: {
    name: string;
    type: "income" | "expense";
    icon?: string;
    color?: string;
    default_amount?: number;
    default_currency?: string;
    default_description?: string;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", category: null };
  }

  // Validate required fields
  if (!formData.name || !formData.type) {
    return { error: "Name and type are required", category: null };
  }

  // Check if category exists and belongs to user
  const { data: existing } = await supabase
    .from("financial_categories")
    .select("id, name")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return { error: "Category not found", category: null };
  }

  // Check if another category with same name and type already exists
  const { data: duplicate } = await supabase
    .from("financial_categories")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", formData.name)
    .eq("type", formData.type)
    .neq("id", categoryId)
    .single();

  if (duplicate) {
    return { error: "A category with this name and type already exists", category: null };
  }

  const { data, error } = await supabase
    .from("financial_categories")
    .update({
      name: formData.name,
      type: formData.type,
      icon: formData.icon || null,
      color: formData.color || null,
      default_amount: formData.default_amount || null,
      default_currency: formData.default_currency || null,
      default_description: formData.default_description || null,
    })
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating category:", error);
    return { error: error.message, category: null };
  }

  revalidatePath("/categories");
  revalidatePath("/calendar");

  return { error: null, category: data as FinancialCategory };
}

/**
 * Delete a financial category
 * Sets category_id to NULL for all related financial records (preserves history)
 */
export async function deleteFinancialCategory(categoryId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", success: false };
  }

  // Check if category exists and belongs to user
  const { data: category } = await supabase
    .from("financial_categories")
    .select("id, name")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .single();

  if (!category) {
    return { error: "Category not found", success: false };
  }

  // Prevent deletion of mandatory "Other Income" and "Other Expense" categories
  if (category.name === "Other Income" || category.name === "Other Expense") {
    return { error: "Cannot delete mandatory categories", success: false };
  }

  // Delete the category (foreign key constraint will set category_id to NULL in financial_records)
  const { error } = await supabase
    .from("financial_categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting category:", error);
    return { error: error.message, success: false };
  }

  revalidatePath("/categories");
  revalidatePath("/calendar");

  return { error: null, success: true };
}

/**
 * Archive a financial category
 */
export async function archiveCategory(categoryId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", success: false };
  }

  // Check if category exists and belongs to user
  const { data: category } = await supabase
    .from("financial_categories")
    .select("id, name")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .single();

  if (!category) {
    return { error: "Category not found", success: false };
  }

  // Prevent archiving of mandatory "Other Income" and "Other Expense" categories
  if (category.name === "Other Income" || category.name === "Other Expense") {
    return { error: "Cannot archive mandatory categories", success: false };
  }

  // Archive the category
  const { error } = await supabase
    .from("financial_categories")
    .update({ is_active: false })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error archiving category:", error);
    return { error: error.message, success: false };
  }

  revalidatePath("/categories");
  revalidatePath("/calendar");

  return { error: null, success: true };
}

/**
 * Unarchive a financial category
 */
export async function unarchiveCategory(categoryId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", success: false };
  }

  // Check if category exists and belongs to user
  const { data: category } = await supabase
    .from("financial_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .single();

  if (!category) {
    return { error: "Category not found", success: false };
  }

  // Unarchive the category
  const { error } = await supabase
    .from("financial_categories")
    .update({ is_active: true })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error unarchiving category:", error);
    return { error: error.message, success: false };
  }

  revalidatePath("/categories");
  revalidatePath("/calendar");

  return { error: null, success: true };
}
