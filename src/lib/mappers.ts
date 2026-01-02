/**
 * Type Mappers
 * 
 * Transforms database row types (snake_case) to application types (camelCase)
 * Centralizes all transformations to avoid duplication across storage layers
 */

import type { 
  MonthRow, 
  ExpenseRow, 
  RecurringExpenseRow, 
  SubcategoryRow, 
  IncomeSourceRow 
} from '@/types/database';
import type { Month, Expense, RecurringExpense, Subcategory, IncomeSource, CategoryKey } from '@/types';

/**
 * Map database IncomeSource to application IncomeSource
 */
export const mapIncomeSource = (source: IncomeSourceRow): IncomeSource => ({
  id: source.id,
  monthId: source.month_id,
  name: source.name,
  value: source.value,
});

/**
 * Map database Expense to application Expense
 */
export const mapExpense = (expense: ExpenseRow): Expense => ({
  id: expense.id,
  title: expense.title,
  category: expense.category_key as CategoryKey,
  subcategoryId: expense.subcategory_id ?? undefined,
  value: expense.value,
  isRecurring: expense.is_recurring,
  isPending: expense.is_pending ?? undefined,
  dueDay: expense.due_day ?? undefined,
  recurringExpenseId: expense.recurring_expense_id ?? undefined,
  createdAt: expense.created_at,
  installmentInfo:
    expense.installment_current && expense.installment_total
      ? { current: expense.installment_current, total: expense.installment_total }
      : undefined,
});

/**
 * Map database RecurringExpense to application RecurringExpense
 */
export const mapRecurringExpense = (recurring: RecurringExpenseRow): RecurringExpense => ({
  id: recurring.id,
  title: recurring.title,
  category: recurring.category_key as CategoryKey,
  subcategoryId: recurring.subcategory_id ?? undefined,
  value: recurring.value,
  isRecurring: true as const,
  dueDay: recurring.due_day ?? undefined,
  hasInstallments: recurring.has_installments,
  totalInstallments: recurring.total_installments ?? undefined,
  startYear: recurring.start_year ?? undefined,
  startMonth: recurring.start_month ?? undefined,
});

/**
 * Map database Subcategory to application Subcategory
 */
export const mapSubcategory = (subcategory: SubcategoryRow): Subcategory => ({
  id: subcategory.id,
  name: subcategory.name,
  categoryKey: subcategory.category_key as CategoryKey,
});

/**
 * Map database Month to application Month (minimal - used for building full Month with expenses)
 * 
 * @internal Use mapFullMonth for complete transformation
 */
export const mapMonthRow = (month: MonthRow): Omit<Month, 'expenses' | 'incomeSources' | 'categoryLimits'> => ({
  id: month.id,
  year: month.year,
  month: month.month,
  income: month.income,
  label: `${String(month.month).padStart(2, '0')}/${month.year}`,
});

/**
 * Batch map expenses
 */
export const mapExpenses = (expenses: ExpenseRow[]): Expense[] => 
  expenses.map(mapExpense);

/**
 * Batch map recurring expenses
 */
export const mapRecurringExpenses = (recurringExpenses: RecurringExpenseRow[]): RecurringExpense[] =>
  recurringExpenses.map(mapRecurringExpense);

/**
 * Batch map subcategories
 */
export const mapSubcategories = (subcategories: SubcategoryRow[]): Subcategory[] =>
  subcategories.map(mapSubcategory);

/**
 * Batch map income sources
 */
export const mapIncomeSources = (sources: IncomeSourceRow[]): IncomeSource[] =>
  sources.map(mapIncomeSource);
