/**
 * Utilities for handling Zod validation errors
 * Converts Zod errors into user-friendly messages
 */

import { ZodError, ZodIssue } from 'zod';

/**
 * Format Zod validation errors into a user-friendly message
 *
 * @param error - The Zod validation error
 * @returns A formatted error message string
 *
 * @example
 * try {
 *   schema.parse(data);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     return { error: formatZodError(error) };
 *   }
 * }
 */
export function formatZodError(error: ZodError<any>): string {
  // Get the first error message for simplicity
  const firstError: ZodIssue | undefined = error.issues[0];

  if (!firstError) {
    return 'Validation failed';
  }

  // Format the field path nicely
  const field = firstError.path.join('.');
  const message = firstError.message;

  // If the error is at the root level, return just the message
  if (!field) {
    return message;
  }

  // Return field + message
  return `${humanizeFieldName(field)}: ${message}`;
}

/**
 * Get all validation errors as an array
 *
 * @param error - The Zod validation error
 * @returns Array of formatted error messages
 */
export function getAllZodErrors(error: ZodError<any>): string[] {
  return error.issues.map((err: ZodIssue) => {
    const field = err.path.join('.');
    if (!field) {
      return err.message;
    }
    return `${humanizeFieldName(field)}: ${err.message}`;
  });
}

/**
 * Get validation errors as an object keyed by field name
 *
 * @param error - The Zod validation error
 * @returns Object with field names as keys and error messages as values
 */
export function getZodErrorsByField(error: ZodError<any>): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const err of error.issues) {
    const field = err.path.join('.');
    if (field) {
      errors[field] = err.message;
    }
  }

  return errors;
}

/**
 * Convert snake_case or camelCase field names to human-readable format
 *
 * @param field - The field name to humanize
 * @returns Human-readable field name
 *
 * @example
 * humanizeFieldName('hourly_rate') // "Hourly Rate"
 * humanizeFieldName('jobId') // "Job ID"
 * humanizeFieldName('user_id') // "User ID"
 */
function humanizeFieldName(field: string): string {
  return field
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .split(' ')
    .map((word) => {
      // Special cases for common abbreviations
      const upper = word.toUpperCase();
      if (upper === 'ID' || upper === 'URL' || upper === 'API') {
        return upper;
      }
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .trim();
}

/**
 * Safe parse with error handling
 * Returns either the parsed data or an error object
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Object with either success data or error message
 *
 * @example
 * const result = safeValidate(createJobSchema, formData);
 * if (result.success) {
 *   // Use result.data
 * } else {
 *   // Show result.error to user
 * }
 */
export function safeValidate<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown
): { success: true; data: T } | { success: false; error: string; errors?: string[] } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: formatZodError(error),
        errors: getAllZodErrors(error),
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}
