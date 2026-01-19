import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { createBudgetApi } from './useBudgetApi';
import * as storageAdapter from '@/lib/adapters/storageAdapter';

// Mock the storage adapter
vi.mock('@/lib/adapters/storageAdapter');

describe('useBudgetApi', () => {
  const mockFamilyId = 'family-123';
  const mockSetMonths = vi.fn();
  const mockSetRecurringExpenses = vi.fn();
  const mockSetSubcategories = vi.fn();

  let api: ReturnType<typeof createBudgetApi>;

  beforeEach(() => {
    vi.clearAllMocks();
    api = createBudgetApi({
      currentFamilyId: mockFamilyId,
      setMonths: mockSetMonths,
      setRecurringExpenses: mockSetRecurringExpenses,
      setSubcategories: mockSetSubcategories,
    });
  });

  describe('loadMonths', () => {
    it('should load months and call setMonths', async () => {
      const mockMonths = [{ id: 'month-1', year: 2026, month: 1 }];
      (storageAdapter.getMonthsWithExpenses as Mock).mockResolvedValue(mockMonths);

      await api.loadMonths();

      expect(storageAdapter.getMonthsWithExpenses).toHaveBeenCalledWith(mockFamilyId);
      expect(mockSetMonths).toHaveBeenCalledWith(mockMonths);
    });

    it('should not call storageAdapter if familyId is null', async () => {
      const apiNoFamily = createBudgetApi({
        currentFamilyId: null,
        setMonths: mockSetMonths,
        setRecurringExpenses: mockSetRecurringExpenses,
        setSubcategories: mockSetSubcategories,
      });

      await apiNoFamily.loadMonths();

      expect(storageAdapter.getMonthsWithExpenses).not.toHaveBeenCalled();
      expect(mockSetMonths).not.toHaveBeenCalled();
    });
  });

  describe('loadRecurringExpenses', () => {
    it('should load recurring expenses and call setRecurringExpenses', async () => {
      const mockRecurring = [{ id: 'rec-1', title: 'Rent' }];
      (storageAdapter.getRecurringExpenses as Mock).mockResolvedValue(mockRecurring);

      await api.loadRecurringExpenses();

      expect(storageAdapter.getRecurringExpenses).toHaveBeenCalledWith(mockFamilyId);
      expect(mockSetRecurringExpenses).toHaveBeenCalledWith(mockRecurring);
    });

    it('should not call storageAdapter if familyId is null', async () => {
      const apiNoFamily = createBudgetApi({
        currentFamilyId: null,
        setMonths: mockSetMonths,
        setRecurringExpenses: mockSetRecurringExpenses,
        setSubcategories: mockSetSubcategories,
      });

      await apiNoFamily.loadRecurringExpenses();

      expect(storageAdapter.getRecurringExpenses).not.toHaveBeenCalled();
    });
  });

  describe('loadSubcategories', () => {
    it('should load subcategories and call setSubcategories', async () => {
      const mockSubs = [{ id: 'sub-1', name: 'Electricity' }];
      (storageAdapter.getSubcategories as Mock).mockResolvedValue(mockSubs);

      await api.loadSubcategories();

      expect(storageAdapter.getSubcategories).toHaveBeenCalledWith(mockFamilyId);
      expect(mockSetSubcategories).toHaveBeenCalledWith(mockSubs);
    });

    it('should not call storageAdapter if familyId is null', async () => {
      const apiNoFamily = createBudgetApi({
        currentFamilyId: null,
        setMonths: mockSetMonths,
        setRecurringExpenses: mockSetRecurringExpenses,
        setSubcategories: mockSetSubcategories,
      });

      await apiNoFamily.loadSubcategories();

      expect(storageAdapter.getSubcategories).not.toHaveBeenCalled();
    });
  });

  describe('addSubcategory', () => {
    it('should add subcategory and reload subcategories', async () => {
      (storageAdapter.addSubcategory as Mock).mockResolvedValue({});
      (storageAdapter.getSubcategories as Mock).mockResolvedValue([]);

      await api.addSubcategory('Electricity', 'essenciais');

      expect(storageAdapter.addSubcategory).toHaveBeenCalledWith(mockFamilyId, 'Electricity', 'essenciais');
      expect(storageAdapter.getSubcategories).toHaveBeenCalled();
    });

    it('should not add subcategory if familyId is null', async () => {
      const apiNoFamily = createBudgetApi({
        currentFamilyId: null,
        setMonths: mockSetMonths,
        setRecurringExpenses: mockSetRecurringExpenses,
        setSubcategories: mockSetSubcategories,
      });

      await apiNoFamily.addSubcategory('Electricity', 'essenciais');

      expect(storageAdapter.addSubcategory).not.toHaveBeenCalled();
    });
  });

  describe('updateSubcategory', () => {
    it('should update subcategory and reload', async () => {
      (storageAdapter.updateSubcategory as Mock).mockResolvedValue({});
      (storageAdapter.getSubcategories as Mock).mockResolvedValue([]);

      await api.updateSubcategory('sub-1', 'Water');

      expect(storageAdapter.updateSubcategory).toHaveBeenCalledWith(mockFamilyId, 'sub-1', 'Water');
      expect(storageAdapter.getSubcategories).toHaveBeenCalled();
    });
  });

  describe('removeSubcategory', () => {
    it('should remove subcategory and reload', async () => {
      (storageAdapter.removeSubcategory as Mock).mockResolvedValue({});
      (storageAdapter.getSubcategories as Mock).mockResolvedValue([]);

      await api.removeSubcategory('sub-1');

      expect(storageAdapter.removeSubcategory).toHaveBeenCalledWith(mockFamilyId, 'sub-1');
      expect(storageAdapter.getSubcategories).toHaveBeenCalled();
    });
  });

  describe('insertMonth', () => {
    it('should insert month via storageAdapter', async () => {
      const mockResult = { id: 'month-1', year: 2026, month: 1 };
      (storageAdapter.insertMonth as Mock).mockResolvedValue(mockResult);

      const result = await api.insertMonth(2026, 1);

      expect(storageAdapter.insertMonth).toHaveBeenCalledWith(mockFamilyId, 2026, 1);
      expect(result).toEqual(mockResult);
    });

    it('should return null if familyId is null', async () => {
      const apiNoFamily = createBudgetApi({
        currentFamilyId: null,
        setMonths: mockSetMonths,
        setRecurringExpenses: mockSetRecurringExpenses,
        setSubcategories: mockSetSubcategories,
      });

      const result = await apiNoFamily.insertMonth(2026, 1);

      expect(result).toBeNull();
      expect(storageAdapter.insertMonth).not.toHaveBeenCalled();
    });
  });

  describe('insertExpense', () => {
    it('should insert expense via storageAdapter', async () => {
      const mockResult = { id: 'exp-1' };
      (storageAdapter.insertExpense as Mock).mockResolvedValue(mockResult);

      const payload = {
        month_id: 'month-1',
        title: 'Groceries',
        category_key: 'essenciais' as const,
        value: 100,
      };

      const result = await api.insertExpense(payload);

      expect(storageAdapter.insertExpense).toHaveBeenCalledWith(mockFamilyId, payload);
      expect(result).toEqual(mockResult);
    });

    it('should return null if familyId is null', async () => {
      const apiNoFamily = createBudgetApi({
        currentFamilyId: null,
        setMonths: mockSetMonths,
        setRecurringExpenses: mockSetRecurringExpenses,
        setSubcategories: mockSetSubcategories,
      });

      const result = await apiNoFamily.insertExpense({
        month_id: 'month-1',
        title: 'Test',
        category_key: 'essenciais',
        value: 50,
      });

      expect(result).toBeNull();
    });
  });

  describe('updateMonthIncome', () => {
    it('should update month income via storageAdapter', async () => {
      (storageAdapter.updateMonthIncome as Mock).mockResolvedValue({});

      await api.updateMonthIncome('month-1', 5000);

      expect(storageAdapter.updateMonthIncome).toHaveBeenCalledWith(mockFamilyId, 'month-1', 5000);
    });
  });

  describe('updateExpense', () => {
    it('should update expense via storageAdapter', async () => {
      (storageAdapter.updateExpense as Mock).mockResolvedValue({});

      await api.updateExpense('exp-1', { title: 'Updated', value: 200 });

      expect(storageAdapter.updateExpense).toHaveBeenCalledWith(mockFamilyId, 'exp-1', { title: 'Updated', value: 200 });
    });
  });

  describe('setExpensePending', () => {
    it('should set expense pending status via storageAdapter', async () => {
      (storageAdapter.setExpensePending as Mock).mockResolvedValue({});

      await api.setExpensePending('exp-1', false);

      expect(storageAdapter.setExpensePending).toHaveBeenCalledWith(mockFamilyId, 'exp-1', false);
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense via storageAdapter', async () => {
      (storageAdapter.deleteExpense as Mock).mockResolvedValue({});

      await api.deleteExpense('exp-1');

      expect(storageAdapter.deleteExpense).toHaveBeenCalledWith(mockFamilyId, 'exp-1');
    });
  });

  describe('insertRecurring', () => {
    it('should insert recurring expense via storageAdapter', async () => {
      const mockResult = { id: 'rec-1' };
      (storageAdapter.insertRecurring as Mock).mockResolvedValue(mockResult);

      const payload = {
        title: 'Rent',
        category_key: 'essenciais' as const,
        value: 1000,
      };

      const result = await api.insertRecurring(payload);

      expect(storageAdapter.insertRecurring).toHaveBeenCalledWith(mockFamilyId, payload);
      expect(result).toEqual(mockResult);
    });

    it('should return null if familyId is null', async () => {
      const apiNoFamily = createBudgetApi({
        currentFamilyId: null,
        setMonths: mockSetMonths,
        setRecurringExpenses: mockSetRecurringExpenses,
        setSubcategories: mockSetSubcategories,
      });

      const result = await apiNoFamily.insertRecurring({
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
      });

      expect(result).toBeNull();
    });
  });

  describe('updateRecurring', () => {
    it('should update recurring expense via storageAdapter', async () => {
      (storageAdapter.updateRecurring as Mock).mockResolvedValue({});

      await api.updateRecurring('rec-1', { title: 'Updated Rent', value: 1200 }, true);

      expect(storageAdapter.updateRecurring).toHaveBeenCalledWith(
        mockFamilyId,
        'rec-1',
        { title: 'Updated Rent', value: 1200 },
        true
      );
    });
  });

  describe('deleteRecurring', () => {
    it('should delete recurring expense via storageAdapter', async () => {
      (storageAdapter.deleteRecurring as Mock).mockResolvedValue({});

      await api.deleteRecurring('rec-1');

      expect(storageAdapter.deleteRecurring).toHaveBeenCalledWith(mockFamilyId, 'rec-1');
    });
  });

  describe('applyRecurringToMonth', () => {
    it('should apply recurring to month via storageAdapter', async () => {
      (storageAdapter.applyRecurringToMonth as Mock).mockResolvedValue(true);

      const recurring = {
        id: 'rec-1',
        title: 'Rent',
        category: 'essenciais' as const,
        value: 1000,
        isRecurring: true,
      };

      const result = await api.applyRecurringToMonth(recurring, 'month-1');

      expect(storageAdapter.applyRecurringToMonth).toHaveBeenCalledWith(mockFamilyId, recurring, 'month-1');
      expect(result).toBe(true);
    });

    it('should return false if familyId is null', async () => {
      const apiNoFamily = createBudgetApi({
        currentFamilyId: null,
        setMonths: mockSetMonths,
        setRecurringExpenses: mockSetRecurringExpenses,
        setSubcategories: mockSetSubcategories,
      });

      const result = await apiNoFamily.applyRecurringToMonth(
        { id: 'rec-1', title: 'Test', category: 'essenciais', value: 100, isRecurring: true },
        'month-1'
      );

      expect(result).toBe(false);
    });
  });

  describe('income source operations', () => {
    it('should insert income source via storageAdapter', async () => {
      (storageAdapter.insertIncomeSource as Mock).mockResolvedValue({});

      await api.insertIncomeSource('month-1', 'Salary', 5000);

      expect(storageAdapter.insertIncomeSource).toHaveBeenCalledWith(mockFamilyId, 'month-1', 'Salary', 5000);
    });

    it('should update income source via storageAdapter', async () => {
      (storageAdapter.updateIncomeSource as Mock).mockResolvedValue({});

      await api.updateIncomeSource('income-1', 'Bonus', 1000);

      expect(storageAdapter.updateIncomeSource).toHaveBeenCalledWith(mockFamilyId, 'income-1', 'Bonus', 1000);
    });

    it('should delete income source via storageAdapter', async () => {
      (storageAdapter.deleteIncomeSource as Mock).mockResolvedValue({});

      await api.deleteIncomeSource('income-1');

      expect(storageAdapter.deleteIncomeSource).toHaveBeenCalledWith(mockFamilyId, 'income-1');
    });
  });
});
