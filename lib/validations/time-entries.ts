/**
 * Zod validation schemas for Time Entries
 * Provides runtime type checking and validation for time entry operations
 */

import { z } from 'zod';
import { currencySchema } from './jobs';

/**
 * Entry type discriminator
 */
export const entryTypeSchema = z.enum(['work_shift', 'day_off'])

/**
 * Day off types
 */
export const dayOffTypeSchema = z.enum(
  ['pto', 'sick', 'personal', 'unpaid', 'bereavement', 'maternity', 'paternity', 'jury_duty'],
  {
  }
);

/**
 * Entry status
 */
export const entryStatusSchema = z.enum(['planned', 'in_progress', 'completed', 'cancelled'])

/**
 * Pay override types
 */
export const payOverrideTypeSchema = z.enum(['none', 'default', 'hourly', 'daily', 'fixed', 'custom_hourly', 'custom_daily', 'fixed_amount', 'holiday_multiplier'])

/**
 * Time validation (HH:MM format)
 */
export const timeSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format (e.g., 09:00, 14:30)');

/**
 * Base schema for all time entries
 */
const baseTimeEntrySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid date'),

  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional().nullable(),

  status: entryStatusSchema.optional(),
});

/**
 * Schema for work shift entries
 */
export const workShiftSchema = baseTimeEntrySchema.extend({
  entry_type: z.literal('work_shift'),

  job_id: z.string().uuid('Invalid job ID').nullable(),

  template_id: z.string().uuid('Invalid template ID').optional().nullable(),

  start_time: timeSchema,

  end_time: timeSchema,

  scheduled_hours: z.number().nonnegative('Scheduled hours must be non-negative').finite(),

  actual_hours: z.number().nonnegative('Actual hours must be non-negative').finite(),

  is_overnight: z.boolean().default(false),

  // Pay customization fields
  pay_override_type: payOverrideTypeSchema.optional().nullable(),

  custom_hourly_rate: z.number().positive().finite().optional().nullable(),

  custom_daily_rate: z.number().positive().finite().optional().nullable(),

  custom_currency: currencySchema.optional().nullable(),

  is_holiday: z.boolean().default(false),

  holiday_multiplier: z.number().positive().finite().optional().nullable(),

  holiday_fixed_amount: z.number().positive().finite().optional().nullable(),
}).refine(
  (data) => {
    // Validate time logic for non-overnight shifts
    if (!data.is_overnight && data.start_time && data.end_time) {
      return data.end_time > data.start_time;
    }
    return true;
  },
  {
    message: 'End time must be after start time for non-overnight shifts',
  }
);

/**
 * Schema for day off entries
 */
export const dayOffSchema = baseTimeEntrySchema.extend({
  entry_type: z.literal('day_off'),

  job_id: z.string().uuid('Invalid job ID').optional().nullable(),

  day_off_type: dayOffTypeSchema,

  actual_hours: z.number().nonnegative('Hours must be non-negative').finite(),

  is_full_day: z.boolean(),
});

/**
 * Discriminated union for creating time entries
 */
export const createTimeEntrySchema = z.discriminatedUnion('entry_type', [
  workShiftSchema,
  dayOffSchema,
]);

/**
 * Schema for updating time entries (partial)
 */
export const updateTimeEntrySchema = z.union([
  workShiftSchema.partial(),
  dayOffSchema.partial(),
]);

/**
 * Type inference
 */
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type WorkShiftInput = z.infer<typeof workShiftSchema>;
export type DayOffInput = z.infer<typeof dayOffSchema>;
export type EntryType = z.infer<typeof entryTypeSchema>;
export type DayOffType = z.infer<typeof dayOffTypeSchema>;
export type EntryStatus = z.infer<typeof entryStatusSchema>;
