/**
 * Expense Adapter
 * 
 * Operations related to expenses
 * Handles both online (Supabase) and offline (IndexedDB) flows
 * Integrates with goalAdapter to create/update/delete goal entries
 * 
 * Naming Convention:
 * - insert* : Create operations
 * - update* : Modify operations
 * - delete* : Remove operations
 * - set* : Specific property updates
 */

import * as budgetService from '../services/budgetService';
import * as goalAdapter from './goalAdapter';
import { offlineAdapter } from './offlineAdapter';
import { logger } from '../logger';
import type { ExpenseRow } from '@/types/database';

/**
 * Insert a new expense
 * If the expense has a subcategory linked to a goal, create an automatic goal entry
 */
export const insertExpense = async (familyId: string | null, payload: Partial<ExpenseRow>) => {
  if (!familyId) return null;

  const now = new Date().toISOString();
  
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
    created_at: now,
    updated_at: now,
  };
  const shouldCreateEntryOffline = !offlineExpenseData.is_pending;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.put('expenses', offlineExpenseData as any);
    
    // Check for linked goal and create entry only if already paid
    if (shouldCreateEntryOffline) {
      await handleGoalEntryCreation(familyId, offlineExpenseData as any);
    }
    
    return offlineExpenseData;
  }
  
  const res = await budgetService.insertExpense({
    ...payload,
    family_id: familyId
  });
  if (res.error) {
    logger.warn('expense.insert.fallback', { title: payload.title, error: res.error.message });
    await offlineAdapter.put('expenses', offlineExpenseData as any);
    // Only queue sync if it's an online family (not an offline family)
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'expense', action: 'insert', data: offlineExpenseData, familyId });
    }
    if (shouldCreateEntryOffline) {
      await handleGoalEntryCreation(familyId, offlineExpenseData as any);
    }
    return offlineExpenseData;
  }
  
  const expenseData = res.data as any;
  const shouldCreateEntryOnline = expenseData && !expenseData.is_pending;
  if (expenseData && shouldCreateEntryOnline) {
    await handleGoalEntryCreation(familyId, expenseData);
  }
  
  return res;
};

/**
 * Update an existing expense
 * If the expense value or dates change and it's linked to a goal, update the goal entry
 */
export const updateExpense = async (familyId: string | null, id: string, data: Partial<ExpenseRow>) => {
  if (!familyId) return;
  
  // Get the old expense data before updating
  const oldExpense = await offlineAdapter.get<any>('expenses', id);
  const mergedOfflineExpense = oldExpense ? { ...oldExpense, ...data } : null;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const expense = await offlineAdapter.get<any>('expenses', id);
    if (expense) await offlineAdapter.put('expenses', { ...expense, ...data } as any);

    if (mergedOfflineExpense) {
      await handleGoalEntryUpdate(familyId, id, oldExpense, mergedOfflineExpense);
    }
    
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
  
  const updatedExpense = (res && res.data) ? res.data as any : mergedOfflineExpense;
  if (updatedExpense) {
    await handleGoalEntryUpdate(familyId, id, oldExpense, updatedExpense);
    await offlineAdapter.put('expenses', updatedExpense as any);
  }
  
  return res;
};

/**
 * Set expense pending status
 */
export const setExpensePending = async (familyId: string | null, id: string, pending: boolean) => {
  if (!familyId) return;
  const currentExpense = await offlineAdapter.get<any>('expenses', id);
  if (!currentExpense) return;
  const updatedExpense = { ...currentExpense, is_pending: pending } as any;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.put('expenses', updatedExpense);
    await handleGoalEntryUpdate(familyId, id, currentExpense, updatedExpense);
    return;
  }
  
  const res = await budgetService.setExpensePending(id, pending);
  if (res.error) {
    // Fallback to offline and queue sync if it's an online family
    await offlineAdapter.put('expenses', updatedExpense);
    // Only queue if it's an online family (created with UUID from Supabase)
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'expense', action: 'update', data: { id, is_pending: pending }, familyId });
    }
  }
  const persistedExpense = (res && (res as any).data) ? (res as any).data : updatedExpense;
  await offlineAdapter.put('expenses', persistedExpense as any);
  await handleGoalEntryUpdate(familyId, id, currentExpense, persistedExpense as any);
  return res;
};

/**
 * Delete an expense
 * If the expense is linked to a goal entry, delete the entry and update the goal value
 */
