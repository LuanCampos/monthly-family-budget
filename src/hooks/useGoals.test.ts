import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGoals } from './useGoals';
import type { GoalEntry, Goal } from '@/types';
import type { MonthlySuggestionResult } from '@/lib/adapters/goal/types';

// Mock dependencies
const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    familyId: 'family-123',
    name: 'Emergency Fund',
    targetValue: 10000,
    currentValue: 2500,
    status: 'active',
  },
  {
    id: 'goal-2',
    familyId: 'family-123',
    name: 'Vacation',
    targetValue: 5000,
    currentValue: 1000,
    status: 'active',
  },
];

const mockEntries: GoalEntry[] = [
  { id: 'entry-1', goalId: 'goal-1', value: 500, description: 'Initial deposit', month: 1, year: 2025 },
  { id: 'entry-2', goalId: 'goal-1', value: 2000, description: 'Bonus', month: 2, year: 2025 },
];

const mockMonthlySuggestion: MonthlySuggestionResult = {
  remainingValue: 5000,
  monthsRemaining: 12,
  suggestedMonthly: 500,
  monthlyContributed: 200,
  monthlyRemaining: 300,
};

vi.mock('@/contexts/FamilyContext', () => ({
  useFamily: () => ({
    currentFamilyId: 'family-123',
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        goalCreated: 'Goal created',
        goalUpdated: 'Goal updated',
        goalDeleted: 'Goal deleted',
        entryCreated: 'Entry created',
        entryDeleted: 'Entry deleted',
        expenseImported: 'Expense imported',
        errorSaving: 'Error saving',
        errorDeleting: 'Error deleting',
        alreadyImported: 'Already imported',
      };
      return translations[key] || key;
    },
  }),
}));

const mockToast = vi.fn();
vi.mock('./ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/adapters/storageAdapter', () => ({
  getGoals: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
  getGoalEntries: vi.fn(),
  createManualGoalEntry: vi.fn(),
  updateGoalEntry: vi.fn(),
  deleteGoalEntry: vi.fn(),
  getGoalHistoricalExpenses: vi.fn(),
  importGoalExpense: vi.fn(),
  calculateGoalMonthlySuggestion: vi.fn(),
  createChannel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
}));

vi.mock('@/lib/adapters/offlineAdapter', () => ({
  offlineAdapter: {
    isOfflineId: vi.fn().mockReturnValue(false),
  },
}));

// Import the mocked module after vi.mock
import * as storageAdapter from '@/lib/adapters/storageAdapter';

// Cast to mocked types
const mockedStorageAdapter = vi.mocked(storageAdapter);

