import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBudget } from './useBudget';
import * as storageAdapter from '@/lib/adapters/storageAdapter';
import { offlineAdapter } from '@/lib/adapters/offlineAdapter';
import { useFamily } from '@/contexts/FamilyContext';
import type { Month } from '@/types';
import { makeMockFamily } from '@/test/mocks/domain/makeMockFamily';
import { makeMockOfflineAdapter } from '@/test/mocks/services/makeMockServices';
import { makeMockExpense } from '@/test/mocks/domain/makeMockExpense';
import { makeMockRecurringExpense } from '@/test/mocks/domain/makeMockRecurringExpense';

// Mock dependencies
vi.mock('@/lib/adapters/storageAdapter');
// O factory do vi.mock precisa ser inline para evitar ReferenceError
vi.mock('@/lib/adapters/offlineAdapter', () => ({
  offlineAdapter: {
    isOfflineId: vi.fn().mockReturnValue(false),
    generateOfflineId: vi.fn().mockReturnValue('offline-id-1'),
    getPendingChanges: vi.fn().mockResolvedValue([]),
    syncPendingChanges: vi.fn().mockResolvedValue([]),
    clearPendingChanges: vi.fn().mockResolvedValue(undefined),
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    sync: { add: vi.fn() },
  },
}));
vi.mock('@/contexts/FamilyContext', () => ({
  useFamily: vi.fn(() => ({
    currentFamilyId: makeMockFamily().id,
  })),
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useBudget', () => {
  const mockFamilyId = makeMockFamily().id;
  
  const mockMonth: Month = {
    id: `${mockFamilyId}-2026-01`,
    label: 'Janeiro 2026',
    year: 2026,
    month: 1,
    income: 5000,
    expenses: [],
    incomeSources: [],
    categoryLimits: {
      essenciais: 55,
      conforto: 10,
      metas: 10,
      prazeres: 10,
      liberdade: 10,
      conhecimento: 5,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    
    (useFamily as Mock).mockReturnValue({
      currentFamilyId: makeMockFamily().id,
    });
    
    (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
    (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-id-1');
    
    // Default mock responses
    (storageAdapter.getMonthsWithExpenses as Mock).mockResolvedValue([mockMonth]);
    (storageAdapter.getRecurringExpenses as Mock).mockResolvedValue([]);
    (storageAdapter.getSubcategories as Mock).mockResolvedValue([]);
    (storageAdapter.createChannel as Mock).mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    });
    (storageAdapter.removeChannel as Mock).mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    it('should load data on mount when familyId exists', async () => {
      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(storageAdapter.getMonthsWithExpenses).toHaveBeenCalledWith(mockFamilyId);
      expect(storageAdapter.getRecurringExpenses).toHaveBeenCalledWith(mockFamilyId);
      expect(storageAdapter.getSubcategories).toHaveBeenCalledWith(mockFamilyId);
    });

    it('should not load data when familyId is null', async () => {
      (useFamily as Mock).mockReturnValue({ currentFamilyId: null });

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(storageAdapter.getMonthsWithExpenses).not.toHaveBeenCalled();
    });

    it('should auto-select the most recent month', async () => {
      const months = [
        { ...mockMonth, id: 'month-1', year: 2025, month: 12 },
        { ...mockMonth, id: 'month-2', year: 2026, month: 1 },
      ];
      (storageAdapter.getMonthsWithExpenses as Mock).mockResolvedValue(months);

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.currentMonthId).toBe('month-2');
      });
    });

    it('should set hasInitialized to true after loading', async () => {
      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });
    });
  });

  describe('month management', () => {
    it('should add a new month', async () => {
      (storageAdapter.insertMonth as Mock).mockResolvedValue({ id: 'new-month' });

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.addMonth(2026, 2);
      });

      expect(success).toBe(true);
      expect(storageAdapter.insertMonth).toHaveBeenCalledWith(mockFamilyId, 2026, 2);
    });

    it('should not add duplicate month', async () => {
      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        // Try to add month that already exists (2026-01)
        success = await result.current.addMonth(2026, 1);
      });

      expect(success).toBe(false);
      expect(storageAdapter.insertMonth).not.toHaveBeenCalled();
    });

    it('should remove a month', async () => {
      (storageAdapter.deleteMonthById as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.removeMonth(`${mockFamilyId}-2026-01`);
      });

      expect(storageAdapter.deleteMonthById).toHaveBeenCalledWith(mockFamilyId, `${mockFamilyId}-2026-01`);
    });

    it('should select a different month', async () => {
      const months = [
        { ...mockMonth, id: 'month-1' },
        { ...mockMonth, id: 'month-2' },
      ];
      (storageAdapter.getMonthsWithExpenses as Mock).mockResolvedValue(months);

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.selectMonth('month-1');
      });

      expect(result.current.currentMonthId).toBe('month-1');
    });
  });

  describe('expense management', () => {
    it('should add an expense', async () => {
      (storageAdapter.insertExpense as Mock).mockResolvedValue({ id: 'exp-1' });

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.currentMonthId).toBeTruthy();
      });

      await act(async () => {
        await result.current.addExpense('Groceries', 'essenciais', undefined, 100);
      });

      expect(storageAdapter.insertExpense).toHaveBeenCalledWith(
        mockFamilyId,
        expect.objectContaining({
          title: 'Groceries',
          category_key: 'essenciais',
          value: 100,
        })
      );
    });

    it('should update an expense', async () => {
      (storageAdapter.updateExpense as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateExpense('exp-1', 'Updated', 'conforto', undefined, 200);
      });

      expect(storageAdapter.updateExpense).toHaveBeenCalledWith(
        mockFamilyId,
        'exp-1',
        expect.objectContaining({
          title: 'Updated',
          category_key: 'conforto',
          value: 200,
        })
      );
    });

    it('should confirm payment (set pending to false)', async () => {
      (storageAdapter.setExpensePending as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.confirmPayment('exp-1');
      });

      expect(storageAdapter.setExpensePending).toHaveBeenCalledWith(mockFamilyId, 'exp-1', false);
    });

    it('should update expense state after confirming payment', async () => {
      // Start with a pending expense
      const monthWithPendingExpense: Month = {
        ...mockMonth,
        expenses: [
          makeMockExpense({ id: 'exp-1', title: 'Pending Bill', category: 'essenciais', value: 100, isRecurring: false, isPending: true }),
        ],
      };
      const monthAfterPayment: Month = {
        ...mockMonth,
        expenses: [
          makeMockExpense({ id: 'exp-1', title: 'Pending Bill', category: 'essenciais', value: 100, isRecurring: false, isPending: false }),
        ],
      };

      // First call returns pending expense, second call returns paid expense
      (storageAdapter.getMonthsWithExpenses as Mock)
        .mockResolvedValueOnce([monthWithPendingExpense])
        .mockResolvedValueOnce([monthAfterPayment]);
      (storageAdapter.setExpensePending as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify expense starts as pending
      expect(result.current.currentMonth?.expenses[0].isPending).toBe(true);

      await act(async () => {
        await result.current.confirmPayment('exp-1');
      });

      // Verify expense is now paid (not pending)
      await waitFor(() => {
        expect(result.current.currentMonth?.expenses[0].isPending).toBe(false);
      });
    });

    it('should remove an expense', async () => {
      (storageAdapter.deleteExpense as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.removeExpense('exp-1');
      });

      expect(storageAdapter.deleteExpense).toHaveBeenCalledWith(mockFamilyId, 'exp-1');
    });
  });

  describe('recurring expenses', () => {
    it('should add a recurring expense', async () => {
      (storageAdapter.insertRecurring as Mock).mockResolvedValue({ id: 'rec-1' });
      (storageAdapter.applyRecurringToMonth as Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.currentMonthId).toBeTruthy();
      });

      await act(async () => {
        await result.current.addRecurringExpense('Rent', 'essenciais', undefined, 1000, 5);
      });

      expect(storageAdapter.insertRecurring).toHaveBeenCalledWith(
        mockFamilyId,
        expect.objectContaining({
          title: 'Rent',
          category_key: 'essenciais',
          value: 1000,
          due_day: 5,
        })
      );
    });

    it('should update a recurring expense', async () => {
      (storageAdapter.updateRecurring as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateRecurringExpense('rec-1', 'Updated Rent', 'essenciais', undefined, 1200, 10, false, undefined, undefined, undefined, true);
      });

      expect(storageAdapter.updateRecurring).toHaveBeenCalledWith(
        mockFamilyId,
        'rec-1',
        expect.objectContaining({
          title: 'Updated Rent',
          value: 1200,
        }),
        true
      );
    });

    it('should remove a recurring expense', async () => {
      (storageAdapter.deleteRecurring as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.removeRecurringExpense('rec-1');
      });

      expect(storageAdapter.deleteRecurring).toHaveBeenCalledWith(mockFamilyId, 'rec-1');
    });

    it('should apply recurring to current month', async () => {
      const mockRecurring = makeMockRecurringExpense({ id: 'rec-1', title: 'Rent', category: 'essenciais', value: 1000, isRecurring: true });
      (storageAdapter.getRecurringExpenses as Mock).mockResolvedValue([mockRecurring]);
      (storageAdapter.applyRecurringToMonth as Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.recurringExpenses.length).toBeGreaterThan(0);
      });

      let applied: boolean | undefined;
      await act(async () => {
        applied = await result.current.applyRecurringToCurrentMonth('rec-1');
      });

      expect(applied).toBe(true);
      expect(storageAdapter.applyRecurringToMonth).toHaveBeenCalled();
    });
  });

  describe('subcategories', () => {
    it('should add a subcategory', async () => {
      (storageAdapter.addSubcategory as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSubcategory('Electricity', 'essenciais');
      });

      expect(storageAdapter.addSubcategory).toHaveBeenCalledWith(mockFamilyId, 'Electricity', 'essenciais');
    });

    it('should update a subcategory', async () => {
      (storageAdapter.updateSubcategory as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSubcategory('sub-1', 'Water');
      });

      expect(storageAdapter.updateSubcategory).toHaveBeenCalledWith(mockFamilyId, 'sub-1', 'Water');
    });

    it('should remove a subcategory', async () => {
      (storageAdapter.removeSubcategory as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.removeSubcategory('sub-1');
      });

      expect(storageAdapter.removeSubcategory).toHaveBeenCalledWith(mockFamilyId, 'sub-1');
    });
  });

  describe('income sources', () => {
    it('should add income source', async () => {
      (storageAdapter.insertIncomeSource as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.currentMonthId).toBeTruthy();
      });

      await act(async () => {
        await result.current.addIncomeSource('Salary', 5000);
      });

      expect(storageAdapter.insertIncomeSource).toHaveBeenCalledWith(
        mockFamilyId,
        expect.any(String),
        'Salary',
        5000
      );
    });

    it('should update income source', async () => {
      (storageAdapter.updateIncomeSource as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateIncomeSource('income-1', 'Bonus', 1000);
      });

      expect(storageAdapter.updateIncomeSource).toHaveBeenCalledWith(mockFamilyId, 'income-1', 'Bonus', 1000);
    });

    it('should delete income source', async () => {
      (storageAdapter.deleteIncomeSource as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteIncomeSource('income-1');
      });

      expect(storageAdapter.deleteIncomeSource).toHaveBeenCalledWith(mockFamilyId, 'income-1');
    });
  });

  describe('month limits', () => {
    it('should update month limits', async () => {
      (storageAdapter.updateMonthLimits as Mock).mockResolvedValue({});

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.currentMonthId).toBeTruthy();
      });

      const newLimits = {
        essenciais: 50,
        conforto: 15,
        metas: 10,
        prazeres: 10,
        liberdade: 10,
        conhecimento: 5,
      };

      await act(async () => {
        await result.current.updateMonthLimits(newLimits);
      });

      expect(storageAdapter.updateMonthLimits).toHaveBeenCalledWith(
        mockFamilyId,
        expect.any(String),
        newLimits
      );
    });

    it('should return current month limits', async () => {
      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.currentMonth).toBeTruthy();
      });

      expect(result.current.currentMonthLimits).toEqual({
        essenciais: 55,
        conforto: 10,
        metas: 10,
        prazeres: 10,
        liberdade: 10,
        conhecimento: 5,
      });
    });
  });

  describe('calculations', () => {
    it('should calculate category summary', async () => {
      const monthWithExpenses: Month = {
        ...mockMonth,
        income: 1000,
        expenses: [
          makeMockExpense({ id: 'e1', title: 'Rent', category: 'essenciais', value: 300, isRecurring: false, isPending: false }),
          makeMockExpense({ id: 'e2', title: 'Food', category: 'essenciais', value: 200, isRecurring: false, isPending: false }),
        ],
      };
      (storageAdapter.getMonthsWithExpenses as Mock).mockResolvedValue([monthWithExpenses]);

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.currentMonth).toBeTruthy();
      });

      const summary = result.current.getCategorySummary();
      const essenciais = summary.find(s => s.key === 'essenciais');

      expect(essenciais).toBeDefined();
      expect(essenciais?.spent).toBe(500);
      expect(essenciais?.budget).toBe(550); // 55% of 1000
      expect(essenciais?.remaining).toBe(50);
    });

    it('should calculate totals', async () => {
      const monthWithExpenses: Month = {
        ...mockMonth,
        income: 1000,
        expenses: [
          makeMockExpense({ id: 'e1', title: 'Rent', category: 'essenciais', value: 300, isRecurring: false, isPending: false }),
          makeMockExpense({ id: 'e2', title: 'Fun', category: 'prazeres', value: 100, isRecurring: false, isPending: false }),
        ],
      };
      (storageAdapter.getMonthsWithExpenses as Mock).mockResolvedValue([monthWithExpenses]);

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.currentMonth).toBeTruthy();
      });

      const totals = result.current.getTotals();

      expect(totals.totalSpent).toBe(400);
      expect(totals.totalBudget).toBe(1000);
      expect(totals.usedPercentage).toBe(40);
    });

    it('should return zero totals when no current month', async () => {
      (storageAdapter.getMonthsWithExpenses as Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const totals = result.current.getTotals();

      expect(totals.totalSpent).toBe(0);
      expect(totals.totalBudget).toBe(0);
      expect(totals.usedPercentage).toBe(0);
    });

    it('should handle zero budget without division by zero', async () => {
      const monthWithZeroIncome: Month = {
        ...mockMonth,
        income: 0,
        expenses: [
          makeMockExpense({ id: 'e1', title: 'Test', category: 'essenciais', value: 100, isRecurring: false, isPending: false }),
        ],
      };
      (storageAdapter.getMonthsWithExpenses as Mock).mockResolvedValue([monthWithZeroIncome]);

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.currentMonth).toBeTruthy();
      });

      const totals = result.current.getTotals();

      expect(totals.totalSpent).toBe(100);
      expect(totals.totalBudget).toBe(0);
      expect(totals.usedPercentage).toBe(0); // Protected from division by zero
      expect(Number.isFinite(totals.usedPercentage)).toBe(true);
    });

    it('should handle very large expense values', async () => {
      const monthWithLargeValues: Month = {
        ...mockMonth,
        income: 999999999,
        expenses: [
          { id: 'e1', title: 'Big', category: 'essenciais', value: 500000000, isRecurring: false, isPending: false },
        ],
      };
      (storageAdapter.getMonthsWithExpenses as Mock).mockResolvedValue([monthWithLargeValues]);

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.currentMonth).toBeTruthy();
      });

      const totals = result.current.getTotals();

      expect(totals.totalSpent).toBe(500000000);
      expect(Number.isFinite(totals.usedPercentage)).toBe(true);
    });

    it('should calculate category summary with zero spending', async () => {
      const monthWithNoExpenses: Month = {
        ...mockMonth,
        income: 1000,
        expenses: [],
      };
      (storageAdapter.getMonthsWithExpenses as Mock).mockResolvedValue([monthWithNoExpenses]);

      const { result } = renderHook(() => useBudget());

      await waitFor(() => {
        expect(result.current.currentMonth).toBeTruthy();
      });

      const summary = result.current.getCategorySummary();
      const essenciais = summary.find(s => s.key === 'essenciais');

      expect(essenciais?.spent).toBe(0);
      expect(essenciais?.budget).toBe(550); // 55% of 1000
      expect(essenciais?.remaining).toBe(550);
    });
  });
  // Sobrescreve métodos do offlineAdapter com mocks centralizados, se necessário
  const offline = offlineAdapter as unknown as Record<string, unknown>;
  const central = makeMockOfflineAdapter();
  Object.keys(central).forEach((key) => {
    // sobrescrevendo mocks
    offline[key] = central[key];
  });
});
