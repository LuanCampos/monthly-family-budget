import * as goalService from '../services/goalService';
import * as budgetService from '../services/budgetService';
import { offlineAdapter } from './offlineAdapter';
import { logger } from '../logger';
import {
  CreateGoalInputSchema,
  UpdateGoalInputSchema,
  CreateGoalEntryInputSchema,
  CreateManualGoalEntryInputSchema,
  UpdateGoalEntryInputSchema,
} from '../validators';
import { mapGoal, mapGoals, mapGoalEntries, mapGoalEntry, mapExpense } from '../mappers';
import type { Goal, GoalEntry, Expense } from '@/types';

interface GoalPayload {
  name: string;
  targetValue: number;
  currentValue?: number;
  targetMonth?: number;
  targetYear?: number;
  account?: string;
  linkedSubcategoryId?: string;
  linkedCategoryKey?: string;
}

interface GoalEntryPayload {
  goalId: string;
  expenseId?: string;
  value: number;
  description?: string;
  month: number;
  year: number;
}

const ensureSubcategoryIsValid = async (familyId: string, subcategoryId: string | undefined, categoryKey: string | undefined, currentGoalId?: string) => {
  // Simplified - let database handle constraints if any
  // Just verify subcategory exists if provided
  if (!subcategoryId && !categoryKey) return;

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    if (subcategoryId) {
      const subcategory = await offlineAdapter.get<any>('subcategories', subcategoryId);
      if (!subcategory) throw new Error('Subcategory not found');
    }
    return;
  }

  if (subcategoryId) {
    const { data: subcategories, error } = await budgetService.getSubcategories(familyId);
    if (error) throw error;
    const subcategory = (subcategories || []).find((s: any) => s.id === subcategoryId);
    if (!subcategory) throw new Error('Subcategory not found');
  }
};

const toGoalRow = (familyId: string, payload: GoalPayload) => {
  const data: any = {
    family_id: familyId,
    name: payload.name,
    current_value: payload.currentValue ?? 0,
    target_value: payload.targetValue,
    target_month: payload.targetMonth ?? null,
    target_year: payload.targetYear ?? null,
    account: payload.account ?? null,
    linked_subcategory_id: payload.linkedSubcategoryId ?? null,
    linked_category_key: payload.linkedCategoryKey ?? null,
  };
  
  CreateGoalInputSchema.parse(data);
  return data;
};

const toGoalEntryRow = (payload: GoalEntryPayload) => {
  const base = {
    goal_id: payload.goalId,
    expense_id: payload.expenseId ?? null,
    value: payload.value,
    description: payload.description ?? null,
    month: payload.month,
    year: payload.year,
  };
  if (payload.expenseId) {
    CreateGoalEntryInputSchema.parse(base);
  } else {
    CreateManualGoalEntryInputSchema.parse({ ...base, expense_id: undefined });
  }
  return base;
};

const updateOfflineGoalValue = async (goalId: string, delta: number) => {
  const goal = await offlineAdapter.get<any>('goals', goalId);
  if (!goal) return;
  const updatedValue = Number(goal.current_value || 0) + delta;
  await offlineAdapter.put('goals', {
    ...goal,
    current_value: updatedValue,
    updated_at: new Date().toISOString(),
  } as any);
};

export const getGoals = async (familyId: string | null): Promise<Goal[]> => {
  if (!familyId) return [];

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const data = await offlineAdapter.getAllByIndex<any>('goals', 'family_id', familyId);
    return mapGoals(data || []);
  }

  const { data, error } = await goalService.getGoals(familyId);
  if (error) {
    logger.error('goal.list.failed', { familyId, error: error.message });
    return [];
  }
  return mapGoals(data || []);
};

export const createGoal = async (familyId: string | null, payload: GoalPayload): Promise<Goal | null> => {
  if (!familyId) return null;

  if (payload.linkedSubcategoryId || payload.linkedCategoryKey) {
    await ensureSubcategoryIsValid(familyId, payload.linkedSubcategoryId, payload.linkedCategoryKey);
  }

  const goalRow = toGoalRow(familyId, payload);
  const now = new Date().toISOString();
  const offlineGoal = {
    id: offlineAdapter.generateOfflineId('goal'),
    ...goalRow,
    created_at: now,
    updated_at: now,
  };

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.put('goals', offlineGoal as any);
    return mapGoal(offlineGoal as any);
  }

  const { data, error } = await goalService.createGoal(goalRow);
  if (error || !data) {
    logger.warn('goal.create.fallback', { familyId, error: error?.message });
    await offlineAdapter.put('goals', offlineGoal as any);
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'goal', action: 'insert', data: offlineGoal, familyId });
    }
    return mapGoal(offlineGoal as any);
  }

  return mapGoal(data);
};

