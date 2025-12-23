/**
 * Input Validators
 * 
 * Validates user input before database operations
 * Ensures data integrity at application boundaries
 */

import { z } from 'zod';
import { CategoryKeySchema } from './schemas';

/**
 * Validate month creation input
 */
export const CreateMonthInputSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export type CreateMonthInput = z.infer<typeof CreateMonthInputSchema>;

/**
 * Validate expense creation input
 */
export const CreateExpenseInputSchema = z.object({
  month_id: z.string().min(1),
  title: z.string().min(1).max(255),
  category_key: CategoryKeySchema,
  subcategory_id: z.string().optional().nullable(),
  value: z.number().min(0),
  is_recurring: z.boolean().optional(),
  is_pending: z.boolean().optional(),
  due_day: z.number().int().min(1).max(31).optional().nullable(),
  recurring_expense_id: z.string().optional().nullable(),
  installment_current: z.number().int().optional().nullable(),
  installment_total: z.number().int().optional().nullable(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseInputSchema>;

/**
 * Validate expense update input (all fields optional)
 */
export const UpdateExpenseInputSchema = CreateExpenseInputSchema.partial();

export type UpdateExpenseInput = z.infer<typeof UpdateExpenseInputSchema>;

/**
 * Validate recurring expense creation input
 */
export const CreateRecurringExpenseInputSchema = z.object({
  title: z.string().min(1).max(255),
  category_key: CategoryKeySchema,
  subcategory_id: z.string().optional().nullable(),
  value: z.number().min(0),
  due_day: z.number().int().min(1).max(31).optional().nullable(),
  has_installments: z.boolean().optional(),
  total_installments: z.number().int().min(1).optional().nullable(),
  start_year: z.number().int().min(2000).max(2100).optional().nullable(),
  start_month: z.number().int().min(1).max(12).optional().nullable(),
});

export type CreateRecurringExpenseInput = z.infer<typeof CreateRecurringExpenseInputSchema>;

/**
 * Validate recurring expense update input (all fields optional)
 */
export const UpdateRecurringExpenseInputSchema = CreateRecurringExpenseInputSchema.partial();

export type UpdateRecurringExpenseInput = z.infer<typeof UpdateRecurringExpenseInputSchema>;

/**
 * Validate subcategory creation input
 */
export const CreateSubcategoryInputSchema = z.object({
  name: z.string().min(1).max(255),
  category_key: CategoryKeySchema,
});

export type CreateSubcategoryInput = z.infer<typeof CreateSubcategoryInputSchema>;

/**
 * Validate subcategory update input
 */
export const UpdateSubcategoryInputSchema = CreateSubcategoryInputSchema.partial();

export type UpdateSubcategoryInput = z.infer<typeof UpdateSubcategoryInputSchema>;

/**
 * Validate income source creation input
 */
export const CreateIncomeSourceInputSchema = z.object({
  name: z.string().min(1).max(255),
  value: z.number().min(0),
});

export type CreateIncomeSourceInput = z.infer<typeof CreateIncomeSourceInputSchema>;

/**
 * Validate income source update input
 */
export const UpdateIncomeSourceInputSchema = CreateIncomeSourceInputSchema.partial();

export type UpdateIncomeSourceInput = z.infer<typeof UpdateIncomeSourceInputSchema>;

/**
 * Validate month limits (category percentages)
 */
export const MonthLimitsSchema = z.record(
  CategoryKeySchema,
  z.number().min(0).max(100)
);

export type MonthLimits = z.infer<typeof MonthLimitsSchema>;

/**
 * Safe validation helper
 * Returns {success: true, data} or {success: false, error}
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: unknown } {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}
