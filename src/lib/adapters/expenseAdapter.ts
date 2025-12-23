/**
 * Expense Adapter
 * 
 * Operations related to expenses
 * Handles both online (Supabase) and offline (IndexedDB) flows
 * 
 * Naming Convention:
 * - insert* : Create operations
 * - update* : Modify operations
 * - delete* : Remove operations
 * - set* : Specific property updates
 */

import * as budgetService from '../services/budgetService';
import { offlineAdapter } from './offlineAdapter';
import { logger } from '../logger';
import type { ExpenseRow } from '@/types/database';

/**
 * Insert a new expense
 */
export const insertExpense = async (familyId: string | null, payload: Partial<ExpenseRow>) => {
  if (!familyId) return null;
  
  const offlineExpenseData = {
    id: offlineAdapter.generateOfflineId('exp'),
    family_id: familyId,
    month_id: payload.month_id,
    title: payload.title,
    category_key: payload.category_key,
    subcategory_id: payload.subcategory_id || null,
    value: payload.value,
    is_recurring: payload.is_recurring || false,
    is_pending: payload.is_pending || false,
    due_day: payload.due_day || null,
    recurring_expense_id: payload.recurring_expense_id || null,
    installment_current: payload.installment_current || null,
    installment_total: payload.installment_total || null,
  };
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.put('expenses', offlineExpenseData as any);
    return offlineExpenseData;
  }
  
  const res = await budgetService.insertExpense({
    ...payload,
    family_id: familyId
  });
  if (res.error) {
    logger.warn('expense.insert.fallback', { title: payload.title, error: res.error.message });
    await offlineAdapter.put('expenses', offlineExpenseData as any);
    await offlineAdapter.sync.add({ type: 'expense', action: 'insert', data: offlineExpenseData, familyId });
  } else {
    return res;
  }
};

/**
 * Update an existing expense
 */
export const updateExpense = async (familyId: string | null, id: string, data: Partial<ExpenseRow>) => {
  if (!familyId) return;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const expense = await offlineAdapter.get<any>('expenses', id);
    if (expense) await offlineAdapter.put('expenses', { ...expense, ...data } as any);
    return;
  }
  
  const res = await budgetService.updateExpense(id, data);
  if (res.error) {
    // Fallback to offline and queue sync if it's an online family
    const expense = await offlineAdapter.get<any>('expenses', id);
    if (expense) await offlineAdapter.put('expenses', { ...expense, ...data } as any);
    // Only queue if it's an online family (created with UUID from Supabase)
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'expense', action: 'update', data: { id, ...data }, familyId });
    }
  }
  return res;
};

/**
 * Set expense pending status
 */
export const setExpensePending = async (familyId: string | null, id: string, pending: boolean) => {
  if (!familyId) return;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const expense = await offlineAdapter.get<any>('expenses', id);
    if (expense) await offlineAdapter.put('expenses', { ...expense, is_pending: pending } as any);
    return;
  }
  
  const res = await budgetService.setExpensePending(id, pending);
  if (res.error) {
    // Fallback to offline and queue sync if it's an online family
    const expense = await offlineAdapter.get<any>('expenses', id);
    if (expense) await offlineAdapter.put('expenses', { ...expense, is_pending: pending } as any);
    // Only queue if it's an online family (created with UUID from Supabase)
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'expense', action: 'update', data: { id, is_pending: pending }, familyId });
    }
  }
  return res;
};

/**
 * Delete an expense
 */
export const deleteExpense = async (familyId: string | null, id: string) => {
  if (!familyId) return;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.delete('expenses', id);
    return;
  }
  
  const res = await budgetService.deleteExpenseById(id);
  return res;
};
