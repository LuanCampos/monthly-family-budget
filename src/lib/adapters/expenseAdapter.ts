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
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.put('expenses', offlineExpenseData as any);
    
    // Check for linked goal and create entry
    if (offlineExpenseData.subcategory_id) {
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
    return offlineExpenseData;
  }
  
  // Check for linked goal and create entry
  if (res.data && payload.subcategory_id) {
    await handleGoalEntryCreation(familyId, res.data as any);
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
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const expense = await offlineAdapter.get<any>('expenses', id);
    if (expense) await offlineAdapter.put('expenses', { ...expense, ...data } as any);
    
    // Update goal entry if exists
    if (oldExpense && oldExpense.subcategory_id) {
      await handleGoalEntryUpdate(familyId, id, oldExpense, { ...oldExpense, ...data });
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
  
  // Update goal entry if exists
  if (oldExpense && oldExpense.subcategory_id && res.data) {
    await handleGoalEntryUpdate(familyId, id, oldExpense, res.data as any);
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
      await handleGoalEntryDeletion(familyId, id, expense);
    }
    
    return;
  }
  
  const res = await budgetService.deleteExpenseById(id);
  
  // Delete goal entry if exists
  if (expense && !res.error) {
    await handleGoalEntryDeletion(familyId, id, expense);
  }
  
  return res;
};

/**
 * Helper: Extract month and year from expense
 */
const extractMonthYear = (expense: any): { month: number; year: number } => {
  // Try to extract from month_id (format: YYYY-MM or YYYY-M)
  if (expense.month_id && typeof expense.month_id === 'string') {
    const [yearStr, monthStr] = expense.month_id.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!isNaN(year) && !isNaN(month)) {
      return { year, month };
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
 * Helper: Handle goal entry creation when expense is created
 */
const handleGoalEntryCreation = async (familyId: string, expense: any) => {
  try {
    // Verificar se tem subcategoria vinculada OU se é da categoria 'liberdade'
    let linkedGoal = null;
    
    if (expense.subcategory_id) {
      linkedGoal = await goalAdapter.getGoalBySubcategoryId(expense.subcategory_id);
    }
    
    // Se não encontrou por subcategoria e é da categoria liberdade, buscar pela categoria
    if (!linkedGoal && expense.category_key === 'liberdade') {
      linkedGoal = await goalAdapter.getGoalByCategoryKey('liberdade');
    }
    
    if (!linkedGoal) return;
    
    const { month, year } = extractMonthYear(expense);
    
    await goalAdapter.createEntry(familyId, {
      goalId: linkedGoal.id,
      expenseId: expense.id,
      value: expense.value || 0,
      month,
      year,
    });
    
    await goalAdapter.incrementValue(familyId, linkedGoal.id, expense.value || 0);
    
    logger.info('expense.goal.entry.created', { expenseId: expense.id, goalId: linkedGoal.id });
  } catch (error) {
    logger.error('expense.goal.entry.create.failed', { expenseId: expense.id, error: (error as Error).message });
  }
};

/**
 * Helper: Handle goal entry update when expense is updated
 */
const handleGoalEntryUpdate = async (familyId: string, expenseId: string, oldExpense: any, newExpense: any) => {
  try {
    const entry = await goalAdapter.getEntryByExpense(expenseId);
    if (!entry) return;
    
    // Buscar goal pela subcategoria ou pela categoria liberdade
    let linkedGoal = null;
    if (oldExpense.subcategory_id) {
      linkedGoal = await goalAdapter.getGoalBySubcategoryId(oldExpense.subcategory_id);
    }
    if (!linkedGoal && oldExpense.category_key === 'liberdade') {
      linkedGoal = await goalAdapter.getGoalByCategoryKey('liberdade');
    }
    if (!linkedGoal) return;
    
    const oldValue = oldExpense.value || 0;
    const newValue = newExpense.value || 0;
    const valueDifference = newValue - oldValue;
    
    const { month, year } = extractMonthYear(newExpense);
    
    // Update entry (only month, year - allowed for automatic entries when expense changes)
    await goalAdapter.updateEntry(familyId, entry.id, {
      month,
      year,
    }, true); // allowAutomaticUpdate = true
    
    // Update goal value if value changed
    if (valueDifference !== 0) {
      await goalAdapter.incrementValue(familyId, linkedGoal.id, valueDifference);
    }
    
    logger.info('expense.goal.entry.updated', { expenseId, entryId: entry.id, valueDifference });
  } catch (error) {
    logger.error('expense.goal.entry.update.failed', { expenseId, error: (error as Error).message });
  }
};

/**
 * Helper: Handle goal entry deletion when expense is deleted
 */
const handleGoalEntryDeletion = async (familyId: string, expenseId: string, expense: any) => {
  try {
    const entry = await goalAdapter.getEntryByExpense(expenseId);
    if (!entry) return;
    
    // Buscar goal pela subcategoria ou pela categoria liberdade
    let linkedGoal = null;
    if (expense.subcategory_id) {
      linkedGoal = await goalAdapter.getGoalBySubcategoryId(expense.subcategory_id);
    }
    if (!linkedGoal && expense.category_key === 'liberdade') {
      linkedGoal = await goalAdapter.getGoalByCategoryKey('liberdade');
    }
    if (!linkedGoal) return;
    
    // Decrement goal value
    await goalAdapter.decrementValue(familyId, linkedGoal.id, expense.value || 0);
    
    // Delete the entry (this will cascade from expense deletion in DB, but we do it explicitly for offline)
    if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
      await offlineAdapter.delete('goal_entries', entry.id);
    }
    
    logger.info('expense.goal.entry.deleted', { expenseId, entryId: entry.id, goalId: linkedGoal.id });
  } catch (error) {
    logger.error('expense.goal.entry.delete.failed', { expenseId, error: (error as Error).message });
  }
};
