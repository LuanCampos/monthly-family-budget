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

/**
 * Enrich goals with currentValue using a single batch query (online) or a single
 * offline read. Avoids N calls to goalService.getEntries (one per goal).
 */
const addCurrentValueToGoals = async (familyId: string, goals: Goal[]): Promise<Goal[]> => {
  if (goals.length === 0) return goals;

  const goalIds = goals.map(goal => goal.id);
  const goalIdSet = new Set(goalIds);

  // Offline / offline-id families: one read, then aggregate locally
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const allEntries = await offlineAdapter.getAll<any>('goal_entries');
    const sums = (allEntries || []).reduce((acc, entry: any) => {
      if (!goalIdSet.has(entry.goal_id)) return acc;
      acc[entry.goal_id] = (acc[entry.goal_id] || 0) + Number(entry.value || 0);
      return acc;
    }, {} as Record<string, number>);

    return goals.map(goal => ({ ...goal, currentValue: sums[goal.id] ?? 0 }));
  }

  // Online: single query for all goal entries
  const { data, error } = await goalService.getEntriesByGoalIds(goalIds);
  if (error) {
    logger.warn('goal.entries.batch.failed', { familyId, error: error.message });
    return goals.map(goal => ({ ...goal, currentValue: goal.currentValue ?? 0 }));
  }

  const sums = (data || []).reduce((acc, entry: any) => {
    const goalId = entry.goal_id;
    if (!goalId) return acc;
    acc[goalId] = (acc[goalId] || 0) + Number(entry.value || 0);
    return acc;
  }, {} as Record<string, number>);

  return goals.map(goal => ({ ...goal, currentValue: sums[goal.id] ?? 0 }));
};

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

export const getGoals = async (familyId: string | null): Promise<Goal[]> => {
  if (!familyId) return [];

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const data = await offlineAdapter.getAllByIndex<any>('goals', 'family_id', familyId);
    const goals = mapGoals(data || []);
    return addCurrentValueToGoals(familyId, goals);
  }

  const { data, error } = await goalService.getGoals(familyId);
  if (error) {
    logger.error('goal.list.failed', { familyId, error: error.message });
    return [];
  }
  const goals = mapGoals(data || []);
  return addCurrentValueToGoals(familyId, goals);
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
    const goal = mapGoal(offlineGoal as any);
    const [enriched] = await addCurrentValueToGoals(familyId, [goal]);
    return enriched;
  }

  const { data, error } = await goalService.createGoal(goalRow);
  if (error || !data) {
    logger.warn('goal.create.fallback', { familyId, error: error?.message });
    await offlineAdapter.put('goals', offlineGoal as any);
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'goal', action: 'insert', data: offlineGoal, familyId });
    }
    const goal = mapGoal(offlineGoal as any);
    const [enriched] = await addCurrentValueToGoals(familyId, [goal]);
    return enriched;
  }

  const goal = mapGoal(data);
  const [enriched] = await addCurrentValueToGoals(familyId, [goal]);
  return enriched;
};

