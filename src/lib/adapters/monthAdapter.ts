/**
 * Month Adapter
 * 
 * Operations related to months and their management 
 * Handles both online (Supabase) and offline (IndexedDB) flows
 * 
 * Naming Convention:
 * - insert* : Create operations
 * - update* : Modify operations
 * - delete* : Remove operations
 * - get* : Read operations
 */

import * as budgetService from '../services/budgetService';
import { offlineAdapter } from './offlineAdapter';
import * as expenseAdapter from './expenseAdapter';
import { logger } from '../logger';
import type { Month, CategoryKey, RecurringExpense } from '@/types';
import type { MonthRow, ExpenseRow, CategoryLimitRow, IncomeSourceRow, RecurringExpenseRow } from '@/types/database';
import { CATEGORIES } from '@/constants/categories';
import { getMonthLabel as _getMonthLabel, shouldIncludeRecurringInMonth } from '../utils/monthUtils';
import { mapIncomeSources, mapRecurringExpense } from '../mappers';

const getDefaultLimits = (): Record<CategoryKey, number> => {
  return Object.fromEntries(CATEGORIES.map(c => [c.key, c.percentage])) as Record<CategoryKey, number>;
};

/**
 * Find category limits from the most recent existing month
 * Used when creating a new month to inherit limits
 */const findPreviousMonthLimits = async (
  familyId: string,
  getMonthsWithExpenses: (id: string) => Promise<Month[]>
): Promise<Record<CategoryKey, number>> => {
  const existingMonths = await getMonthsWithExpenses(familyId);
  if (existingMonths.length === 0) return getDefaultLimits();
  
  const sorted = [...existingMonths].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
  
  const previousMonth = sorted[0];
  // Ensure we return valid limits with all required categories
  const limits = previousMonth.categoryLimits || getDefaultLimits();
  
  // Ensure all categories are present
  const completeLimits: Record<CategoryKey, number> = { ...getDefaultLimits() };
  Object.entries(limits).forEach(([key, value]) => {
    completeLimits[key as CategoryKey] = value;
  });
  
  return completeLimits;
};

/**
 * Insert a new month with automatic limit inheritance and recurring expense application
 * 
 * Creates the month, copies limits from previous month, and applies recurring expenses
 */
