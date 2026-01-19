import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { insertExpense, updateExpense, setExpensePending, deleteExpense } from './expenseAdapter';
import * as budgetService from '../services/budgetService';
import * as goalAdapter from './goal';
import { offlineAdapter } from './offlineAdapter';

// Mock dependencies
vi.mock('../services/budgetService');
vi.mock('./goal');
vi.mock('./offlineAdapter', () => ({
  offlineAdapter: {
    isOfflineId: vi.fn(),
    generateOfflineId: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    sync: {
      add: vi.fn(),
    },
  },
}));

describe('expenseAdapter', () => {
  const mockFamilyId = 'family-123';
  const mockMonthId = 'family-123-2026-01';
  const mockExpenseId = 'expense-1';
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: online mode
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
    (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-exp-1');
    (goalAdapter.getGoalBySubcategoryId as Mock).mockResolvedValue(null);
    (goalAdapter.getGoalByCategoryKey as Mock).mockResolvedValue(null);
    (goalAdapter.getEntryByExpense as Mock).mockResolvedValue(null);
  });

  describe('insertExpense', () => {
    const basePayload = {
      month_id: mockMonthId,
      title: 'Test Expense',
      category_key: 'essenciais' as const,
      value: 100,
    };

    it('should return null if familyId is null', async () => {
      const result = await insertExpense(null, basePayload);
      expect(result).toBeNull();
    });

    it('should insert expense online successfully', async () => {
      const mockResponse = {
        data: { id: mockExpenseId, ...basePayload, family_id: mockFamilyId },
        error: null,
      };
      (budgetService.insertExpense as Mock).mockResolvedValue(mockResponse);

      const result = await insertExpense(mockFamilyId, basePayload);

      expect(budgetService.insertExpense).toHaveBeenCalledWith({
        ...basePayload,
        family_id: mockFamilyId,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should insert expense offline when navigator is offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const result = await insertExpense(mockFamilyId, basePayload);

      expect(budgetService.insertExpense).not.toHaveBeenCalled();
      expect(offlineAdapter.put).toHaveBeenCalledWith('expenses', expect.objectContaining({
        id: 'offline-exp-1',
        family_id: mockFamilyId,
        title: 'Test Expense',
      }));
      expect(result).toMatchObject({
        id: 'offline-exp-1',
        family_id: mockFamilyId,
      });
    });

    it('should insert expense offline when familyId is offline', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);

      const result = await insertExpense(mockFamilyId, basePayload);

      expect(budgetService.insertExpense).not.toHaveBeenCalled();
      expect(offlineAdapter.put).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'offline-exp-1' });
    });

    it('should fallback to offline on service error and queue sync', async () => {
      (budgetService.insertExpense as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      const result = await insertExpense(mockFamilyId, basePayload);

      expect(offlineAdapter.put).toHaveBeenCalledWith('expenses', expect.any(Object));
      expect(offlineAdapter.sync.add).toHaveBeenCalledWith(expect.objectContaining({
        type: 'expense',
        action: 'insert',
        familyId: mockFamilyId,
      }));
      expect(result).toMatchObject({ id: 'offline-exp-1' });
    });

    it('should not queue sync when offline familyId on service error', async () => {
      (offlineAdapter.isOfflineId as Mock).mockImplementation((id) => id === mockFamilyId);
      (budgetService.insertExpense as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      await insertExpense(mockFamilyId, basePayload);

      expect(offlineAdapter.sync.add).not.toHaveBeenCalled();
    });

    it('should create goal entry when expense has linked goal via subcategory', async () => {
      const mockGoal = { id: 'goal-1', name: 'Test Goal' };
      (goalAdapter.getGoalBySubcategoryId as Mock).mockResolvedValue(mockGoal);
      (budgetService.insertExpense as Mock).mockResolvedValue({
        data: { id: mockExpenseId, ...basePayload, subcategory_id: 'sub-1', is_pending: false },
        error: null,
      });

      await insertExpense(mockFamilyId, { ...basePayload, subcategory_id: 'sub-1' });

      expect(goalAdapter.createEntry).toHaveBeenCalledWith(mockFamilyId, expect.objectContaining({
        goalId: 'goal-1',
        expenseId: mockExpenseId,
      }));
    });

    it('should create goal entry for liberdade category', async () => {
      const mockGoal = { id: 'goal-liberdade', name: 'Liberdade Goal' };
      (goalAdapter.getGoalByCategoryKey as Mock).mockResolvedValue(mockGoal);
      (budgetService.insertExpense as Mock).mockResolvedValue({
        data: { id: mockExpenseId, ...basePayload, category_key: 'liberdade', is_pending: false },
        error: null,
      });

      await insertExpense(mockFamilyId, { ...basePayload, category_key: 'liberdade' });

      expect(goalAdapter.getGoalByCategoryKey).toHaveBeenCalledWith('liberdade');
      expect(goalAdapter.createEntry).toHaveBeenCalled();
    });

    it('should NOT create goal entry when expense is pending', async () => {
      const mockGoal = { id: 'goal-1', name: 'Test Goal' };
      (goalAdapter.getGoalBySubcategoryId as Mock).mockResolvedValue(mockGoal);
      (budgetService.insertExpense as Mock).mockResolvedValue({
        data: { id: mockExpenseId, ...basePayload, subcategory_id: 'sub-1', is_pending: true },
        error: null,
      });

      await insertExpense(mockFamilyId, { ...basePayload, subcategory_id: 'sub-1', is_pending: true });

      expect(goalAdapter.createEntry).not.toHaveBeenCalled();
    });

    it('should include installment data when provided', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const payloadWithInstallment = {
        ...basePayload,
        installment_current: 1,
        installment_total: 12,
      };

      await insertExpense(mockFamilyId, payloadWithInstallment);

      expect(offlineAdapter.put).toHaveBeenCalledWith('expenses', expect.objectContaining({
        installment_current: 1,
        installment_total: 12,
      }));
    });
  });

  describe('updateExpense', () => {
    const mockExistingExpense = {
      id: mockExpenseId,
      family_id: mockFamilyId,
      month_id: mockMonthId,
      title: 'Old Title',
      category_key: 'essenciais',
      value: 100,
      is_pending: false,
    };

    beforeEach(() => {
      (offlineAdapter.get as Mock).mockResolvedValue(mockExistingExpense);
    });

    it('should do nothing if familyId is null', async () => {
      await updateExpense(null, mockExpenseId, { title: 'New Title' });
      expect(budgetService.updateExpense).not.toHaveBeenCalled();
      expect(offlineAdapter.put).not.toHaveBeenCalled();
    });

    it('should update expense online successfully', async () => {
      (budgetService.updateExpense as Mock).mockResolvedValue({
        data: { ...mockExistingExpense, title: 'New Title' },
        error: null,
      });

      await updateExpense(mockFamilyId, mockExpenseId, { title: 'New Title' });

      expect(budgetService.updateExpense).toHaveBeenCalledWith(mockExpenseId, { title: 'New Title' });
    });

    it('should update expense offline when navigator is offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      await updateExpense(mockFamilyId, mockExpenseId, { title: 'New Title' });

      expect(budgetService.updateExpense).not.toHaveBeenCalled();
      expect(offlineAdapter.put).toHaveBeenCalledWith('expenses', expect.objectContaining({
        id: mockExpenseId,
        title: 'New Title',
      }));
    });

    it('should update expense offline when familyId is offline', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);

      await updateExpense(mockFamilyId, mockExpenseId, { value: 200 });

      expect(budgetService.updateExpense).not.toHaveBeenCalled();
      expect(offlineAdapter.put).toHaveBeenCalled();
    });

    it('should fallback to offline on service error and queue sync', async () => {
      (budgetService.updateExpense as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      await updateExpense(mockFamilyId, mockExpenseId, { title: 'New Title' });

      expect(offlineAdapter.put).toHaveBeenCalled();
      expect(offlineAdapter.sync.add).toHaveBeenCalledWith(expect.objectContaining({
        type: 'expense',
        action: 'update',
        data: { id: mockExpenseId, title: 'New Title' },
      }));
    });

    it('should update goal entry when expense value changes', async () => {
      const mockEntry = { id: 'entry-1', goalId: 'goal-1', expenseId: mockExpenseId };
      const mockGoal = { id: 'goal-1', name: 'Test Goal' };
      (goalAdapter.getEntryByExpense as Mock).mockResolvedValue(mockEntry);
      (goalAdapter.getGoalBySubcategoryId as Mock).mockResolvedValue(mockGoal);
      (offlineAdapter.get as Mock).mockResolvedValue({ ...mockExistingExpense, subcategory_id: 'sub-1' });
      (budgetService.updateExpense as Mock).mockResolvedValue({
        data: { ...mockExistingExpense, subcategory_id: 'sub-1', value: 200 },
        error: null,
      });

      await updateExpense(mockFamilyId, mockExpenseId, { value: 200 });

      expect(goalAdapter.updateEntry).toHaveBeenCalledWith(
        mockFamilyId,
        'entry-1',
        expect.objectContaining({ value: 200 }),
        true
      );
    });
  });

  describe('setExpensePending', () => {
    const mockExpense = {
      id: mockExpenseId,
      family_id: mockFamilyId,
      month_id: mockMonthId,
      title: 'Test Expense',
      category_key: 'essenciais',
      value: 100,
      is_pending: true,
    };

    beforeEach(() => {
      (offlineAdapter.get as Mock).mockResolvedValue(mockExpense);
    });

    it('should do nothing if familyId is null', async () => {
      await setExpensePending(null, mockExpenseId, false);
      expect(offlineAdapter.get).not.toHaveBeenCalled();
    });

    it('should do nothing if expense not found', async () => {
      (offlineAdapter.get as Mock).mockResolvedValue(null);

      await setExpensePending(mockFamilyId, mockExpenseId, false);

      expect(budgetService.setExpensePending).not.toHaveBeenCalled();
      expect(offlineAdapter.put).not.toHaveBeenCalled();
    });

    it('should set pending status online successfully', async () => {
      (budgetService.setExpensePending as Mock).mockResolvedValue({
        data: { ...mockExpense, is_pending: false },
        error: null,
      });

      await setExpensePending(mockFamilyId, mockExpenseId, false);

      expect(budgetService.setExpensePending).toHaveBeenCalledWith(mockExpenseId, false);
    });

    it('should set pending status offline when navigator is offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      await setExpensePending(mockFamilyId, mockExpenseId, false);

      expect(budgetService.setExpensePending).not.toHaveBeenCalled();
      expect(offlineAdapter.put).toHaveBeenCalledWith('expenses', expect.objectContaining({
        id: mockExpenseId,
        is_pending: false,
      }));
    });

    it('should create goal entry when expense is marked as paid (pending: false)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      const mockGoal = { id: 'goal-1', name: 'Test Goal' };
      (offlineAdapter.get as Mock).mockResolvedValue({ ...mockExpense, subcategory_id: 'sub-1' });
      (goalAdapter.getGoalBySubcategoryId as Mock).mockResolvedValue(mockGoal);

      await setExpensePending(mockFamilyId, mockExpenseId, false);

      expect(goalAdapter.getGoalBySubcategoryId).toHaveBeenCalled();
    });

    it('should fallback to offline on service error and queue sync', async () => {
      (budgetService.setExpensePending as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      await setExpensePending(mockFamilyId, mockExpenseId, false);

      expect(offlineAdapter.put).toHaveBeenCalled();
      expect(offlineAdapter.sync.add).toHaveBeenCalledWith(expect.objectContaining({
        type: 'expense',
        action: 'update',
        data: { id: mockExpenseId, is_pending: false },
      }));
    });
  });

  describe('deleteExpense', () => {
    const mockExpense = {
      id: mockExpenseId,
      family_id: mockFamilyId,
      month_id: mockMonthId,
      title: 'Test Expense',
      category_key: 'essenciais',
      value: 100,
    };

    beforeEach(() => {
      (offlineAdapter.get as Mock).mockResolvedValue(mockExpense);
    });

    it('should do nothing if familyId is null', async () => {
      await deleteExpense(null, mockExpenseId);
      expect(offlineAdapter.delete).not.toHaveBeenCalled();
      expect(budgetService.deleteExpenseById).not.toHaveBeenCalled();
    });

    it('should delete expense online successfully', async () => {
      (budgetService.deleteExpenseById as Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      await deleteExpense(mockFamilyId, mockExpenseId);

      expect(budgetService.deleteExpenseById).toHaveBeenCalledWith(mockExpenseId);
    });

    it('should delete expense offline when navigator is offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      await deleteExpense(mockFamilyId, mockExpenseId);

      expect(budgetService.deleteExpenseById).not.toHaveBeenCalled();
      expect(offlineAdapter.delete).toHaveBeenCalledWith('expenses', mockExpenseId);
    });

    it('should delete expense offline when familyId is offline', async () => {
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);

      await deleteExpense(mockFamilyId, mockExpenseId);

      expect(budgetService.deleteExpenseById).not.toHaveBeenCalled();
      expect(offlineAdapter.delete).toHaveBeenCalledWith('expenses', mockExpenseId);
    });

    it('should delete goal entry when expense has one', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      const mockEntry = { id: 'entry-1', goalId: 'goal-1', expenseId: mockExpenseId };
      (goalAdapter.getEntryByExpense as Mock).mockResolvedValue(mockEntry);

      await deleteExpense(mockFamilyId, mockExpenseId);

      expect(goalAdapter.deleteEntry).toHaveBeenCalledWith(mockFamilyId, 'entry-1', true);
    });

    it('should delete goal entry on successful online delete', async () => {
      const mockEntry = { id: 'entry-1', goalId: 'goal-1', expenseId: mockExpenseId };
      (goalAdapter.getEntryByExpense as Mock).mockResolvedValue(mockEntry);
      (budgetService.deleteExpenseById as Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      await deleteExpense(mockFamilyId, mockExpenseId);

      expect(goalAdapter.deleteEntry).toHaveBeenCalledWith(mockFamilyId, 'entry-1', true);
    });

    it('should NOT delete goal entry on service error', async () => {
      const mockEntry = { id: 'entry-1', goalId: 'goal-1', expenseId: mockExpenseId };
      (goalAdapter.getEntryByExpense as Mock).mockResolvedValue(mockEntry);
      (budgetService.deleteExpenseById as Mock).mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      });

      await deleteExpense(mockFamilyId, mockExpenseId);

      expect(goalAdapter.deleteEntry).not.toHaveBeenCalled();
    });
  });
});