export const updateGoal = async (familyId: string | null, goalId: string, payload: Partial<GoalPayload>): Promise<void> => {
  if (!familyId) return;

  if (payload.linkedSubcategoryId || payload.linkedCategoryKey) {
    await ensureSubcategoryIsValid(familyId, payload.linkedSubcategoryId, payload.linkedCategoryKey, goalId);
  }

  const updateData: any = {
    name: payload.name,
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
    const mapped = mapGoalEntries(entries || []);
    // Sort by year/month descending (most recent first)
    return mapped.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });
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
    return mapGoalEntry(offlineEntry as any);
  }

  const { data, error } = await goalService.createEntry(entryRow);
  if (error || !data) {
    logger.warn('goal.entry.create.fallback', { goalId: payload.goalId, error: error?.message });
    await offlineAdapter.put('goal_entries', offlineEntry as any);
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
  payload: Partial<Pick<GoalEntryPayload, 'value' | 'description' | 'month' | 'year'>>,
  allowAutomaticUpdate = false
): Promise<void> => {
  if (!familyId) return;

  const updateData = {
    value: payload.value,
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

/**
 * Delete a goal entry
 * 
 * @param allowAutomaticDelete - When true, bypasses any checks (used by expenseAdapter)
 *                               When false (default), allows manual deletion by user
 * 
 * Note: Users can manually delete automatic entries to fix errors,
 *       then re-import if needed using the import functionality
 */
export const deleteEntry = async (familyId: string | null, entryId: string, allowAutomaticDelete = false): Promise<void> => {
  if (!familyId) return;

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const entry = await offlineAdapter.get<any>('goal_entries', entryId);
    if (!entry) return;
    // Allow manual deletion of automatic entries - user may need to fix errors
    // Only block when called from internal operations (allowAutomaticDelete flag)
    if (entry.expense_id && !allowAutomaticDelete) {
      logger.debug('goal.entry.delete.automatic', { entryId, expenseId: entry.expense_id });
    }
    await offlineAdapter.delete('goal_entries', entryId);
    return;
  }

  const { data: existing, error: loadError } = await goalService.getEntryById(entryId);
  if (loadError) throw loadError;
  // Allow manual deletion of automatic entries - user may need to fix errors
  // Only block when called from internal operations (allowAutomaticDelete flag)
  if (existing?.expense_id && !allowAutomaticDelete) {
    logger.debug('goal.entry.delete.automatic', { entryId, expenseId: existing.expense_id });
  }

  const { error } = await goalService.deleteEntry(entryId);
  if (error) {
    logger.warn('goal.entry.delete.fallback', { entryId, error: error.message });
    await offlineAdapter.delete('goal_entries', entryId);
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'goal_entry', action: 'delete', data: { id: entryId }, familyId });
    }
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

export const getHistoricalExpenses = async (familyId: string | null, subcategoryId: string): Promise<Expense[]> => {
  if (!familyId) return [];

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const allExpenses = await offlineAdapter.getAll<any>('expenses');
    const allEntries = await offlineAdapter.getAll<any>('goal_entries');
    
    // Create set of imported expense IDs
    const importedExpenseIds = new Set(
      (allEntries || [])
        .map((e: any) => e.expense_id)
        .filter(Boolean)
    );
    
    // Filter by subcategory and exclude already imported
    const filtered = (allExpenses || []).filter((e: any) => 
      e.subcategory_id === subcategoryId && !importedExpenseIds.has(e.id)
    );
    
    const mapped = filtered.map(mapExpense);
    // Sort by year/month descending (most recent first)
    return mapped.sort((a, b) => {
      if (a.year && b.year && b.year !== a.year) return b.year - a.year;
      if (a.month && b.month) return b.month - a.month;
      return 0;
    });
  }

  const { data, error } = await goalService.getHistoricalExpenses(subcategoryId);
  if (error) {
    logger.warn('goal.historical.failed', { subcategoryId, error: error.message });
    return [];
  }
  const mapped = (data || []).map(mapExpense);
  // Sort by year/month descending (most recent first)
  return mapped.sort((a, b) => {
    if (a.year && b.year && b.year !== a.year) return b.year - a.year;
    if (a.month && b.month) return b.month - a.month;
    return 0;
  });
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
      const parts = expense.month_id.split('-');
      // month_id format: familyId-YYYY-MM (3 parts)
      if (parts.length >= 3) {
        parsedYear = Number(parts[parts.length - 2]) || parsedYear;
        parsedMonth = Number(parts[parts.length - 1]) || parsedMonth;
      }
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
    logger.debug('goal.import.success_offline', { goalId, expenseId });
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
  
  logger.debug('goal.import.success', { goalId, expenseId });
  return mapGoalEntry(data as any);
};

/**
 * Calculate how much was contributed this month and how much is still needed
 */
const calculateCurrentMonthProgress = (entries: any[]): { contributed: number; remaining: number } => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const currentMonthEntries = entries.filter(
    (entry: any) => entry.month === currentMonth && entry.year === currentYear
  );
  const contributed = currentMonthEntries.reduce((sum: number, entry: any) => sum + Number(entry.value || 0), 0);

  return { contributed, remaining: 0 }; // remaining will be calculated based on suggested monthly
};

/**
 * Calculate monthly contribution suggestion with intelligent logic
 * Takes into account how much was already contributed this month
 */