export const insertMonth = async (
  familyId: string | null,
  year: number,
  month: number,
  getMonthsWithExpenses: (id: string) => Promise<Month[]>,
  getRecurringExpenses: (id: string) => Promise<RecurringExpense[]>
) => {
  if (!familyId) return null;
  
  const offlineMonthId = `${familyId}-${year.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}`;
  const offlineMonthData: Partial<MonthRow> = { id: offlineMonthId, family_id: familyId, year, month, income: 0 };

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    // Find limits BEFORE saving the new month (to avoid it being the "previous" month)
    const limitsToUse = await findPreviousMonthLimits(familyId, getMonthsWithExpenses);
    
    // Now save the month
    await offlineAdapter.put('months', offlineMonthData);
    
    for (const [categoryKey, percentage] of Object.entries(limitsToUse)) {
      const limitData: Partial<CategoryLimitRow> = {
        id: `${offlineMonthId}-${categoryKey}`,
        month_id: offlineMonthId,
        category_key: categoryKey,
        percentage
      };
      await offlineAdapter.put('category_limits', limitData);
    }
    
    for (const recurring of (await offlineAdapter.getAllByIndex<RecurringExpenseRow>('recurring_expenses', 'family_id', familyId)) || []) {
      const mappedRecurring = mapRecurringExpense(recurring);
      const result = shouldIncludeRecurringInMonth(mappedRecurring, year, month);
      if (result.include) {
        const now = new Date().toISOString();
        const expenseData: Partial<ExpenseRow> = {
          id: offlineAdapter.generateOfflineId('exp'),
          family_id: familyId,
          month_id: offlineMonthId,
          title: recurring.title,
          category_key: recurring.category_key,
          subcategory_id: recurring.subcategory_id,
          value: recurring.value,
          is_recurring: true,
          is_pending: true,
          due_day: recurring.due_day,
          recurring_expense_id: recurring.id,
          installment_current: mappedRecurring.hasInstallments ? result.installmentNumber : null,
          installment_total: mappedRecurring.hasInstallments ? (mappedRecurring.totalInstallments ?? null) : null,
          created_at: now,
          updated_at: now,
        };
        await offlineAdapter.put('expenses', expenseData);
      }
    }
    return offlineMonthData;
  }

  const { data, error } = await budgetService.insertMonth(familyId, year, month);
  if (error || !data) {
    // Fallback to offline when online fails
    // Find limits BEFORE saving the month (to avoid it being the "previous" month)
    const limitsToUse = await findPreviousMonthLimits(familyId, getMonthsWithExpenses);
    
    await offlineAdapter.put('months', offlineMonthData);
    
    for (const [categoryKey, percentage] of Object.entries(limitsToUse)) {
      const limitData: Partial<CategoryLimitRow> = {
        id: `${offlineMonthId}-${categoryKey}`,
        month_id: offlineMonthId,
        category_key: categoryKey,
        percentage
      };
      await offlineAdapter.put('category_limits', limitData);
    }
    
    // Only queue sync if it's an online family (not an offline family)
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'month', action: 'insert', data: offlineMonthData as Record<string, unknown>, familyId });
    }
    return offlineMonthData;
  }

  const existingMonths = await getMonthsWithExpenses(familyId);
  const otherMonths = existingMonths.filter(m => m.id !== data.id);
  
  if (otherMonths.length > 0) {
    const sorted = [...otherMonths].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    const previousMonth = sorted[0];
    if (previousMonth.categoryLimits) {
      for (const [categoryKey, percentage] of Object.entries(previousMonth.categoryLimits)) {
        await budgetService.insertMonthLimit({ month_id: data.id, category_key: categoryKey, percentage });
      }
    }
  } else {
    const defaultLimits = getDefaultLimits();
    for (const [categoryKey, percentage] of Object.entries(defaultLimits)) {
      await budgetService.insertMonthLimit({ month_id: data.id, category_key: categoryKey, percentage });
    }
  }

  for (const recurring of (await getRecurringExpenses(familyId)) || []) {
    const result = shouldIncludeRecurringInMonth(recurring, year, month);
    if (result.include) {
      await expenseAdapter.insertExpense(familyId, {
        month_id: data.id,
        title: recurring.title,
        category_key: recurring.category,
        subcategory_id: recurring.subcategoryId ?? null,
        value: recurring.value,
        is_recurring: true,
        is_pending: true,
        due_day: recurring.dueDay ?? null,
        recurring_expense_id: recurring.id,
        installment_current: recurring.hasInstallments ? result.installmentNumber : null,
        installment_total: recurring.hasInstallments ? (recurring.totalInstallments ?? null) : null,
      });
    }
  }

  return data;
};

/**
 * Update income for a month
 */
export const updateMonthIncome = async (familyId: string | null, monthId: string, income: number) => {
  if (!familyId) return;
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const month = await offlineAdapter.get<MonthRow>('months', monthId);
    if (month) await offlineAdapter.put('months', { ...month, income });
    return;
  }
  const { error } = await budgetService.updateMonthIncome(monthId, income);
  return { error };
};

/**
 * Delete a month and all associated data
 */
export const deleteMonth = async (familyId: string | null, monthId: string) => {
  if (!familyId) return;

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.delete('months', monthId);
    const expenses = await offlineAdapter.getAllByIndex<ExpenseRow>('expenses', 'month_id', monthId);
    for (const expense of expenses || []) {
      await offlineAdapter.delete('expenses', expense.id);
    }
    const limits = await offlineAdapter.getAllByIndex<CategoryLimitRow>('category_limits', 'month_id', monthId);
    for (const limit of limits || []) {
      await offlineAdapter.delete('category_limits', limit.id);
    }
    const incomeSources = await offlineAdapter.getAllByIndex<IncomeSourceRow>('income_sources', 'month_id', monthId);
    for (const source of incomeSources || []) {
      await offlineAdapter.delete('income_sources', source.id);
    }
    return;
  }

  // Delete associated expenses first
  await budgetService.deleteExpensesByMonth(monthId);
  // Then delete the month
  await budgetService.deleteMonthById(monthId);
};