export const updateGoal = async (familyId: string | null, goalId: string, payload: Partial<GoalPayload>): Promise<void> => {
  if (!familyId) return;

  if (payload.linkedSubcategoryId || payload.linkedCategoryKey) {
    await ensureSubcategoryIsValid(familyId, payload.linkedSubcategoryId, payload.linkedCategoryKey, goalId);
  }

  const updateData: any = {
    name: payload.name,
    current_value: payload.currentValue,
    target_value: payload.targetValue,
    target_month: payload.targetMonth,
    target_year: payload.targetYear,
    account: payload.account,
    linked_subcategory_id: payload.linkedSubcategoryId,
  };

  // Só adiciona linked_category_key se estiver presente
  if (payload.linkedCategoryKey) {
    updateData.linked_category_key = payload.linkedCategoryKey;
  }

  UpdateGoalInputSchema.parse(updateData);

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const goal = await offlineAdapter.get<any>('goals', goalId);
    if (goal) {
      await offlineAdapter.put('goals', { ...goal, ...updateData, updated_at: new Date().toISOString() } as any);
    }
    return;
  }

  const { error } = await goalService.updateGoal(goalId, updateData);
  if (error) {
    logger.warn('goal.update.fallback', { goalId, error: error.message });
    const goal = await offlineAdapter.get<any>('goals', goalId);
    if (goal) {
      await offlineAdapter.put('goals', { ...goal, ...updateData, updated_at: new Date().toISOString() } as any);
    }
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'goal', action: 'update', data: { id: goalId, ...updateData }, familyId });
    }
  }
};

export const deleteGoal = async (familyId: string | null, goalId: string): Promise<void> => {
  if (!familyId) return;

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const entries = await offlineAdapter.getAllByIndex<any>('goal_entries', 'goal_id', goalId);
    await Promise.all(entries.map((entry: any) => offlineAdapter.delete('goal_entries', entry.id)));
    await offlineAdapter.delete('goals', goalId);
    return;
  }

  const { error } = await goalService.deleteGoal(goalId);
  if (error) {
    logger.warn('goal.delete.fallback', { goalId, error: error.message });
    await offlineAdapter.delete('goals', goalId);
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'goal', action: 'delete', data: { id: goalId }, familyId });
    }
  }
};

export const getEntries = async (familyId: string | null, goalId: string): Promise<GoalEntry[]> => {
  if (!familyId) return [];

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const entries = await offlineAdapter.getAllByIndex<any>('goal_entries', 'goal_id', goalId);
    return mapGoalEntries(entries || []);
  }

  const { data, error } = await goalService.getEntries(goalId);
  if (error) {
    logger.error('goal.entries.failed', { goalId, error: error.message });
    return [];
  }
  return mapGoalEntries(data || []);
};

export const createEntry = async (familyId: string | null, payload: GoalEntryPayload): Promise<GoalEntry | null> => {
  if (!familyId) return null;

  const entryRow = toGoalEntryRow(payload);
  const now = new Date().toISOString();
  const offlineEntry = {
    id: offlineAdapter.generateOfflineId('gentry'),
    ...entryRow,
    created_at: now,
    updated_at: now,
  };

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.put('goal_entries', offlineEntry as any);
    await updateOfflineGoalValue(payload.goalId, payload.value);
    return mapGoalEntry(offlineEntry as any);
  }

  const { data, error } = await goalService.createEntry(entryRow);
  if (error || !data) {
    logger.warn('goal.entry.create.fallback', { goalId: payload.goalId, error: error?.message });
    await offlineAdapter.put('goal_entries', offlineEntry as any);
    await updateOfflineGoalValue(payload.goalId, payload.value);
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'goal_entry', action: 'insert', data: offlineEntry, familyId });
    }
    return mapGoalEntry(offlineEntry as any);
  }

  return mapGoalEntry(data);
};

export const createManualEntry = async (familyId: string | null, payload: GoalEntryPayload): Promise<GoalEntry | null> => {
  return createEntry(familyId, payload);
};

