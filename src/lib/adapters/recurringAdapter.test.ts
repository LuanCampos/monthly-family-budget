import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  getRecurringExpenses,
  insertRecurring,
  updateRecurring,
  deleteRecurring,
  applyRecurringToMonth
} from './recurringAdapter';
import * as budgetService from '../services/budgetService';
import { offlineAdapter } from './offlineAdapter';
import * as expenseAdapter from './expenseAdapter';
import { createMockRecurringExpenseRow } from '@/test/mocks/domain/makeMockDomain';
import type { RecurringExpenseRow, MonthRow } from '@/types/database';
import type { RecurringExpense } from '@/types';

// Mock dependencies
vi.mock('../services/budgetService');
vi.mock('./offlineAdapter');
vi.mock('./expenseAdapter');

describe('recurringAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  describe('getRecurringExpenses', () => {
    it('should return empty array when familyId is null', async () => {
      const result = await getRecurringExpenses(null);
      expect(result).toEqual([]);
    });

    it('should fetch from budgetService when online', async () => {
      const mockData: RecurringExpenseRow[] = [
        createMockRecurringExpenseRow({
          id: 'rec-1',
          family_id: 'family-123',
          title: 'Rent',
          category_key: 'essenciais',
          value: 1500,
          due_day: 5,
        })
      ];
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.getRecurringExpenses as Mock).mockResolvedValue({ data: mockData, error: null });

      const result = await getRecurringExpenses('family-123');

      expect(budgetService.getRecurringExpenses).toHaveBeenCalledWith('family-123');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Rent');
    });

    it('should return empty array on error', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.getRecurringExpenses as Mock).mockResolvedValue({ data: null, error: new Error('Error') });

      const result = await getRecurringExpenses('family-123');

      expect(result).toEqual([]);
    });

    it('should fetch from offlineAdapter when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      const mockData: RecurringExpenseRow[] = [
        createMockRecurringExpenseRow({
          id: 'rec-1',
          family_id: 'family-123',
          title: 'Netflix',
          category_key: 'prazeres',
          value: 50,
          due_day: 10,
        })
      ];
      (offlineAdapter.getAllByIndex as Mock).mockResolvedValue(mockData);

      const result = await getRecurringExpenses('family-123');

      expect(offlineAdapter.getAllByIndex).toHaveBeenCalledWith('recurring_expenses', 'family_id', 'family-123');
      expect(result).toHaveLength(1);
    });

    it('should use offlineAdapter when familyId is offline', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);
      (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);

      await getRecurringExpenses('offline-family-123');

      expect(offlineAdapter.getAllByIndex).toHaveBeenCalled();
      expect(budgetService.getRecurringExpenses).not.toHaveBeenCalled();
    });
  });

  describe('insertRecurring', () => {
    const mockPayload: Partial<RecurringExpenseRow> = {
      title: 'Internet',
      category_key: 'essenciais',
      value: 100,
      due_day: 15,
    };

    it('should return null when familyId is null', async () => {
      const result = await insertRecurring(null, mockPayload);
      expect(result).toBeNull();
    });

    it('should insert via budgetService when online', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.insertRecurring as Mock).mockResolvedValue({ data: { id: 'rec-1', ...mockPayload }, error: null });

      const result = await insertRecurring('family-123', mockPayload);

      expect(budgetService.insertRecurring).toHaveBeenCalledWith('family-123', mockPayload);
      expect(result).toMatchObject({ data: expect.objectContaining({ title: 'Internet' }) });
    });

    it('should insert via offlineAdapter when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-rec-1');
      (offlineAdapter.put as Mock).mockResolvedValue(undefined);

      const result = await insertRecurring('family-123', mockPayload);

      expect(offlineAdapter.put).toHaveBeenCalledWith('recurring_expenses', expect.objectContaining({
        id: 'offline-rec-1',
        title: 'Internet'
      }));
      expect(result).toBeDefined();
    });

    it('should fallback to offline when online insert fails', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-rec-1');
      (budgetService.insertRecurring as Mock).mockResolvedValue({ data: null, error: new Error('Network error') });
      (offlineAdapter.put as Mock).mockResolvedValue(undefined);
      (offlineAdapter.sync.add as Mock).mockResolvedValue(undefined);

      await insertRecurring('family-123', mockPayload);

      expect(offlineAdapter.put).toHaveBeenCalled();
      expect(offlineAdapter.sync.add).toHaveBeenCalled();
    });
  });

  describe('updateRecurring', () => {
    const updateData: Partial<RecurringExpenseRow> = {
      title: 'Updated Title',
      value: 150
    };

    it('should return early when familyId is null', async () => {
      await updateRecurring(null, 'rec-1', updateData);
      expect(budgetService.updateRecurring).not.toHaveBeenCalled();
    });

    it('should update via budgetService when online', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.updateRecurring as Mock).mockResolvedValue({ data: {}, error: null });

      await updateRecurring('family-123', 'rec-1', updateData);

      expect(budgetService.updateRecurring).toHaveBeenCalledWith('rec-1', updateData);
    });

    it('should update related expenses when updatePastExpenses is true', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.updateRecurring as Mock).mockResolvedValue({ data: {}, error: null });
      (budgetService.updateExpensesByRecurringId as Mock).mockResolvedValue({ error: null });

      await updateRecurring('family-123', 'rec-1', updateData, true);

      expect(budgetService.updateRecurring).toHaveBeenCalled();
      expect(budgetService.updateExpensesByRecurringId).toHaveBeenCalledWith('rec-1', expect.objectContaining({
        title: 'Updated Title',
        value: 150
      }));
    });

    it('should update via offlineAdapter when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.get as Mock).mockResolvedValue({ id: 'rec-1', title: 'Old Title' });
      (offlineAdapter.put as Mock).mockResolvedValue(undefined);

      await updateRecurring('family-123', 'rec-1', updateData);

      expect(offlineAdapter.get).toHaveBeenCalledWith('recurring_expenses', 'rec-1');
      expect(offlineAdapter.put).toHaveBeenCalledWith('recurring_expenses', expect.objectContaining({
        title: 'Updated Title'
      }));
    });

    it('should update related expenses offline when updatePastExpenses is true', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.get as Mock).mockResolvedValue({ id: 'rec-1', title: 'Old Title' });
      (offlineAdapter.getAll as Mock).mockResolvedValue([
        { id: 'exp-1', recurring_expense_id: 'rec-1', title: 'Old Title' },
        { id: 'exp-2', recurring_expense_id: 'rec-2', title: 'Other' }
      ]);
      (offlineAdapter.put as Mock).mockResolvedValue(undefined);

      await updateRecurring('family-123', 'rec-1', updateData, true);

      // Should update the recurring expense
      expect(offlineAdapter.put).toHaveBeenCalledWith('recurring_expenses', expect.any(Object));
      // Should only update related expenses (exp-1, not exp-2)
      const putCalls = (offlineAdapter.put as Mock).mock.calls;
      const expensePutCalls = putCalls.filter(call => call[0] === 'expenses');
      expect(expensePutCalls).toHaveLength(1);
      expect(expensePutCalls[0][1]).toMatchObject({ id: 'exp-1', title: 'Updated Title' });
    });
  });

  describe('deleteRecurring', () => {
    it('should return early when familyId is null', async () => {
      await deleteRecurring(null, 'rec-1');
      expect(budgetService.deleteRecurring).not.toHaveBeenCalled();
    });

    it('should delete via budgetService when online', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.deleteRecurring as Mock).mockResolvedValue({ error: null });

      await deleteRecurring('family-123', 'rec-1');

      expect(budgetService.deleteRecurring).toHaveBeenCalledWith('rec-1');
    });

    it('should delete via offlineAdapter when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.delete as Mock).mockResolvedValue(undefined);

      await deleteRecurring('family-123', 'rec-1');

      expect(offlineAdapter.delete).toHaveBeenCalledWith('recurring_expenses', 'rec-1');
    });
  });

  describe('applyRecurringToMonth', () => {
    const mockRecurring: RecurringExpense = {
      id: 'rec-1',
      title: 'Monthly Rent',
      category: 'essenciais',
      value: 1500,
      dueDay: 5,
      isRecurring: true,
      hasInstallments: false
    };

    it('should return false when familyId is null', async () => {
      const result = await applyRecurringToMonth(null, mockRecurring, 'month-1');
      expect(result).toBe(false);
    });

    it('should create expense via expenseAdapter when online', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.getMonthById as Mock).mockResolvedValue({ data: { id: 'month-1', year: 2024, month: 3 } });
      (expenseAdapter.insertExpense as Mock).mockResolvedValue({ id: 'expense-1' });

      const result = await applyRecurringToMonth('family-123', mockRecurring, 'month-1');

      expect(expenseAdapter.insertExpense).toHaveBeenCalledWith('family-123', expect.objectContaining({
        month_id: 'month-1',
        title: 'Monthly Rent',
        is_recurring: true,
        is_pending: true
      }));
      expect(result).toBe(true);
    });

    it('should return false when month is not found online', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.getMonthById as Mock).mockResolvedValue({ data: null });
      (budgetService.getMonths as Mock).mockResolvedValue({ data: [] });

      const result = await applyRecurringToMonth('family-123', mockRecurring, 'month-not-found');

      expect(result).toBe(false);
    });

    it('should create expense via offlineAdapter when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.get as Mock).mockResolvedValue({ id: 'month-1', year: 2024, month: 4 } as MonthRow);
      (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-exp-1');
      (offlineAdapter.put as Mock).mockResolvedValue(undefined);

      const result = await applyRecurringToMonth('family-123', mockRecurring, 'month-1');

      expect(offlineAdapter.put).toHaveBeenCalledWith('expenses', expect.objectContaining({
        id: 'offline-exp-1',
        title: 'Monthly Rent',
        is_recurring: true
      }));
      expect(result).toBe(true);
    });

    it('should return false when month is not found offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (offlineAdapter.get as Mock).mockResolvedValue(null);

      const result = await applyRecurringToMonth('family-123', mockRecurring, 'month-not-found');

      expect(result).toBe(false);
    });

    it('should include installment info for recurring with installments', async () => {
      const recurringWithInstallments: RecurringExpense = {
        ...mockRecurring,
        hasInstallments: true,
        totalInstallments: 12,
        startYear: 2024,
        startMonth: 1,
      };

      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.getMonthById as Mock).mockResolvedValue({ data: { id: 'month-1', year: 2024, month: 3 } });
      (expenseAdapter.insertExpense as Mock).mockResolvedValue({ id: 'expense-1' });

      await applyRecurringToMonth('family-123', recurringWithInstallments, 'month-1');

      expect(expenseAdapter.insertExpense).toHaveBeenCalledWith('family-123', expect.objectContaining({
        installment_total: 12
      }));
      // installment_current is calculated based on month difference from start date
      // It can be a number or undefined depending on the calculation
      const call = (expenseAdapter.insertExpense as Mock).mock.calls[0][1];
      expect(call).toHaveProperty('installment_current');
    });

    it('should return false when expense insert fails', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.getMonthById as Mock).mockResolvedValue({ data: { id: 'month-1', year: 2024, month: 3 } });
      (expenseAdapter.insertExpense as Mock).mockResolvedValue({ error: new Error('Insert failed') });

      const result = await applyRecurringToMonth('family-123', mockRecurring, 'month-1');

      expect(result).toBe(false);
    });
  });
});