/**
 * Update category limits for a month
 * Validates that all percentages sum to 100
 */
export const updateMonthLimits = async (familyId: string | null, monthId: string, newLimits: Record<CategoryKey, number>) => {
  if (!familyId) return;
  
  // Validate that limits sum to 100%
  const total = Object.values(newLimits).reduce((sum, val) => sum + val, 0);
  if (Math.abs(total - 100) > 0.01) {
    logger.warn('monthLimits.validation.failed', { monthId, total, expected: 100 });
    throw new Error(`Month limits must sum to 100%, but got ${total.toFixed(2)}%`);
  }

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    for (const [categoryKey, percentage] of Object.entries(newLimits)) {
      const limitId = `${monthId}-${categoryKey}`;
      const existing = await offlineAdapter.get<CategoryLimitRow>('category_limits', limitId);
      if (existing) {
        await offlineAdapter.put('category_limits', { ...existing, percentage });
      } else {
        const newLimit: Partial<CategoryLimitRow> = {
          id: limitId,
          month_id: monthId,
          category_key: categoryKey,
          percentage
        };
        await offlineAdapter.put('category_limits', newLimit);
      }
    }
    return;
  }

  for (const [categoryKey, percentage] of Object.entries(newLimits)) {
    await budgetService.updateMonthLimit(monthId, categoryKey, percentage);
  }
};

/**
 * Get income sources for a month
 */
export const getIncomeSourcesByMonth = async (monthId: string) => {
  const { data, error } = await budgetService.getIncomeSourcesByMonth(monthId);
  if (error) {
    logger.error('incomeSource.load.failed', { monthId, error });
    return [];
  }
  return mapIncomeSources(data || []);
};

/**
 * Insert a new income source for a month
 */
export const insertIncomeSource = async (familyId: string | null, monthId: string, name: string, value: number) => {
  if (!familyId) return null;
  
  const offlineId = offlineAdapter.generateOfflineId('inc');
  const offlineData: Partial<IncomeSourceRow> = { id: offlineId, month_id: monthId, name, value };

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.put('income_sources', offlineData);
    return offlineData;
  }

  const { data, error } = await budgetService.insertIncomeSource(monthId, name, value);
  if (error || !data) {
    await offlineAdapter.put('income_sources', offlineData);
    // Only queue sync if it's an online family (not an offline family)
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'income_source', action: 'insert', data: offlineData as Record<string, unknown>, familyId });
    }
    return offlineData;
  }
  return data;
};

/**
 * Update an income source
 */
export const updateIncomeSource = async (familyId: string | null, id: string, name: string, value: number) => {
  if (!familyId) return;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const source = await offlineAdapter.get<IncomeSourceRow>('income_sources', id);
    if (source) await offlineAdapter.put('income_sources', { ...source, name, value });
    return;
  }

  const { data, error } = await budgetService.updateIncomeSourceById(id, name, value);
  if (error) {
    // Fallback to offline and queue sync if it's an online family
    const source = await offlineAdapter.get<IncomeSourceRow>('income_sources', id);
    if (source) await offlineAdapter.put('income_sources', { ...source, name, value });
    // Only queue if it's an online family (created with UUID from Supabase)
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'income_source', action: 'update', data: { id, name, value }, familyId });
    }
  }
  return { data, error };
};

/**
 * Delete an income source
 */
export const deleteIncomeSource = async (familyId: string | null, id: string) => {
  if (!familyId) return;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.delete('income_sources', id);
    return;
  }

  await budgetService.deleteIncomeSourceById(id);
};