export const updateEntry = async (
  familyId: string | null,
  entryId: string,
  payload: Partial<Pick<GoalEntryPayload, 'description' | 'month' | 'year'>>,
  allowAutomaticUpdate = false
): Promise<void> => {
  if (!familyId) return;

  const updateData = {
    description: payload.description,
    month: payload.month,
    year: payload.year,
  } as any;

  UpdateGoalEntryInputSchema.parse(updateData);

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const entry = await offlineAdapter.get<any>('goal_entries', entryId);
    if (!entry) return;
    // Block editing automatic entries unless explicitly allowed (e.g., from expenseAdapter)
    if (entry.expense_id && !allowAutomaticUpdate) throw new Error('Automatic entries cannot be edited');
    await offlineAdapter.put('goal_entries', { ...entry, ...updateData, updated_at: new Date().toISOString() } as any);
    return;
  }

  const { data: existing, error: loadError } = await goalService.getEntryById(entryId);
  if (loadError) throw loadError;
  // Block editing automatic entries unless explicitly allowed (e.g., from expenseAdapter)
  if (existing?.expense_id && !allowAutomaticUpdate) throw new Error('Automatic entries cannot be edited');

  const { error } = await goalService.updateEntry(entryId, updateData);
  if (error) {
    logger.warn('goal.entry.update.fallback', { entryId, error: error.message });
    const entry = await offlineAdapter.get<any>('goal_entries', entryId);
    if (entry) {
      await offlineAdapter.put('goal_entries', { ...entry, ...updateData, updated_at: new Date().toISOString() } as any);
    }
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'goal_entry', action: 'update', data: { id: entryId, ...updateData }, familyId });
    }
  }
};

export const deleteEntry = async (familyId: string | null, entryId: string): Promise<void> => {
  if (!familyId) return;

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const entry = await offlineAdapter.get<any>('goal_entries', entryId);
    if (!entry) return;
    if (entry.expense_id) throw new Error('Automatic entries cannot be deleted');
    await offlineAdapter.delete('goal_entries', entryId);
    await updateOfflineGoalValue(entry.goal_id, -Number(entry.value || 0));
    return;
  }

  const { data: existing, error: loadError } = await goalService.getEntryById(entryId);
  if (loadError) throw loadError;
  if (existing?.expense_id) throw new Error('Automatic entries cannot be deleted');

  const { error } = await goalService.deleteEntry(entryId);
  if (error) {
    logger.warn('goal.entry.delete.fallback', { entryId, error: error.message });
    await offlineAdapter.delete('goal_entries', entryId);
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'goal_entry', action: 'delete', data: { id: entryId }, familyId });
    }
  } else if (existing) {
    await goalService.decrementGoalValue(existing.goal_id, existing.value);
  }
};

export const getGoalBySubcategoryId = async (subcategoryId: string): Promise<Goal | null> => {
  const offlineMatches = await offlineAdapter.getAllByIndex<any>('goals', 'linked_subcategory_id', subcategoryId);
  if (offlineMatches && offlineMatches[0]) {
    return mapGoal(offlineMatches[0]);
  }

  if (!navigator.onLine) return null;

  const { data } = await goalService.getGoalBySubcategoryId(subcategoryId);
  return data ? mapGoal(data) : null;
};

export const getGoalByCategoryKey = async (categoryKey: string): Promise<Goal | null> => {
  const offlineMatches = await offlineAdapter.getAll<any>('goals');
  const match = offlineMatches.find((g: any) => g.linked_category_key === categoryKey);
  if (match) {
    return mapGoal(match);
  }

  if (!navigator.onLine) return null;

  const { data } = await goalService.getGoalByCategoryKey(categoryKey);
  return data ? mapGoal(data) : null;
};

export const getEntryByExpense = async (expenseId: string): Promise<GoalEntry | null> => {
  const offlineEntries = await offlineAdapter.getAllByIndex<any>('goal_entries', 'expense_id', expenseId);
  if (offlineEntries && offlineEntries[0]) {
    return mapGoalEntry(offlineEntries[0]);
  }

  if (!navigator.onLine) return null;

  const { data } = await goalService.getEntryByExpense(expenseId);
  return data ? mapGoalEntry(data) : null;
};

export const incrementValue = async (familyId: string | null, goalId: string, value: number): Promise<void> => {
  if (!familyId) return;

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await updateOfflineGoalValue(goalId, value);
    return;
  }

  const { error } = await goalService.incrementGoalValue(goalId, value);
  if (error) {
    logger.warn('goal.value.increment.fallback', { goalId, error: error.message });
    await updateOfflineGoalValue(goalId, value);
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'goal', action: 'update', data: { id: goalId, delta: value }, familyId });
    }
  }
};

