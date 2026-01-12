import { useCallback, useEffect, useMemo, useState } from 'react';
import * as storageAdapter from '@/lib/adapters/storageAdapter';
import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from './ui/use-toast';
import { logger } from '@/lib/logger';
import type { Goal, GoalEntry } from '@/types';

interface GoalInput {
  name: string;
  targetValue: number;
  targetMonth?: number;
  targetYear?: number;
  account?: string;
  linkedSubcategoryId?: string;
  linkedCategoryKey?: string;
}

interface ManualEntryInput {
  goalId: string;
  value: number;
  description: string;
  month: number;
  year: number;
}

export const useGoals = () => {
  const { currentFamilyId } = useFamily();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [entriesByGoal, setEntriesByGoal] = useState<Record<string, GoalEntry[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setGoals([]);
    setEntriesByGoal({});
    setError(null);
  }, []);

  const loadGoals = useCallback(async () => {
    if (!currentFamilyId) {
      resetState();
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await storageAdapter.getGoals(currentFamilyId);
      setGoals(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentFamilyId, resetState]);

  useEffect(() => {
    resetState();
    if (!currentFamilyId) return;
    loadGoals();
  }, [currentFamilyId, loadGoals, resetState]);

  const addGoal = useCallback(async (payload: GoalInput) => {
    if (!currentFamilyId) return null;
    try {
      const created = await storageAdapter.createGoal(currentFamilyId, payload);
      if (created) {
        setGoals(prev => [...prev, created]);
        toast({ title: t('goalCreated') });
      }
      return created;
    } catch (err) {
      toast({ title: t('errorSaving'), description: (err as Error).message, variant: 'destructive' });
      return null;
    }
  }, [currentFamilyId, toast, t]);

  const updateGoal = useCallback(async (id: string, payload: Partial<GoalInput>) => {
    if (!currentFamilyId) return;
    try {
      await storageAdapter.updateGoal(currentFamilyId, id, payload);
      await loadGoals();
      toast({ title: t('goalUpdated') });
    } catch (err) {
      toast({ title: t('errorSaving'), description: (err as Error).message, variant: 'destructive' });
    }
  }, [currentFamilyId, loadGoals, toast, t]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!currentFamilyId) return;
    try {
      await storageAdapter.deleteGoal(currentFamilyId, id);
      setGoals(prev => prev.filter(g => g.id !== id));
      setEntriesByGoal(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      toast({ title: t('goalDeleted') });
    } catch (err) {
      toast({ title: t('errorDeleting'), description: (err as Error).message, variant: 'destructive' });
    }
  }, [currentFamilyId, toast, t]);

  const getEntries = useCallback(async (goalId: string) => {
    if (!currentFamilyId) return [] as GoalEntry[];
    if (entriesByGoal[goalId]) return entriesByGoal[goalId];
    const data = await storageAdapter.getGoalEntries(currentFamilyId, goalId);
    setEntriesByGoal(prev => ({ ...prev, [goalId]: data }));
    return data;
  }, [currentFamilyId, entriesByGoal]);

  const refreshEntries = useCallback(async (goalId: string) => {
    if (!currentFamilyId) return [] as GoalEntry[];
    const data = await storageAdapter.getGoalEntries(currentFamilyId, goalId);
    setEntriesByGoal(prev => ({ ...prev, [goalId]: data }));
    return data;
  }, [currentFamilyId]);

  const addManualEntry = useCallback(async (input: ManualEntryInput) => {
    if (!currentFamilyId) return null;
    try {
      const entry = await storageAdapter.createManualGoalEntry(currentFamilyId, {
        goalId: input.goalId,
        value: input.value,
        description: input.description,
        month: input.month,
        year: input.year,
      });
      await refreshEntries(input.goalId);
      await loadGoals();
      toast({ title: t('entryCreated') });
      return entry;
    } catch (err) {
      toast({ title: t('errorSaving'), description: (err as Error).message, variant: 'destructive' });
      return null;
    }
  }, [currentFamilyId, refreshEntries, loadGoals, toast, t]);

  const updateEntry = useCallback(async (entryId: string, goalId: string, data: Partial<Pick<ManualEntryInput, 'description' | 'month' | 'year'>>) => {
    if (!currentFamilyId) return;
    await storageAdapter.updateGoalEntry(currentFamilyId, entryId, data);
    await refreshEntries(goalId);
    await loadGoals();
  }, [currentFamilyId, refreshEntries, loadGoals]);

  const deleteEntry = useCallback(async (entryId: string, goalId: string) => {
    if (!currentFamilyId) return;
    try {
      await storageAdapter.deleteGoalEntry(currentFamilyId, entryId);
      await refreshEntries(goalId);
      await loadGoals();
      toast({ title: t('entryDeleted') });
    } catch (err) {
      toast({ title: t('errorDeleting'), description: (err as Error).message, variant: 'destructive' });
    }
  }, [currentFamilyId, refreshEntries, loadGoals, toast, t]);

  const getHistoricalExpenses = useCallback(async (subcategoryId: string) => {
    if (!currentFamilyId) return [];
    return storageAdapter.getGoalHistoricalExpenses(currentFamilyId, subcategoryId);
  }, [currentFamilyId]);

  const importExpense = useCallback(async (goalId: string, expenseId: string) => {
    if (!currentFamilyId) return null;
    try {
      const entry = await storageAdapter.importGoalExpense(currentFamilyId, goalId, expenseId);
      if (entry) {
        // Only refresh if successful
        await refreshEntries(goalId);
        await loadGoals();
        toast({ title: t('expenseImported') });
      }
      return entry;
    } catch (err) {
      const message = (err as Error).message;
      logger.error('useGoals.importExpense.error', { goalId, expenseId, error: message });
      
      if (message.includes('already imported') || message.includes('já importado')) {
        toast({ title: t('alreadyImported'), variant: 'destructive' });
      } else if (message.includes('not found') || message.includes('não encontrad')) {
        toast({ title: t('errorSaving'), description: 'Despesa não encontrada', variant: 'destructive' });
      } else {
        toast({ title: t('errorSaving'), description: message, variant: 'destructive' });
      }
      return null;
    }
  }, [currentFamilyId, refreshEntries, loadGoals, toast, t]);

  const getMonthlySuggestion = useCallback(async (goalId: string) => {
    return storageAdapter.calculateGoalMonthlySuggestion(goalId);
  }, []);

  return useMemo(() => ({
    goals,
    entriesByGoal,
    loading,
    error,
    loadGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    getEntries,
    refreshEntries,
    addManualEntry,
    updateEntry,
    deleteEntry,
    getHistoricalExpenses,
    importExpense,
    getMonthlySuggestion,
  }), [
    goals,
    entriesByGoal,
    loading,
    error,
    loadGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    getEntries,
    refreshEntries,
    addManualEntry,
    updateEntry,
    deleteEntry,
    getHistoricalExpenses,
    importExpense,
    getMonthlySuggestion,
  ]);
};