const calculateMonthlyPlan = (
  totalRemaining: number,
  monthsRemainingRaw: number,
  monthlyContributed: number
): {
  recommendedMonthly: number;
  monthlyRemaining: number;
} => {
  // Always consider at least the current month
  const monthsRemaining = Math.max(1, monthsRemainingRaw);

  // Average at the start of the month (includes what is already logged)
  const startOfMonthAverage = (totalRemaining + monthlyContributed) / monthsRemaining;

  // Already met or exceeded this month's average
  if (monthlyContributed >= startOfMonthAverage) {
    const monthsAfterThis = Math.max(1, monthsRemaining - 1);
    // Average after removing the current month (overachieved)
    const afterMonthAverage = totalRemaining / monthsAfterThis;

    return {
      recommendedMonthly: afterMonthAverage,
      monthlyRemaining: 0,
    };
  }

  // Still need to log this month
  const monthlyRemaining = Math.max(0, startOfMonthAverage - monthlyContributed);
  return {
    recommendedMonthly: startOfMonthAverage,
    monthlyRemaining,
  };
};

/**
 * Calculate monthly contribution suggestion based on target date (Fase 6)
 */
export const calculateMonthlySuggestion = async (goalId: string): Promise<{
  remainingValue: number;
  monthsRemaining: number | null;
  suggestedMonthly: number | null;
  monthlyContributed: number | null;
  monthlyRemaining: number | null;
} | null> => {
  if (!navigator.onLine) {
    // Offline calculation (intelligent)
    const goal = await offlineAdapter.get<any>('goals', goalId);
    if (!goal) return null;

    // Calculate current value dynamically from entries
    const entries = await offlineAdapter.getAllByIndex<any>('goal_entries', 'goal_id', goalId) || [];
    const currentValue = entries.reduce((sum: number, entry: any) => sum + Number(entry.value || 0), 0);
    
    const remaining = Number(goal.target_value || 0) - currentValue;
    
    if (!goal.target_month || !goal.target_year) {
      return {
        remainingValue: remaining,
        monthsRemaining: null,
        suggestedMonthly: null,
        monthlyContributed: null,
        monthlyRemaining: null,
      };
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed

    // Calculate months difference
    const diffMonths = Math.max(0, (goal.target_year - currentYear) * 12 + (goal.target_month - currentMonth));

    // Calculate current month progress
    const { contributed: monthlyContributed } = calculateCurrentMonthProgress(entries);

    // Calculate intelligent suggested monthly amount
    const { recommendedMonthly, monthlyRemaining } = calculateMonthlyPlan(remaining, diffMonths, monthlyContributed);

    return {
      remainingValue: remaining,
      monthsRemaining: diffMonths,
      suggestedMonthly: recommendedMonthly,
      monthlyContributed: monthlyContributed > 0 ? monthlyContributed : 0,
      monthlyRemaining: monthlyRemaining > 0 ? monthlyRemaining : 0,
    };
  }

  const { data, error } = await goalService.calculateMonthlySuggestion(goalId);
  if (error || !data || !Array.isArray(data) || data.length === 0) {
    logger.warn('goal.suggestion.failed', { goalId, error: error?.message });
    return null;
  }

  const result = data[0];

  // Base values from backend
  const totalRemaining = Number(result.remaining_value || 0);
  const monthsRemaining = result.months_remaining !== null ? Number(result.months_remaining) : null;
  let suggestedMonthly: number | null = result.suggested_monthly !== null ? Number(result.suggested_monthly) : null;

  // For online mode, also calculate monthly progress and adjust suggestion intelligently
  const goal = await goalService.getGoalById(goalId);
  let monthlyContributed = 0;
  let monthlyRemaining = 0;
  
  if (goal && !goal.error) {
    const entries = await goalService.getEntries(goalId);
    if (!entries.error) {
      const { contributed } = calculateCurrentMonthProgress(entries.data || []);
      monthlyContributed = contributed;

      if (monthsRemaining !== null) {
        const { recommendedMonthly, monthlyRemaining: remainingThisMonth } = calculateMonthlyPlan(
          totalRemaining,
          monthsRemaining,
          monthlyContributed
        );
        suggestedMonthly = recommendedMonthly;
        monthlyRemaining = remainingThisMonth;
      }
    }
  }

  return {
    remainingValue: totalRemaining,
    monthsRemaining,
    suggestedMonthly,
    monthlyContributed: monthlyContributed > 0 ? monthlyContributed : 0,
    monthlyRemaining: monthlyRemaining > 0 ? monthlyRemaining : 0,
  };
};