export const decrementValue = async (familyId: string | null, goalId: string, value: number): Promise<void> => {
  return incrementValue(familyId, goalId, -value);
};

export const getHistoricalExpenses = async (familyId: string | null, subcategoryId: string): Promise<Expense[]> => {
  if (!familyId) return [];

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const allExpenses = await offlineAdapter.getAll<any>('expenses');
    const filtered = (allExpenses || []).filter((e: any) => e.subcategory_id === subcategoryId);
    return filtered.map(mapExpense);
  }

  const { data, error } = await goalService.getHistoricalExpenses(subcategoryId);
  if (error) {
    logger.warn('goal.historical.failed', { subcategoryId, error: error.message });
    return [];
  }
  return (data || []).map(mapExpense);
};

export const importExpense = async (familyId: string | null, goalId: string, expenseId: string): Promise<GoalEntry | null> => {
  if (!familyId) return null;

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const expense = await offlineAdapter.get<any>('expenses', expenseId);
    if (!expense) {
      logger.error('goal.import.expense_not_found', { expenseId });
      throw new Error('Expense not found offline');
    }

    // Check if already imported
    const existing = await offlineAdapter.getAllByIndex<any>('goal_entries', 'expense_id', expenseId);
    if (existing && existing.length > 0) {
      logger.warn('goal.import.already_imported', { expenseId });
      throw new Error('Expense already imported');
    }

    let parsedYear = new Date(expense.created_at || Date.now()).getFullYear();
    let parsedMonth = new Date(expense.created_at || Date.now()).getMonth() + 1;
    if (typeof expense.month_id === 'string') {
      const [y, m] = expense.month_id.split('-');
      parsedYear = Number(y) || parsedYear;
      parsedMonth = Number(m) || parsedMonth;
    } else if (typeof expense.month === 'number' && typeof expense.year === 'number') {
      parsedYear = expense.year;
      parsedMonth = expense.month;
    }

    const entry = await createEntry(familyId, {
      goalId,
      expenseId,
      value: expense.value,
      month: parsedMonth,
      year: parsedYear,
      description: expense.title,
    });
    logger.info('goal.import.success_offline', { goalId, expenseId });
    return entry;
  }

  const { data, error } = await goalService.importExpenseAsEntry(goalId, expenseId);
  if (error) {
    logger.error('goal.import.failed', { goalId, expenseId, error: error.message });
    
    // Check for specific error messages
    if (error.message.includes('already imported') || error.message.includes('já importado')) {
      throw new Error('Expense already imported');
    }
    if (error.message.includes('not found') || error.message.includes('não encontrad')) {
      throw new Error('Expense not found');
    }
    
    throw new Error(error.message || 'Failed to import expense');
  }
  
  if (!data) {
    logger.error('goal.import.no_data', { goalId, expenseId });
    throw new Error('Failed to import expense - no data returned');
  }
  
  logger.info('goal.import.success', { goalId, expenseId });
  return mapGoalEntry(data as any);
};

/**
 * Calculate monthly contribution suggestion based on target date (Fase 6)
 */
export const calculateMonthlySuggestion = async (goalId: string): Promise<{
  remainingValue: number;
  monthsRemaining: number | null;
  suggestedMonthly: number | null;
} | null> => {
  if (!navigator.onLine) {
    // Offline calculation (simplified)
    const goal = await offlineAdapter.get<any>('goals', goalId);
    if (!goal) return null;

    const remaining = Number(goal.target_value || 0) - Number(goal.current_value || 0);
    
    if (!goal.target_month || !goal.target_year) {
      return {
        remainingValue: remaining,
        monthsRemaining: null,
        suggestedMonthly: null,
      };
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed

    // Calculate months difference
    const diffMonths = Math.max(0, (goal.target_year - currentYear) * 12 + (goal.target_month - currentMonth));

    return {
      remainingValue: remaining,
      monthsRemaining: diffMonths,
      suggestedMonthly: diffMonths > 0 ? remaining / diffMonths : remaining,
    };
  }

  const { data, error } = await goalService.calculateMonthlySuggestion(goalId);
  if (error || !data || !Array.isArray(data) || data.length === 0) {
    logger.warn('goal.suggestion.failed', { goalId, error: error?.message });
    return null;
  }

  const result = data[0];
  return {
    remainingValue: Number(result.remaining_value || 0),
    monthsRemaining: result.months_remaining !== null ? Number(result.months_remaining) : null,
    suggestedMonthly: result.suggested_monthly !== null ? Number(result.suggested_monthly) : null,
  };
};
