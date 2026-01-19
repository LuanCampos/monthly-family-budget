/**
 * Centralized mock data for testing
 * Use these consistent data across all test files
 */

import type { 
  MonthRow, 
  ExpenseRow, 
  RecurringExpenseRow, 
  SubcategoryRow, 
  CategoryLimitRow,
  IncomeSourceRow,
  GoalRow,
  GoalEntryRow,
} from '@/types/database';
import type { Month, Expense, RecurringExpense, Goal, GoalEntry, Subcategory } from '@/types';

// ============================================================================
// Database Row Mock Data
// ============================================================================

export const createMockMonthRow = (overrides: Partial<MonthRow> = {}): MonthRow => ({
  id: 'month-123',
  family_id: 'family-123',
  year: 2026,
  month: 1,
  income: 5000,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const createMockExpenseRow = (overrides: Partial<ExpenseRow> = {}): ExpenseRow => ({
  id: 'expense-123',
  month_id: 'month-123',
  title: 'Test Expense',
  category_key: 'essenciais',
  subcategory_id: null,
  value: 100,
  is_recurring: false,
  is_pending: false,
  due_day: null,
  recurring_expense_id: null,
  installment_current: null,
  installment_total: null,
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
  ...overrides,
});

export const createMockRecurringExpenseRow = (overrides: Partial<RecurringExpenseRow> = {}): RecurringExpenseRow => ({
  id: 'recurring-123',
  family_id: 'family-123',
  title: 'Netflix',
  category_key: 'prazeres',
  subcategory_id: null,
  value: 45,
  due_day: 10,
  has_installments: false,
  total_installments: null,
  start_year: null,
  start_month: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const createMockSubcategoryRow = (overrides: Partial<SubcategoryRow> = {}): SubcategoryRow => ({
  id: 'subcategory-123',
  family_id: 'family-123',
  name: 'Supermercado',
  category_key: 'essenciais',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const createMockCategoryLimitRow = (overrides: Partial<CategoryLimitRow> = {}): CategoryLimitRow => ({
  id: 'limit-123',
  month_id: 'month-123',
  category_key: 'essenciais',
  percentage: 55,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const createMockIncomeSourceRow = (overrides: Partial<IncomeSourceRow> = {}): IncomeSourceRow => ({
  id: 'income-123',
  month_id: 'month-123',
  name: 'Salary',
  value: 5000,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const createMockGoalRow = (overrides: Partial<GoalRow> = {}): GoalRow => ({
  id: 'goal-123',
  family_id: 'family-123',
  name: 'Emergency Fund',
  target_value: 10000,
  target_month: null,
  target_year: null,
  account: null,
  linked_subcategory_id: null,
  linked_category_key: null,
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const createMockGoalEntryRow = (overrides: Partial<GoalEntryRow> = {}): GoalEntryRow => ({
  id: 'entry-123',
  goal_id: 'goal-123',
  expense_id: null,
  value: 500,
  description: 'Monthly deposit',
  month: 1,
  year: 2026,
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
  ...overrides,
});

// ============================================================================
// Application Type Mock Data
// ============================================================================

export const createMockMonth = (overrides: Partial<Month> = {}): Month => ({
  id: 'month-123',
  year: 2026,
  month: 1,
  income: 5000,
  expenses: [],
  categoryLimits: {
    essenciais: 55,
    conforto: 10,
    metas: 10,
    prazeres: 10,
    liberdade: 10,
    conhecimento: 5,
  },
  ...overrides,
});

export const createMockExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-123',
  title: 'Test Expense',
  category: 'essenciais',
  value: 100,
  isRecurring: false,
  isPending: false,
  ...overrides,
});

export const createMockRecurringExpense = (overrides: Partial<RecurringExpense> = {}): RecurringExpense => ({
  id: 'recurring-123',
  title: 'Netflix',
  category: 'prazeres',
  value: 45,
  isRecurring: true,
  dueDay: 10,
  ...overrides,
});

export const createMockGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'goal-123',
  familyId: 'family-123',
  name: 'Emergency Fund',
  targetValue: 10000,
  currentValue: 0,
  status: 'active',
  ...overrides,
});

export const createMockGoalEntry = (overrides: Partial<GoalEntry> = {}): GoalEntry => ({
  id: 'entry-123',
  goalId: 'goal-123',
  value: 500,
  description: 'Monthly deposit',
  month: 1,
  year: 2026,
  ...overrides,
});

export const createMockSubcategory = (overrides: Partial<Subcategory> = {}): Subcategory => ({
  id: 'subcategory-123',
  name: 'Supermercado',
  categoryKey: 'essenciais',
  ...overrides,
});

// ============================================================================
// Default Category Limits
// ============================================================================

export const DEFAULT_CATEGORY_LIMITS = {
  essenciais: 55,
  conforto: 10,
  metas: 10,
  prazeres: 10,
  liberdade: 10,
  conhecimento: 5,
} as const;
