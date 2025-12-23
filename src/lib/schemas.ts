/**
 * Database Validation Schemas
 * 
 * Zod schemas for validating data from/to Supabase
 * These ensure type safety at runtime, catching issues early
 */

import { z } from 'zod';

/**
 * Category key validation
 * Must match one of the 6 predefined categories
 */
export const CategoryKeySchema = z.enum([
  'essenciais',
  'conforto',
  'metas',
  'prazeres',
  'liberdade',
  'conhecimento'
]);

/**
 * Month row from database
 */
export const MonthRowSchema = z.object({
  id: z.string().min(1),
  family_id: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  income: z.number().min(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MonthRowValidated = z.infer<typeof MonthRowSchema>;

/**
 * Expense row from database
 */
export const ExpenseRowSchema = z.object({
  id: z.string().min(1),
  month_id: z.string().min(1),
  title: z.string().min(1),
  category_key: CategoryKeySchema,
  subcategory_id: z.string().nullable(),
  value: z.number().min(0),
  is_recurring: z.boolean(),
  is_pending: z.boolean(),
  due_day: z.number().int().min(1).max(31).nullable(),
  recurring_expense_id: z.string().nullable(),
  installment_current: z.number().int().nullable(),
  installment_total: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ExpenseRowValidated = z.infer<typeof ExpenseRowSchema>;

/**
 * Recurring expense row from database
 */
export const RecurringExpenseRowSchema = z.object({
  id: z.string().min(1),
  family_id: z.string().min(1),
  title: z.string().min(1),
  category_key: CategoryKeySchema,
  subcategory_id: z.string().nullable(),
  value: z.number().min(0),
  due_day: z.number().int().min(1).max(31).nullable(),
  has_installments: z.boolean(),
  total_installments: z.number().int().min(1).nullable(),
  start_year: z.number().int().min(2000).max(2100).nullable(),
  start_month: z.number().int().min(1).max(12).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type RecurringExpenseRowValidated = z.infer<typeof RecurringExpenseRowSchema>;

/**
 * Subcategory row from database
 */
export const SubcategoryRowSchema = z.object({
  id: z.string().min(1),
  family_id: z.string().min(1),
  name: z.string().min(1).max(255),
  category_key: CategoryKeySchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export type SubcategoryRowValidated = z.infer<typeof SubcategoryRowSchema>;

/**
 * Category limit row from database
 */
export const CategoryLimitRowSchema = z.object({
  id: z.string().min(1),
  month_id: z.string().min(1),
  category_key: CategoryKeySchema,
  percentage: z.number().min(0).max(100),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CategoryLimitRowValidated = z.infer<typeof CategoryLimitRowSchema>;

/**
 * Income source row from database
 */
export const IncomeSourceRowSchema = z.object({
  id: z.string().min(1),
  month_id: z.string().min(1),
  name: z.string().min(1).max(255),
  value: z.number().min(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export type IncomeSourceRowValidated = z.infer<typeof IncomeSourceRowSchema>;

/**
 * Validation utility to safely parse and validate data
 * Returns {success: true, data} or {success: false, error}
 */
export function validateMonthRow(data: unknown) {
  try {
    return { success: true, data: MonthRowSchema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

export function validateExpenseRow(data: unknown) {
  try {
    return { success: true, data: ExpenseRowSchema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

export function validateRecurringExpenseRow(data: unknown) {
  try {
    return { success: true, data: RecurringExpenseRowSchema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

export function validateSubcategoryRow(data: unknown) {
  try {
    return { success: true, data: SubcategoryRowSchema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

export function validateCategoryLimitRow(data: unknown) {
  try {
    return { success: true, data: CategoryLimitRowSchema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

export function validateIncomeSourceRow(data: unknown) {
  try {
    return { success: true, data: IncomeSourceRowSchema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}
