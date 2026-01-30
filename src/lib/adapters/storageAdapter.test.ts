import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getMonthsWithExpenses, insertMonth, createChannel, removeChannel } from './storageAdapter';
import * as budgetService from '../services/budgetService';
import { offlineAdapter } from './offlineAdapter';
import * as monthAdapter from './monthAdapter';
import {
  createMockMonthRow,
  createMockExpenseRow,
  createMockCategoryLimitRow,
  createMockIncomeSourceRow,
} from '@/test/mocks/domain/makeMockDomain';

import type { MonthRow, ExpenseRow, CategoryLimitRow, IncomeSourceRow } from '@/types/database';

// Mock dependencies
vi.mock('../services/budgetService');
vi.mock('./offlineAdapter');
vi.mock('./monthAdapter');
vi.mock('./recurringAdapter');

describe('storageAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.onLine to true by default
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  describe('getMonthsWithExpenses', () => {
    const mockFamilyId = 'family-123';

    it('should return empty array when familyId is null', async () => {
      const result = await getMonthsWithExpenses(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when familyId is empty string', async () => {
      const result = await getMonthsWithExpenses('');
      expect(result).toEqual([]);
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should fetch months from budgetService when online', async () => {
        const mockMonths: MonthRow[] = [
          createMockMonthRow({ id: 'month-1', family_id: mockFamilyId, year: 2024, month: 1, income: 5000 })
        ];
        const mockExpenses: ExpenseRow[] = [
          createMockExpenseRow({ id: 'expense-1', month_id: 'month-1', title: 'Test Expense', category_key: 'essenciais', value: 1000 })
        ];
        const mockLimits: CategoryLimitRow[] = [
          createMockCategoryLimitRow({ id: 'limit-1', month_id: 'month-1', category_key: 'essenciais', percentage: 30 })
        ];
        const mockIncomeSources: IncomeSourceRow[] = [
          createMockIncomeSourceRow({ id: 'income-1', month_id: 'month-1', name: 'Salary', value: 5000 })
        ];

        (budgetService.getMonths as Mock).mockResolvedValue({ data: mockMonths, error: null });
        (budgetService.getExpensesByMonth as Mock).mockResolvedValue({ data: mockExpenses, error: null });
        (budgetService.getMonthLimits as Mock).mockResolvedValue({ data: mockLimits, error: null });
        (budgetService.getIncomeSourcesByMonth as Mock).mockResolvedValue({ data: mockIncomeSources, error: null });

        const result = await getMonthsWithExpenses(mockFamilyId);

        expect(budgetService.getMonths).toHaveBeenCalledWith(mockFamilyId);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: 'month-1',
          year: 2024,
          month: 1,
          income: 5000,
        });
        expect(result[0].expenses).toHaveLength(1);
        expect(result[0].incomeSources).toHaveLength(1);
      });

      it('should return empty array when budgetService returns error', async () => {
        (budgetService.getMonths as Mock).mockResolvedValue({ data: null, error: new Error('Network error') });

        const result = await getMonthsWithExpenses(mockFamilyId);

        expect(result).toEqual([]);
      });

      it('should return empty array when budgetService returns null data', async () => {
        (budgetService.getMonths as Mock).mockResolvedValue({ data: null, error: null });

        const result = await getMonthsWithExpenses(mockFamilyId);

        expect(result).toEqual([]);
      });

      it('should use default limits when no limits are set', async () => {
        const mockMonths: MonthRow[] = [
          createMockMonthRow({ id: 'month-1', family_id: mockFamilyId, year: 2024, month: 1, income: 5000 })
        ];

        (budgetService.getMonths as Mock).mockResolvedValue({ data: mockMonths, error: null });
        (budgetService.getExpensesByMonth as Mock).mockResolvedValue({ data: [], error: null });
        (budgetService.getMonthLimits as Mock).mockResolvedValue({ data: [], error: null });
        (budgetService.getIncomeSourcesByMonth as Mock).mockResolvedValue({ data: [], error: null });

        const result = await getMonthsWithExpenses(mockFamilyId);

        expect(result[0].categoryLimits).toBeDefined();
        // Default limits should be set from CATEGORIES
        expect(Object.keys(result[0].categoryLimits!).length).toBeGreaterThan(0);
      });

      it('should calculate income from income sources', async () => {
        const mockMonths: MonthRow[] = [
          createMockMonthRow({ id: 'month-1', family_id: mockFamilyId, year: 2024, month: 1, income: 0 })
        ];
        const mockIncomeSources: IncomeSourceRow[] = [
          createMockIncomeSourceRow({ id: 'income-1', month_id: 'month-1', name: 'Salary', value: 3000 }),
          createMockIncomeSourceRow({ id: 'income-2', month_id: 'month-1', name: 'Freelance', value: 2000 })
        ];

        (budgetService.getMonths as Mock).mockResolvedValue({ data: mockMonths, error: null });
        (budgetService.getExpensesByMonth as Mock).mockResolvedValue({ data: [], error: null });
        (budgetService.getMonthLimits as Mock).mockResolvedValue({ data: [], error: null });
        (budgetService.getIncomeSourcesByMonth as Mock).mockResolvedValue({ data: mockIncomeSources, error: null });

        const result = await getMonthsWithExpenses(mockFamilyId);

        expect(result[0].income).toBe(5000);
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should fetch months from offlineAdapter when offline', async () => {
        const mockMonths: MonthRow[] = [
          createMockMonthRow({ id: 'month-1', family_id: mockFamilyId, year: 2024, month: 2, income: 4000 })
        ];
        const mockExpenses: ExpenseRow[] = [];
        const mockLimits: CategoryLimitRow[] = [];
        const mockIncomeSources: IncomeSourceRow[] = [
          createMockIncomeSourceRow({ id: 'income-1', month_id: 'month-1', name: 'Salary', value: 4000 })
        ];

        (offlineAdapter.getAllByIndex as Mock)
          .mockResolvedValueOnce(mockMonths) // months
          .mockResolvedValueOnce(mockExpenses) // expenses for month-1
          .mockResolvedValueOnce(mockLimits) // limits for month-1
          .mockResolvedValueOnce(mockIncomeSources); // income sources for month-1

        const result = await getMonthsWithExpenses(mockFamilyId);

        expect(offlineAdapter.getAllByIndex).toHaveBeenCalledWith('months', 'family_id', mockFamilyId);
        expect(result).toHaveLength(1);
        expect(result[0].income).toBe(4000);
      });

      it('should use offlineAdapter when familyId is offline ID', async () => {
        const offlineFamilyId = 'offline-family-123';
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);

        const mockMonths: MonthRow[] = [];
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue(mockMonths);

        const result = await getMonthsWithExpenses(offlineFamilyId);

        expect(offlineAdapter.getAllByIndex).toHaveBeenCalled();
        expect(budgetService.getMonths).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('should map expenses correctly in offline mode', async () => {
        const mockMonths: MonthRow[] = [
          createMockMonthRow({ id: 'month-1', family_id: mockFamilyId, year: 2024, month: 3, income: 3000 })
        ];
        const mockExpenses: ExpenseRow[] = [
          createMockExpenseRow({ 
            id: 'expense-1', 
            month_id: 'month-1', 
            title: 'Rent', 
            category_key: 'essenciais', 
            value: 1500, 
            is_recurring: true, 
            is_pending: false,
            due_day: 5,
            recurring_expense_id: 'recurring-1',
            installment_current: 2,
            installment_total: 12,
          })
        ];

        (offlineAdapter.getAllByIndex as Mock)
          .mockResolvedValueOnce(mockMonths)
          .mockResolvedValueOnce(mockExpenses)
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]);

        const result = await getMonthsWithExpenses(mockFamilyId);

        expect(result[0].expenses[0]).toMatchObject({
          id: 'expense-1',
          title: 'Rent',
          category: 'essenciais',
          value: 1500,
          isRecurring: true,
          isPending: false,
          dueDay: 5,
          recurringExpenseId: 'recurring-1',
          installmentInfo: { current: 2, total: 12 }
        });
      });

      it('should sort months by id', async () => {
        const mockMonths: MonthRow[] = [
          createMockMonthRow({ id: 'month-2', family_id: mockFamilyId, year: 2024, month: 2, income: 0 }),
          createMockMonthRow({ id: 'month-1', family_id: mockFamilyId, year: 2024, month: 1, income: 0 })
        ];

        (offlineAdapter.getAllByIndex as Mock)
          .mockResolvedValueOnce(mockMonths)
          .mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([])
          .mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

        const result = await getMonthsWithExpenses(mockFamilyId);

        expect(result[0].id).toBe('month-1');
        expect(result[1].id).toBe('month-2');
      });
    });
  });

  describe('insertMonth', () => {
    it('should return null when familyId is null', async () => {
      const result = await insertMonth(null, 2024, 1);
      expect(result).toBeNull();
    });

    it('should call monthAdapter.insertMonth with correct parameters', async () => {
      const familyId = 'family-123';
      const year = 2024;
      const month = 6;

      (monthAdapter.insertMonth as Mock).mockResolvedValue({ id: 'new-month-1' });

      await insertMonth(familyId, year, month);

      expect(monthAdapter.insertMonth).toHaveBeenCalledWith(
        familyId,
        year,
        month,
        expect.any(Function), // getMonthsWithExpenses
        expect.any(Function)  // recurringAdapter.getRecurringExpenses
      );
    });
  });

  describe('createChannel', () => {
    it('should call budgetService.createChannel', () => {
      const channelName = 'test-channel';
      createChannel(channelName);
      expect(budgetService.createChannel).toHaveBeenCalledWith(channelName);
    });
  });

  describe('removeChannel', () => {
    it('should call budgetService.removeChannel', () => {
      const mockChannel = { unsubscribe: vi.fn() } as unknown as ReturnType<typeof budgetService.createChannel>;
      removeChannel(mockChannel);
      expect(budgetService.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });
});
