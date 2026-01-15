/**
 * Goal Entry Adapter
 * 
 * Operations related to goal entries (manual entries, imports, etc.)
 * Handles both online (Supabase) and offline (IndexedDB) flows
 * 
 * Naming Convention:
 * - get* : Read operations
 * - create* : Create operations
 * - update* : Modify operations
 * - delete* : Remove operations
 */

import * as goalService from '../../services/goalService';
import { offlineAdapter } from '../offlineAdapter';
import { logger } from '../../logger';
import { mapGoalEntries, mapGoalEntry, mapExpense } from '../../mappers';
import { toGoalEntryRow, UpdateGoalEntryInputSchema } from './utils';
import type { GoalEntry, Expense } from '@/types';
import type { GoalEntryPayload } from './types';

/**
 * Get all entries for a goal
 */
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

/**
 * Get entry by expense ID
 */
export const getEntryByExpense = async (expenseId: string): Promise<GoalEntry | null> => {
  const offlineEntries = await offlineAdapter.getAllByIndex<any>('goal_entries', 'expense_id', expenseId);
  if (offlineEntries && offlineEntries[0]) {
    return mapGoalEntry(offlineEntries[0]);
  }

  if (!navigator.onLine) return null;

  const { data } = await goalService.getEntryByExpense(expenseId);
  return data ? mapGoalEntry(data) : null;
};

/**
 * Create a new goal entry
 */
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

/**
 * Create a manual goal entry (alias for createEntry)
 */
export const createManualEntry = async (familyId: string | null, payload: GoalEntryPayload): Promise<GoalEntry | null> => {
  return createEntry(familyId, payload);
};

/**
 * Update an existing goal entry
 * 
 * @param allowAutomaticUpdate - When true, bypasses automatic entry check (used by expenseAdapter)
 */
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

/**
 * Get historical expenses that can be imported to a goal
 */
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

/**
 * Import an expense as a goal entry
 */
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
