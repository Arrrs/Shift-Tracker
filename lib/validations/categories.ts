/**
 * Zod validation schemas for Financial Categories
 * Provides runtime type checking and validation for category operations
 */

import { z } from 'zod';

/**
 * Category type (income or expense)
 */
export const categoryTypeSchema = z.enum(['income', 'expense']);

/**
 * Schema for creating a financial category
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be less than 50 characters')
    .trim(),

  type: categoryTypeSchema,

  icon: z
    .string()
    .max(10, 'Icon must be less than 10 characters')
    .regex(/^[\p{Emoji}\p{Emoji_Component}]+$/u, 'Icon must be an emoji')
    .optional()
    .nullable(),

  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code (e.g., #10b981)')
    .optional()
    .nullable(),

  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional()
    .nullable(),

  is_active: z.boolean().default(true),
});

/**
 * Schema for updating a category
 */
export const updateCategorySchema = createCategorySchema.partial();

/**
 * Type inference
 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryType = z.infer<typeof categoryTypeSchema>;