export const deleteExpense = async (familyId: string | null, id: string) => {
  if (!familyId) return;
  
  // Get the expense before deleting to check for goal entry
  const expense = await offlineAdapter.get<any>('expenses', id);
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.delete('expenses', id);
    
    // Delete goal entry if exists
    if (expense) {
      await handleGoalEntryDeletion(familyId, id);
    }
    
    return;
  }
  
  const res = await budgetService.deleteExpenseById(id);
  
  // Delete goal entry if exists
  if (expense && !res.error) {
    await handleGoalEntryDeletion(familyId, id);
  }
  
  return res;
};

/**
 * Helper: Extract month and year from expense
 */
const extractMonthYear = (expense: any): { month: number; year: number } => {
  // Try to extract from month_id (format: familyId-YYYY-MM)
  if (expense.month_id && typeof expense.month_id === 'string') {
    const parts = expense.month_id.split('-');
    // month_id format: familyId-YYYY-MM (3 parts)
    if (parts.length >= 3) {
      const year = parseInt(parts[parts.length - 2], 10);
      const month = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(year) && !isNaN(month)) {
        return { year, month };
      }
    }
  }
  
  // Fallback to current date
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
};

/**
 * Helper: Find linked goal by subcategory or category 'liberdade'
 */
const findLinkedGoal = async (expense: any) => {
  if (!expense) return null;
  if (expense.subcategory_id) {
    const goal = await goalAdapter.getGoalBySubcategoryId(expense.subcategory_id);
    if (goal) return goal;
  }
  if (expense.category_key === 'liberdade') {
    return goalAdapter.getGoalByCategoryKey('liberdade');
  }
  return null;
};

const createGoalEntryFromExpense = async (familyId: string, goalId: string, expense: any) => {
  const { month, year } = extractMonthYear(expense);
  await goalAdapter.createEntry(familyId, {
    goalId,
    expenseId: expense.id,
    value: expense.value || 0,
    month,
    year,
    description: expense.title,
  });
  logger.debug('expense.goal.entry.created', { expenseId: expense.id, goalId });
};

/**
 * Helper: Handle goal entry creation when expense is created or marked as paid
 */
const handleGoalEntryCreation = async (familyId: string, expense: any) => {
  try {
    if (expense.is_pending) return;
    const linkedGoal = await findLinkedGoal(expense);
    if (!linkedGoal) return;

    const existingEntry = await goalAdapter.getEntryByExpense(expense.id);
    if (existingEntry) return;

    await createGoalEntryFromExpense(familyId, linkedGoal.id, expense);
  } catch (error) {
    logger.error('expense.goal.entry.create.failed', { expenseId: expense.id, error: (error as Error).message });
  }
};

/**
 * Helper: Handle goal entry update when expense is updated or pending flag changes
 */
const handleGoalEntryUpdate = async (familyId: string, expenseId: string, _oldExpense: any, newExpense: any) => {
  try {
    const entry = await goalAdapter.getEntryByExpense(expenseId);
    const linkedGoal = await findLinkedGoal(newExpense);
    const shouldHaveEntry = !newExpense?.is_pending && !!linkedGoal;

    // If entry exists and should be deleted (no longer linked or pending)
    if (entry && (!shouldHaveEntry || (linkedGoal && entry.goalId !== linkedGoal.id))) {
      await goalAdapter.deleteEntry(familyId, entry.id, true);
    }

    // If should not have entry, we're done
    if (!shouldHaveEntry) return;

    // If entry exists and goal is the same, just update it
    if (entry && linkedGoal && entry.goalId === linkedGoal.id) {
      const { month, year } = extractMonthYear(newExpense);
      await goalAdapter.updateEntry(familyId, entry.id, {
        value: newExpense.value || 0,
        month,
        year,
        description: newExpense.title,
      }, true);
      logger.debug('expense.goal.entry.updated', { expenseId, entryId: entry.id, goalId: entry.goalId });
      return;
    }

    // If no entry exists but should (e.g., expense marked as paid), create it
    if (!entry && linkedGoal) {
      await createGoalEntryFromExpense(familyId, linkedGoal.id, newExpense);
    }
  } catch (error) {
    logger.error('expense.goal.entry.update.failed', { expenseId, error: (error as Error).message });
  }
};

/**
 * Helper: Handle goal entry deletion when expense is deleted or loses link/payment
 */
const handleGoalEntryDeletion = async (familyId: string, expenseId: string) => {
  try {
    const entry = await goalAdapter.getEntryByExpense(expenseId);
    if (!entry) return;

    await goalAdapter.deleteEntry(familyId, entry.id, true);
    logger.debug('expense.goal.entry.deleted', { expenseId, entryId: entry.id, goalId: entry.goalId });
  } catch (error) {
    logger.error('expense.goal.entry.delete.failed', { expenseId, error: (error as Error).message });
  }
};
