/**
 * Goal Adapter
 * 
 * Operations related to goals (CRUD)
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
import { mapGoal, mapGoals } from '../../mappers';
import { 
  addCurrentValueToGoals, 
  ensureSubcategoryIsValid, 
  toGoalRow,
  getGoalBySubcategoryIdInternal,
  getGoalByCategoryKeyInternal,
  UpdateGoalInputSchema
} from './utils';
import type { Goal, GoalStatus } from '@/types';
import type { GoalPayload } from './types';

/**
 * Get all goals for a family
 */
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

/**
 * Create a new goal
 */
export const createGoal = async (familyId: string | null, payload: GoalPayload): Promise<Goal | null> => {
  if (!familyId) return null;

  if (payload.linkedSubcategoryId || payload.linkedCategoryKey) {
    await ensureSubcategoryIsValid(familyId, payload.linkedSubcategoryId, payload.linkedCategoryKey, payload.status);
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

/**
 * Update an existing goal
 */
export const updateGoal = async (familyId: string | null, goalId: string, payload: Partial<GoalPayload>): Promise<void> => {
  if (!familyId) return;

  let existingGoal: any = null;
  if (!payload.linkedSubcategoryId || !payload.linkedCategoryKey || !payload.status) {
    if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
      existingGoal = await offlineAdapter.get<any>('goals', goalId);
    } else {
      const { data } = await goalService.getGoalById(goalId);
      existingGoal = data;
    }
  }

  const effectiveSubcategoryId = payload.linkedSubcategoryId ?? existingGoal?.linked_subcategory_id ?? existingGoal?.linkedSubcategoryId;
  const effectiveCategoryKey = payload.linkedCategoryKey ?? existingGoal?.linked_category_key ?? existingGoal?.linkedCategoryKey;
  const effectiveStatus: GoalStatus = payload.status ?? (existingGoal?.status as GoalStatus | undefined) ?? 'active';

  if (effectiveSubcategoryId || effectiveCategoryKey || payload.status) {
    await ensureSubcategoryIsValid(familyId, effectiveSubcategoryId, effectiveCategoryKey, effectiveStatus, goalId);
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

  if (payload.status) {
    updateData.status = payload.status;
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

/**
 * Delete a goal and its entries
 */
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

/**
 * Get active goal by subcategory ID
 */
export const getGoalBySubcategoryId = getGoalBySubcategoryIdInternal;

/**
 * Get active goal by category key
 */
export const getGoalByCategoryKey = getGoalByCategoryKeyInternal;
