import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  insertMonth,
  updateMonthIncome,
  updateMonthLimits,
  deleteMonth,
  getIncomeSourcesByMonth,
  insertIncomeSource,
  updateIncomeSource,
  deleteIncomeSource
} from './monthAdapter';
import * as budgetService from '../services/budgetService';
import { offlineAdapter } from './offlineAdapter';
import * as expenseAdapter from './expenseAdapter';
import type { MonthRow, IncomeSourceRow } from '@/types/database';
import type { Month, RecurringExpense } from '@/types';

// Mock dependencies
vi.mock('../services/budgetService');
vi.mock('./offlineAdapter');
vi.mock('./expenseAdapter');

describe('monthAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  describe('insertMonth', () => {
    const mockFamilyId = 'family-123';
    const mockGetMonthsWithExpenses = vi.fn<(id: string) => Promise<Month[]>>();
    const mockGetRecurringExpenses = vi.fn<(id: string) => Promise<RecurringExpense[]>>();

    beforeEach(() => {
      mockGetMonthsWithExpenses.mockResolvedValue([]);
      mockGetRecurringExpenses.mockResolvedValue([]);
    });

    it('should return null when familyId is null', async () => {
      const result = await insertMonth(null, 2024, 1, mockGetMonthsWithExpenses, mockGetRecurringExpenses);
      expect(result).toBeNull();
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should create month via budgetService when online', async () => {
        const mockMonth: MonthRow = {
          id: 'month-1',
          family_id: mockFamilyId,
          year: 2024,
          month: 6,
          income: 0,
          created_at: '2024-06-01'
        };

        (budgetService.insertMonth as Mock).mockResolvedValue({ data: mockMonth, error: null });
        (budgetService.insertMonthLimit as Mock).mockResolvedValue({ data: {}, error: null });

        const result = await insertMonth(mockFamilyId, 2024, 6, mockGetMonthsWithExpenses, mockGetRecurringExpenses);

        expect(budgetService.insertMonth).toHaveBeenCalledWith(mockFamilyId, 2024, 6);
        expect(result).toMatchObject({ id: 'month-1', year: 2024, month: 6 });
      });

      it('should apply default limits when no previous months exist', async () => {
        const mockMonth: MonthRow = {
          id: 'month-1',
          family_id: mockFamilyId,
          year: 2024,
          month: 1,
          income: 0,
          created_at: '2024-01-01'
        };

        mockGetMonthsWithExpenses.mockResolvedValue([]);
        (budgetService.insertMonth as Mock).mockResolvedValue({ data: mockMonth, error: null });
        (budgetService.insertMonthLimit as Mock).mockResolvedValue({ data: {}, error: null });

        await insertMonth(mockFamilyId, 2024, 1, mockGetMonthsWithExpenses, mockGetRecurringExpenses);

        // Should insert default limits for all categories
        expect(budgetService.insertMonthLimit).toHaveBeenCalled();
      });

      it('should copy limits from previous month when exists', async () => {
        const existingMonth: Month = {
          id: 'month-0',
          label: '12/2023',
          year: 2023,
          month: 12,
          income: 5000,
          incomeSources: [],
          categoryLimits: { housing: 30, food: 20, transportation: 15, health: 10, education: 5, leisure: 5, clothing: 5, debts: 5, investments: 5, others: 0 },
          expenses: []
        };
        const newMonth: MonthRow = {
          id: 'month-1',
          family_id: mockFamilyId,
          year: 2024,
          month: 1,
          income: 0,
          created_at: '2024-01-01'
        };

        mockGetMonthsWithExpenses.mockResolvedValue([existingMonth]);
        (budgetService.insertMonth as Mock).mockResolvedValue({ data: newMonth, error: null });
        (budgetService.insertMonthLimit as Mock).mockResolvedValue({ data: {}, error: null });

        await insertMonth(mockFamilyId, 2024, 1, mockGetMonthsWithExpenses, mockGetRecurringExpenses);

        // Should copy limits from previous month
        expect(budgetService.insertMonthLimit).toHaveBeenCalledWith(
          expect.objectContaining({ month_id: 'month-1', category_key: 'housing', percentage: 30 })
        );
      });

      it('should apply recurring expenses to new month', async () => {
        const mockMonth: MonthRow = {
          id: 'month-1',
          family_id: mockFamilyId,
          year: 2024,
          month: 3,
          income: 0,
          created_at: '2024-03-01'
        };

        const mockRecurring: RecurringExpense = {
          id: 'recurring-1',
          familyId: mockFamilyId,
          title: 'Rent',
          category: 'housing',
          value: 1500,
          dueDay: 5,
          isActive: true,
          startDate: '2024-01-01',
          hasInstallments: false
        };

        mockGetRecurringExpenses.mockResolvedValue([mockRecurring]);
        (budgetService.insertMonth as Mock).mockResolvedValue({ data: mockMonth, error: null });
        (budgetService.insertMonthLimit as Mock).mockResolvedValue({ data: {}, error: null });
        (expenseAdapter.insertExpense as Mock).mockResolvedValue({ id: 'expense-1' });

        await insertMonth(mockFamilyId, 2024, 3, mockGetMonthsWithExpenses, mockGetRecurringExpenses);

        expect(expenseAdapter.insertExpense).toHaveBeenCalledWith(
          mockFamilyId,
          expect.objectContaining({
            month_id: 'month-1',
            title: 'Rent',
            category_key: 'housing',
            value: 1500,
            is_recurring: true,
            is_pending: true
          })
        );
      });

      it('should fallback to offline when online insert fails', async () => {
        (budgetService.insertMonth as Mock).mockResolvedValue({ data: null, error: new Error('Network error') });
        (offlineAdapter.put as Mock).mockResolvedValue(undefined);
        (offlineAdapter.sync.add as Mock).mockResolvedValue(undefined);

        const result = await insertMonth(mockFamilyId, 2024, 1, mockGetMonthsWithExpenses, mockGetRecurringExpenses);

        expect(offlineAdapter.put).toHaveBeenCalledWith('months', expect.any(Object));
        expect(offlineAdapter.sync.add).toHaveBeenCalled();
        expect(result).toBeDefined();
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should create month via offlineAdapter when offline', async () => {
        (offlineAdapter.put as Mock).mockResolvedValue(undefined);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);

        const result = await insertMonth(mockFamilyId, 2024, 2, mockGetMonthsWithExpenses, mockGetRecurringExpenses);

        expect(offlineAdapter.put).toHaveBeenCalledWith('months', expect.objectContaining({
          family_id: mockFamilyId,
          year: 2024,
          month: 2
        }));
        expect(budgetService.insertMonth).not.toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should use offlineAdapter when familyId is offline', async () => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);
        (offlineAdapter.put as Mock).mockResolvedValue(undefined);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);

        await insertMonth('offline-family-123', 2024, 1, mockGetMonthsWithExpenses, mockGetRecurringExpenses);

        expect(offlineAdapter.put).toHaveBeenCalled();
        expect(budgetService.insertMonth).not.toHaveBeenCalled();
      });
    });
  });

  describe('updateMonthIncome', () => {
    it('should return early when familyId is null', async () => {
      await updateMonthIncome(null, 'month-1', 5000);
      expect(budgetService.updateMonthIncome).not.toHaveBeenCalled();
    });

    it('should update via budgetService when online', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.updateMonthIncome as Mock).mockResolvedValue({ error: null });

      await updateMonthIncome('family-123', 'month-1', 5000);

      expect(budgetService.updateMonthIncome).toHaveBeenCalledWith('month-1', 5000);
    });

    it('should update via offlineAdapter when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.get as Mock).mockResolvedValue({ id: 'month-1', income: 0 });
      (offlineAdapter.put as Mock).mockResolvedValue(undefined);

      await updateMonthIncome('family-123', 'month-1', 5000);

      expect(offlineAdapter.get).toHaveBeenCalledWith('months', 'month-1');
      expect(offlineAdapter.put).toHaveBeenCalledWith('months', expect.objectContaining({ income: 5000 }));
    });
  });

  describe('updateMonthLimits', () => {
    const validLimits = {
      housing: 30,
      food: 20,
      transportation: 15,
      health: 10,
      education: 5,
      leisure: 5,
      clothing: 5,
      debts: 5,
      investments: 5,
      others: 0
    } as Record<string, number>;

    it('should return early when familyId is null', async () => {
      await updateMonthLimits(null, 'month-1', validLimits as never);
      expect(budgetService.updateMonthLimit).not.toHaveBeenCalled();
    });

    it('should throw error when limits do not sum to 100', async () => {
      const invalidLimits = { ...validLimits, housing: 50 }; // Total: 120%

      await expect(updateMonthLimits('family-123', 'month-1', invalidLimits as never))
        .rejects.toThrow(/must sum to 100%/);
    });

    it('should update limits via budgetService when online', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.updateMonthLimit as Mock).mockResolvedValue({ error: null });

      await updateMonthLimits('family-123', 'month-1', validLimits as never);

      expect(budgetService.updateMonthLimit).toHaveBeenCalled();
    });

    it('should update limits via offlineAdapter when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.get as Mock).mockResolvedValue(null);
      (offlineAdapter.put as Mock).mockResolvedValue(undefined);

      await updateMonthLimits('family-123', 'month-1', validLimits as never);

      expect(offlineAdapter.put).toHaveBeenCalledWith('category_limits', expect.any(Object));
    });
  });

  describe('deleteMonth', () => {
    it('should return early when familyId is null', async () => {
      await deleteMonth(null, 'month-1');
      expect(budgetService.deleteMonthById).not.toHaveBeenCalled();
    });

    it('should delete via budgetService when online', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.deleteExpensesByMonth as Mock).mockResolvedValue({ error: null });
      (budgetService.deleteMonthById as Mock).mockResolvedValue({ error: null });

      await deleteMonth('family-123', 'month-1');

      expect(budgetService.deleteExpensesByMonth).toHaveBeenCalledWith('month-1');
      expect(budgetService.deleteMonthById).toHaveBeenCalledWith('month-1');
    });

    it('should delete all associated data via offlineAdapter when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.delete as Mock).mockResolvedValue(undefined);
      (offlineAdapter.getAllByIndex as Mock)
        .mockResolvedValueOnce([{ id: 'expense-1' }]) // expenses
        .mockResolvedValueOnce([{ id: 'limit-1' }])   // limits
        .mockResolvedValueOnce([{ id: 'income-1' }]); // income sources

      await deleteMonth('family-123', 'month-1');

      expect(offlineAdapter.delete).toHaveBeenCalledWith('months', 'month-1');
      expect(offlineAdapter.delete).toHaveBeenCalledWith('expenses', 'expense-1');
      expect(offlineAdapter.delete).toHaveBeenCalledWith('category_limits', 'limit-1');
      expect(offlineAdapter.delete).toHaveBeenCalledWith('income_sources', 'income-1');
    });
  });

  describe('getIncomeSourcesByMonth', () => {
    it('should fetch income sources via budgetService', async () => {
      const mockSources: IncomeSourceRow[] = [
        { id: 'source-1', month_id: 'month-1', name: 'Salary', value: 5000, created_at: '2024-01-01' }
      ];
      (budgetService.getIncomeSourcesByMonth as Mock).mockResolvedValue({ data: mockSources, error: null });

      const result = await getIncomeSourcesByMonth('month-1');

      expect(budgetService.getIncomeSourcesByMonth).toHaveBeenCalledWith('month-1');
      expect(result).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      (budgetService.getIncomeSourcesByMonth as Mock).mockResolvedValue({ data: null, error: new Error('Error') });

      const result = await getIncomeSourcesByMonth('month-1');

      expect(result).toEqual([]);
    });
  });

  describe('insertIncomeSource', () => {
    it('should return null when familyId is null', async () => {
      const result = await insertIncomeSource(null, 'month-1', 'Salary', 5000);
      expect(result).toBeNull();
    });

    it('should insert via budgetService when online', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.insertIncomeSource as Mock).mockResolvedValue({ data: { id: 'source-1' }, error: null });

      const result = await insertIncomeSource('family-123', 'month-1', 'Salary', 5000);

      expect(budgetService.insertIncomeSource).toHaveBeenCalledWith('month-1', 'Salary', 5000);
      expect(result).toMatchObject({ id: 'source-1' });
    });

    it('should insert via offlineAdapter when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-inc-1');
      (offlineAdapter.put as Mock).mockResolvedValue(undefined);

      const result = await insertIncomeSource('family-123', 'month-1', 'Salary', 5000);

      expect(offlineAdapter.put).toHaveBeenCalledWith('income_sources', expect.objectContaining({
        name: 'Salary',
        value: 5000
      }));
      expect(result).toBeDefined();
    });
  });

  describe('updateIncomeSource', () => {
    it('should return early when familyId is null', async () => {
      await updateIncomeSource(null, 'source-1', 'Updated', 6000);
      expect(budgetService.updateIncomeSourceById).not.toHaveBeenCalled();
    });

    it('should update via budgetService when online', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.updateIncomeSourceById as Mock).mockResolvedValue({ data: {}, error: null });

      await updateIncomeSource('family-123', 'source-1', 'Updated', 6000);

      expect(budgetService.updateIncomeSourceById).toHaveBeenCalledWith('source-1', 'Updated', 6000);
    });
  });

  describe('deleteIncomeSource', () => {
    it('should return early when familyId is null', async () => {
      await deleteIncomeSource(null, 'source-1');
      expect(budgetService.deleteIncomeSourceById).not.toHaveBeenCalled();
    });

    it('should delete via budgetService when online', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);

      await deleteIncomeSource('family-123', 'source-1');

      expect(budgetService.deleteIncomeSourceById).toHaveBeenCalledWith('source-1');
    });

    it('should delete via offlineAdapter when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.delete as Mock).mockResolvedValue(undefined);

      await deleteIncomeSource('family-123', 'source-1');

      expect(offlineAdapter.delete).toHaveBeenCalledWith('income_sources', 'source-1');
    });
  });
});
