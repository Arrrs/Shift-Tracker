/**
 * Zod validation schemas for Financial Records
 * Provides runtime type checking and validation for financial operations
 */

import { z } from 'zod';
import { currencySchema } from './jobs';

/**
 * Financial record types
 */
export const financialRecordTypeSchema = z.enum(['income', 'expense']);

/**
 * Financial record status
 */
export const financialRecordStatusSchema = z.enum(['completed', 'planned', 'cancelled']);

/**
 * Schema for creating a financial record
 */
export const createFinancialRecordSchema = z.object({
  type: financialRecordTypeSchema,

  amount: z
    .number()
    .positive('Amount must be positive')
    .finite('Amount must be finite')
    .refine((val) => val > 0, 'Amount must be greater than 0'),

  currency: currencySchema,

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid date'),

  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters')
    .trim(),

  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional().nullable(),

  category_id: z.string().uuid('Invalid category ID').optional().nullable(),

  job_id: z.string().uuid('Invalid job ID').optional().nullable(),

  status: financialRecordStatusSchema.default('completed'),
});

/**
 * Schema for updating a financial record
 */
export const updateFinancialRecordSchema = createFinancialRecordSchema.partial();

/**
 * Type inference
 */
export type CreateFinancialRecordInput = z.infer<typeof createFinancialRecordSchema>;
export type UpdateFinancialRecordInput = z.infer<typeof updateFinancialRecordSchema>;
export type FinancialRecordType = z.infer<typeof financialRecordTypeSchema>;
export type FinancialRecordStatus = z.infer<typeof financialRecordStatusSchema>;