describe('useGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedStorageAdapter.getGoals.mockResolvedValue(mockGoals);
    mockedStorageAdapter.createGoal.mockResolvedValue(mockGoals[0]);
    mockedStorageAdapter.getGoalEntries.mockResolvedValue(mockEntries);
    mockedStorageAdapter.createManualGoalEntry.mockResolvedValue(mockEntries[0]);
    mockedStorageAdapter.importGoalExpense.mockResolvedValue(mockEntries[0]);
    mockedStorageAdapter.calculateGoalMonthlySuggestion.mockResolvedValue(mockMonthlySuggestion);
    mockedStorageAdapter.getGoalHistoricalExpenses.mockResolvedValue([]);
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useGoals());

    expect(result.current.loading).toBe(true);
    expect(result.current.goals).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should load goals on mount', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.goals).toEqual(mockGoals);
    expect(mockedStorageAdapter.getGoals).toHaveBeenCalledWith('family-123');
  });

  it('should add a new goal', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newGoalInput = {
      name: 'New Car',
      targetValue: 30000,
    };

    let createdGoal;
    await act(async () => {
      createdGoal = await result.current.addGoal(newGoalInput);
    });

    expect(mockedStorageAdapter.createGoal).toHaveBeenCalledWith('family-123', newGoalInput);
    expect(createdGoal).toEqual(mockGoals[0]);
    expect(mockToast).toHaveBeenCalledWith({ title: 'Goal created' });
  });

  it('should update a goal', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatePayload = { name: 'Updated Goal Name' };

    await act(async () => {
      await result.current.updateGoal('goal-1', updatePayload);
    });

    expect(mockedStorageAdapter.updateGoal).toHaveBeenCalledWith(
      'family-123',
      'goal-1',
      updatePayload
    );
    expect(mockToast).toHaveBeenCalledWith({ title: 'Goal updated' });
  });

  it('should delete a goal', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteGoal('goal-1');
    });

    expect(mockedStorageAdapter.deleteGoal).toHaveBeenCalledWith('family-123', 'goal-1');
    expect(mockToast).toHaveBeenCalledWith({ title: 'Goal deleted' });
  });

  it('should get entries for a goal', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let entries;
    await act(async () => {
      entries = await result.current.getEntries('goal-1');
    });

    expect(entries).toEqual(mockEntries);
    expect(mockedStorageAdapter.getGoalEntries).toHaveBeenCalledWith('family-123', 'goal-1');
  });

  it('should add a manual entry', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const entryInput = {
      goalId: 'goal-1',
      value: 1000,
      description: 'Monthly savings',
      month: 1,
      year: 2025,
    };

    await act(async () => {
      await result.current.addManualEntry(entryInput);
    });

    expect(mockedStorageAdapter.createManualGoalEntry).toHaveBeenCalledWith('family-123', entryInput);
    expect(mockToast).toHaveBeenCalledWith({ title: 'Entry created' });
  });

  it('should delete an entry', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteEntry('entry-1', 'goal-1');
    });

    expect(mockedStorageAdapter.deleteGoalEntry).toHaveBeenCalledWith('family-123', 'entry-1');
    expect(mockToast).toHaveBeenCalledWith({ title: 'Entry deleted' });
  });

  it('should handle error when adding goal fails', async () => {
    mockedStorageAdapter.createGoal.mockRejectedValueOnce(new Error('Failed to create'));

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addGoal({ name: 'Test', targetValue: 1000 });
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error saving',
      description: 'Failed to create',
      variant: 'destructive',
    });
  });

  it('should handle error when deleting goal fails', async () => {
    mockedStorageAdapter.deleteGoal.mockRejectedValueOnce(new Error('Failed to delete'));

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteGoal('goal-1');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error deleting',
      description: 'Failed to delete',
      variant: 'destructive',
    });
  });

  it('should get monthly suggestion', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let suggestion;
    await act(async () => {
      suggestion = await result.current.getMonthlySuggestion('goal-1');
    });

    expect(suggestion).toEqual(mockMonthlySuggestion);
    expect(mockedStorageAdapter.calculateGoalMonthlySuggestion).toHaveBeenCalledWith('goal-1');
  });

  it('should get historical expenses', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.getHistoricalExpenses('subcategory-1');
    });

    expect(mockedStorageAdapter.getGoalHistoricalExpenses).toHaveBeenCalledWith(
      'family-123',
      'subcategory-1'
    );
  });

  it('should import expense to goal', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.importExpense('goal-1', 'expense-1');
    });

    expect(mockedStorageAdapter.importGoalExpense).toHaveBeenCalledWith(
      'family-123',
      'goal-1',
      'expense-1'
    );
    expect(mockToast).toHaveBeenCalledWith({ title: 'Expense imported' });
  });

  it('should handle already imported expense error', async () => {
    mockedStorageAdapter.importGoalExpense.mockRejectedValueOnce(new Error('already imported'));

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.importExpense('goal-1', 'expense-1');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Already imported',
      variant: 'destructive',
    });
  });

  it('should handle expense not found error', async () => {
    mockedStorageAdapter.importGoalExpense.mockRejectedValueOnce(new Error('not found'));

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.importExpense('goal-1', 'expense-1');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error saving',
      description: 'Despesa não encontrada',
      variant: 'destructive',
    });
  });

  it('should handle generic import expense error', async () => {
    mockedStorageAdapter.importGoalExpense.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.importExpense('goal-1', 'expense-1');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error saving',
      description: 'Network error',
      variant: 'destructive',
    });
  });

  it('should handle error when updating goal fails', async () => {
    mockedStorageAdapter.updateGoal.mockRejectedValueOnce(new Error('Update failed'));

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateGoal('goal-1', { name: 'Updated' });
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error saving',
      description: 'Update failed',
      variant: 'destructive',
    });
  });

  it('should handle error when adding manual entry fails', async () => {
    mockedStorageAdapter.createManualGoalEntry.mockRejectedValueOnce(new Error('Entry failed'));

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addManualEntry({
        goalId: 'goal-1',
        value: 100,
        description: 'Test',
        month: 1,
        year: 2025,
      });
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error saving',
      description: 'Entry failed',
      variant: 'destructive',
    });
  });

  it('should handle error when deleting entry fails', async () => {
    mockedStorageAdapter.deleteGoalEntry.mockRejectedValueOnce(new Error('Delete entry failed'));

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteEntry('entry-1', 'goal-1');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error deleting',
      description: 'Delete entry failed',
      variant: 'destructive',
    });
  });

  it('should refresh entries for a goal', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshEntries('goal-1');
    });

    expect(mockedStorageAdapter.getGoalEntries).toHaveBeenCalledWith('family-123', 'goal-1');
  });

  it('should update entry', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateEntry('entry-1', 'goal-1', { description: 'Updated' });
    });

    expect(mockedStorageAdapter.updateGoalEntry).toHaveBeenCalledWith(
      'family-123',
      'entry-1',
      { description: 'Updated' }
    );
  });
});
