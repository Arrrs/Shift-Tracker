/**
 * Zod validation schemas for Jobs
 * Provides runtime type checking and validation for job-related operations
 */

import { z } from 'zod';

/**
 * Supported pay types for jobs
 */
export const payTypeSchema = z.enum(['hourly', 'daily', 'monthly', 'salary']);

/**
 * ISO 4217 currency code validation
 * Validates 3-letter currency codes (USD, EUR, GBP, etc.)
 */
export const currencySchema = z
  .string()
  .length(3, 'Currency code must be exactly 3 characters')
  .regex(/^[A-Z]{3}$/, 'Currency code must be uppercase letters (e.g., USD, EUR)')
  .default('USD');

/**
 * Positive decimal number schema for rates and amounts
 */
export const positiveDecimalSchema = z
  .number()
  .positive('Must be a positive number')
  .finite('Must be a finite number');

/**
 * Schema for creating a new job
 */
export const createJobSchema = z.object({
  name: z
    .string()
    .min(1, 'Job name is required')
    .max(100, 'Job name must be less than 100 characters')
    .trim(),

  pay_type: payTypeSchema,

  hourly_rate: z
    .number()
    .positive('Hourly rate must be positive')
    .finite('Hourly rate must be finite')
    .optional()
    .nullable(),

  daily_rate: z
    .number()
    .positive('Daily rate must be positive')
    .finite('Daily rate must be finite')
    .optional()
    .nullable(),

  monthly_salary: z
    .number()
    .positive('Monthly salary must be positive')
    .finite('Monthly salary must be finite')
    .optional()
    .nullable(),

  currency: currencySchema,

  is_active: z.boolean().default(true),

  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code (e.g., #3B82F6)')
    .default('#3B82F6'),

  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),

  // PTO and leave days
  pto_days_per_year: z
    .number()
    .int('PTO days must be a whole number')
    .min(0, 'PTO days cannot be negative')
    .max(365, 'PTO days cannot exceed 365')
    .optional()
    .nullable(),

  sick_days_per_year: z
    .number()
    .int('Sick days must be a whole number')
    .min(0, 'Sick days cannot be negative')
    .max(365, 'Sick days cannot exceed 365')
    .optional()
    .nullable(),

  personal_days_per_year: z
    .number()
    .int('Personal days must be a whole number')
    .min(0, 'Personal days cannot be negative')
    .max(365, 'Personal days cannot exceed 365')
    .optional()
    .nullable(),

  // Currency symbol (auto-populated based on currency)
  currency_symbol: z.string().max(5).optional(),
}).refine(
  (data) => {
    // Validate that rate is provided based on pay_type
    if (data.pay_type === 'hourly' && !data.hourly_rate) {
      return false;
    }
    if (data.pay_type === 'daily' && !data.daily_rate) {
      return false;
    }
    if ((data.pay_type === 'monthly' || data.pay_type === 'salary') && !data.monthly_salary) {
      return false;
    }
    return true;
  },
  {
    message: 'Rate is required based on pay type (hourly_rate for hourly, daily_rate for daily, monthly_salary for monthly/salary)',
  }
);

/**
 * Schema for updating an existing job
 * All fields are optional since this is a partial update
 */
export const updateJobSchema = createJobSchema.partial();

/**
 * Schema for archiving/unarchiving a job
 */
export const archiveJobSchema = z.object({
  is_active: z.boolean(),
});

/**
 * Schema for deleting a job
 */
export const deleteJobSchema = z.object({
  deleteEntries: z.boolean().default(false),
});

/**
 * Type inference from schemas
 */
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type PayType = z.infer<typeof payTypeSchema>;
