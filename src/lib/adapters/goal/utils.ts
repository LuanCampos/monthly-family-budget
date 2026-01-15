/**
 * Goal Adapter Utilities
 * 
 * Internal helper functions for goal adapters
 */

import * as goalService from '../../services/goalService';
import * as budgetService from '../../services/budgetService';
import { offlineAdapter } from '../offlineAdapter';
import { logger } from '../../logger';
import { mapGoal } from '../../mappers';
import {
  CreateGoalInputSchema,
  UpdateGoalInputSchema,
  CreateGoalEntryInputSchema,
  CreateManualGoalEntryInputSchema,
  UpdateGoalEntryInputSchema,
} from '../../validators';
import type { Goal, GoalStatus } from '@/types';
import type { GoalPayload, GoalEntryPayload } from './types';

/**
 * Enrich goals with currentValue using a single batch query (online) or a single
 * offline read. Avoids N calls to goalService.getEntries (one per goal).
 */
export const addCurrentValueToGoals = async (familyId: string, goals: Goal[]): Promise<Goal[]> => {
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

/**
 * Helper to get goal by subcategory ID (for validation)
 */
export const getGoalBySubcategoryIdInternal = async (subcategoryId: string): Promise<Goal | null> => {
  const offlineMatches = await offlineAdapter.getAllByIndex<any>('goals', 'linked_subcategory_id', subcategoryId);
  const activeOffline = (offlineMatches || []).find((goal) => (goal.status ?? 'active') === 'active');
  if (activeOffline) {
    return mapGoal(activeOffline);
  }

  if (!navigator.onLine) return null;

  const { data } = await goalService.getGoalBySubcategoryId(subcategoryId);
  return data ? mapGoal(data) : null;
};

/**
 * Helper to get goal by category key (for validation)
 */
export const getGoalByCategoryKeyInternal = async (categoryKey: string): Promise<Goal | null> => {
  const offlineMatches = await offlineAdapter.getAll<any>('goals');
  const match = offlineMatches.find((g: any) => g.linked_category_key === categoryKey && (g.status ?? 'active') === 'active');
  if (match) {
    return mapGoal(match);
  }

  if (!navigator.onLine) return null;

  const { data } = await goalService.getGoalByCategoryKey(categoryKey);
  return data ? mapGoal(data) : null;
};

/**
 * Validate subcategory/category is valid for goal linkage
 */
export const ensureSubcategoryIsValid = async (
  familyId: string,
  subcategoryId: string | undefined,
  categoryKey: string | undefined,
  status: GoalStatus | undefined,
  currentGoalId?: string
) => {
  // Simplified - let database handle constraints if any
  // Just verify subcategory exists if provided
  if (!subcategoryId && !categoryKey) return;

  const effectiveStatus: GoalStatus = status ?? 'active';

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    if (subcategoryId) {
      const subcategory = await offlineAdapter.get<any>('subcategories', subcategoryId);
      if (!subcategory) throw new Error('Subcategory not found');

      const offlineGoals = await offlineAdapter.getAllByIndex<any>('goals', 'linked_subcategory_id', subcategoryId);
      const belongsToFamily = (goal: any) => goal.family_id === familyId || goal.familyId === familyId;
      const activeGoal = (offlineGoals || []).find((g: any) => belongsToFamily(g) && (g.status ?? 'active') === 'active' && g.id !== currentGoalId);
      if (activeGoal && effectiveStatus === 'active') {
        throw new Error('Esta subcategoria já está vinculada a uma meta ativa');
      }
    }

    if (categoryKey === 'liberdade' && effectiveStatus === 'active') {
      const offlineGoals = await offlineAdapter.getAll<any>('goals');
      const belongsToFamily = (goal: any) => goal.family_id === familyId || goal.familyId === familyId;
      const activeGoal = (offlineGoals || []).find((g: any) => belongsToFamily(g) && (g.linked_category_key === 'liberdade') && (g.status ?? 'active') === 'active' && g.id !== currentGoalId);
      if (activeGoal) {
        throw new Error('Já existe uma meta ativa vinculada à categoria Liberdade Financeira');
      }
    }
    return;
  }

  if (subcategoryId) {
    const { data: subcategories, error } = await budgetService.getSubcategories(familyId);
    if (error) throw error;
    const subcategory = (subcategories || []).find((s: any) => s.id === subcategoryId);
    if (!subcategory) throw new Error('Subcategory not found');

    if (effectiveStatus === 'active') {
      const existingGoal = await getGoalBySubcategoryIdInternal(subcategoryId);
      if (existingGoal && existingGoal.id !== currentGoalId && (existingGoal.status ?? 'active') === 'active') {
        throw new Error('Esta subcategoria já está vinculada a uma meta ativa');
      }
    }
  }

  if (categoryKey === 'liberdade' && effectiveStatus === 'active') {
    const existingGoal = await getGoalByCategoryKeyInternal('liberdade');
    if (existingGoal && existingGoal.id !== currentGoalId && (existingGoal.status ?? 'active') === 'active') {
      throw new Error('Já existe uma meta ativa vinculada à categoria Liberdade Financeira');
    }
  }
};

/**
 * Convert GoalPayload to database row format
 */
export const toGoalRow = (familyId: string, payload: GoalPayload) => {
  const data: any = {
    family_id: familyId,
    name: payload.name,
    target_value: payload.targetValue,
    target_month: payload.targetMonth ?? null,
    target_year: payload.targetYear ?? null,
    account: payload.account ?? null,
    linked_subcategory_id: payload.linkedSubcategoryId ?? null,
    linked_category_key: payload.linkedCategoryKey ?? null,
    status: payload.status ?? 'active',
  };
  
  CreateGoalInputSchema.parse(data);
  return data;
};

/**
 * Convert GoalEntryPayload to database row format
 */
export const toGoalEntryRow = (payload: GoalEntryPayload) => {
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

export { UpdateGoalInputSchema, UpdateGoalEntryInputSchema };
