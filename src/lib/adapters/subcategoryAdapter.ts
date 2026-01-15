/**
 * Subcategory Adapter
 * 
 * Operations related to expense subcategories
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
import { logger } from '../logger';
import type { Subcategory, CategoryKey } from '@/types';
import type { SubcategoryRow } from '@/types/database';
import { mapSubcategories } from '../mappers';

/**
 * Get all subcategories for a family
 */
export const getSubcategories = async (familyId: string | null) => {
  if (!familyId) return [] as Subcategory[];
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const data = await offlineAdapter.getAllByIndex<SubcategoryRow>('subcategories', 'family_id', familyId);
    const mapped = mapSubcategories(data || []);
    return mapped.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }

  const { data, error } = await budgetService.getSubcategories(familyId);
  if (error) { logger.error('subcategory.load.failed', { familyId, error }); return [] as Subcategory[]; }
  const mapped = mapSubcategories(data || []);
  return mapped.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
};

/**
 * Insert a new subcategory
 */
export const insertSubcategory = async (familyId: string | null, name: string, categoryKey: CategoryKey) => {
  if (!familyId) return;
  
  const offlineId = offlineAdapter.generateOfflineId('sub');
  const offlineData: Partial<SubcategoryRow> = { id: offlineId, family_id: familyId, name, category_key: categoryKey };
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.put('subcategories', offlineData);
    return offlineData;
  }

  const { error } = await budgetService.insertSubcategory(familyId, name, categoryKey);
  if (error) {
    logger.warn('subcategory.insert.fallback', { error: error.message });
    await offlineAdapter.put('subcategories', offlineData);
    // Only queue sync if it's an online family (not an offline family)
    if (!offlineAdapter.isOfflineId(familyId)) {
      await offlineAdapter.sync.add({ type: 'subcategory', action: 'insert', data: offlineData as Record<string, unknown>, familyId });
    }
    return offlineData;
  }
  
  return { success: true };
};

/**
 * Add a new subcategory
 * @deprecated Use insertSubcategory instead
 */
export const addSubcategory = async (familyId: string | null, name: string, categoryKey: CategoryKey) => {
  return insertSubcategory(familyId, name, categoryKey);
};

/**
 * Update a subcategory name
 */
export const updateSubcategory = async (familyId: string | null, id: string, name: string) => {
  if (!familyId) return;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const sub = await offlineAdapter.get<SubcategoryRow>('subcategories', id);
    if (sub) {
      await offlineAdapter.put('subcategories', { ...sub, name });
    }
    return;
  }
  
  const { error } = await budgetService.updateSubcategoryById(id, name);
  if (error) {
    logger.error('subcategory.update.failed', { id, error: error.message });
  }
  return { error };
};

/**
 * Delete a subcategory
 * Clears references from expenses and recurring expenses
 */
export const deleteSubcategory = async (familyId: string | null, id: string) => {
  if (!familyId) return;
  
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.delete('subcategories', id);
    return;
  }
  
  try {
    await budgetService.clearSubcategoryReferences(id);
    await budgetService.clearRecurringSubcategoryReferences(id);
    await budgetService.deleteSubcategoryById(id);
  } catch (error) {
    logger.error('subcategory.delete.failed', { id, error });
  }
};

/**
 * Remove a subcategory
 * @deprecated Use deleteSubcategory instead
 */
export const removeSubcategory = async (familyId: string | null, id: string) => {
  return deleteSubcategory(familyId, id);
};
