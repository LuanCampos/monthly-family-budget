/**
 * Recurring Expense Adapter
 * 
 * Operations related to recurring expenses
 * Handles both online (Supabase) and offline (IndexedDB) flows
 * 
 * Naming Convention:
 * - get* : Read operations
 * - insert* : Create operations
 * - update* : Modify operations
 * - delete* : Remove operations
 */

import * as budgetService from '../services/budgetService';
import { offlineAdapter } from './offlineAdapter';
import * as expenseAdapter from './expenseAdapter';
import { logger } from '../logger';
import type { RecurringExpense } from '@/types';
import type { RecurringExpenseRow } from '@/types/database';
import { shouldIncludeRecurringInMonth } from '../utils/monthUtils';
import { mapRecurringExpenses } from '../mappers';

/**
 * Get all recurring expenses for a family
 */
export const getRecurringExpenses = async (familyId: string | null) => {
  if (!familyId) return [] as RecurringExpense[];
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const data = await offlineAdapter.getAllByIndex<any>('recurring_expenses', 'family_id', familyId);
    return mapRecurringExpenses(data || []);
  }

  const { data, error } = await budgetService.getRecurringExpenses(familyId);
  if (error) { logger.error('recurring.load.failed', { familyId, error }); return [] as RecurringExpense[]; }
  return mapRecurringExpenses(data || []);
};

/**
 * Insert a new recurring expense
 */
export const insertRecurring = async (familyId: string | null, payload: Partial<RecurringExpenseRow>) => {
  if (!familyId) return null;
  
  const offlineId = offlineAdapter.generateOfflineId('rec');
  const offlineRecurringData = { id: offlineId, family_id: familyId, ...payload };
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.put('recurring_expenses', offlineRecurringData as any);
    return offlineRecurringData;
  }
  
  const res = await budgetService.insertRecurring(familyId, payload);
  if (res.error || !res.data) {
    await offlineAdapter.put('recurring_expenses', offlineRecurringData as any);
    // Only queue sync if it's an online family (not an offline family)
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'recurring_expense', action: 'insert', data: offlineRecurringData, familyId });
    }
  }
  return res;
};

/**
 * Update a recurring expense
 * 
 * @param updatePastExpenses If true, also updates existing expenses generated from this recurring
 */
export const updateRecurring = async (familyId: string | null, id: string, data: Partial<RecurringExpenseRow>, updatePastExpenses?: boolean) => {
  if (!familyId) return;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    // Update the recurring expense itself
    const rec = await offlineAdapter.get<any>('recurring_expenses', id);
    if (rec) await offlineAdapter.put('recurring_expenses', { ...rec, ...data } as any);
    
    // If requested, also update all related expenses
    if (updatePastExpenses) {
      try {
        // Get all expenses (no index available for recurring_expense_id, so we need to filter)
        const allExpenses = await offlineAdapter.getAll<any>('expenses');
        if (allExpenses && allExpenses.length > 0) {
          // Map recurring fields to expense fields
          const expenseUpdateData: any = {};
          if (data.title) expenseUpdateData.title = data.title;
          if (data.category_key) expenseUpdateData.category_key = data.category_key;
          if (data.subcategory_id !== undefined) expenseUpdateData.subcategory_id = data.subcategory_id;
          if (data.value !== undefined) expenseUpdateData.value = data.value;
          if (data.due_day !== undefined) expenseUpdateData.due_day = data.due_day;
          
          // Filter and update expenses related to this recurring
          const relatedExpenses = allExpenses.filter((exp: any) => exp.recurring_expense_id === id);
          for (const expense of relatedExpenses) {
            await offlineAdapter.put('expenses', { ...expense, ...expenseUpdateData } as any);
          }
        }
      } catch (error) {
        logger.warn('updateRecurring.offline.related.error', { error });
      }
    }
    return;
  }
  
  const res = await budgetService.updateRecurring(id, data);
  if (updatePastExpenses) {
    // Map recurring fields to expense fields for the update
    const expenseUpdateData: any = {};
    if (data.title) expenseUpdateData.title = data.title;
    if (data.category_key) expenseUpdateData.category_key = data.category_key;
    if (data.subcategory_id !== undefined) expenseUpdateData.subcategory_id = data.subcategory_id;
    if (data.value !== undefined) expenseUpdateData.value = data.value;
    if (data.due_day !== undefined) expenseUpdateData.due_day = data.due_day;
    
    await budgetService.updateExpensesByRecurringId(id, expenseUpdateData);
  }
  return res;
};

/**
 * Delete a recurring expense
 */
export const deleteRecurring = async (familyId: string | null, id: string) => {
  if (!familyId) return;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.delete('recurring_expenses', id);
    return;
  }
  
  const res = await budgetService.deleteRecurring(id);
  return res;
};

/**
 * Apply a recurring expense to a specific month
 * Creates an expense record if the recurring should be included in that month
 */
export const applyRecurringToMonth = async (familyId: string | null, recurring: RecurringExpense, monthId: string) => {
  if (!familyId) return false;
  
  let targetYear: number | undefined;
  let targetMonth: number | undefined;

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const month = await offlineAdapter.get<any>('months', monthId);
    if (!month) return false;
    targetYear = month.year;
    targetMonth = month.month;
  } else {
    const m = await budgetService.getMonthById(monthId);
    if (!m || !m.data || !m.data[0]) {
      const months = await budgetService.getMonths(familyId);
      const found = (months.data || []).find((mm: any) => mm.id === monthId);
      if (!found) return false;
      targetYear = found.year;
      targetMonth = found.month;
    } else {
      targetYear = m.data.year ?? m.data[0].year ?? undefined;
      targetMonth = m.data.month ?? m.data[0].month ?? undefined;
    }
  }

  if (targetYear === undefined || targetMonth === undefined) return false;

  const result = shouldIncludeRecurringInMonth(recurring as any, targetYear, targetMonth);

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const now = new Date().toISOString();
    const expenseData = {
      id: offlineAdapter.generateOfflineId('exp'),
      family_id: familyId,
      month_id: monthId,
      title: recurring.title,
      category_key: recurring.category,
      subcategory_id: recurring.subcategoryId || null,
      value: recurring.value,
      is_recurring: true,
      is_pending: true,
      due_day: recurring.dueDay,
      recurring_expense_id: recurring.id,
      installment_current: recurring.hasInstallments ? result.installmentNumber : null,
      installment_total: recurring.hasInstallments ? recurring.totalInstallments : null,
      created_at: now,
      updated_at: now,
    };
    await offlineAdapter.put('expenses', expenseData as any);
    return true;
  }

  const res = await expenseAdapter.insertExpense(familyId, {
    month_id: monthId,
    title: recurring.title,
    category_key: recurring.category,
    subcategory_id: recurring.subcategoryId || null,
    value: recurring.value,
    is_recurring: true,
    is_pending: true,
    due_day: recurring.dueDay,
    recurring_expense_id: recurring.id,
    installment_current: recurring.hasInstallments ? result.installmentNumber : null,
    installment_total: recurring.hasInstallments ? recurring.totalInstallments : null
  });
  
  if (res && 'error' in res && res.error) {
    logger.warn('applyRecurringToMonth.failed', { error: res.error.message });
    return false;
  }
  
  return true;
};
