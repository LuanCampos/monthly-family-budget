import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as budgetService from './budgetService';

// Mock the supabase client
vi.mock('../supabase', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom,
      channel: vi.fn(),
      removeChannel: vi.fn()
    }
  };
});

import { supabase } from '../supabase';

// Helper to create chainable mock
const createChainMock = (result: unknown = { data: [], error: null }) => {
  const chain: Record<string, Mock> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.upsert = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  // For non-single queries, return the result directly
  chain.then = vi.fn((resolve) => resolve(result));
  // Make the chain thenable
  Object.defineProperty(chain, 'then', {
    value: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
    writable: true
  });
  return chain;
};

describe('budgetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMonths', () => {
    it('should query months with correct filters and ordering', async () => {
      const mockChain = createChainMock({ data: [{ id: 'month-1' }], error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.getMonths('family-123');

      expect(supabase.from).toHaveBeenCalledWith('month');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('family_id', 'family-123');
      expect(mockChain.order).toHaveBeenCalledWith('year', { ascending: true });
      expect(mockChain.order).toHaveBeenCalledWith('month', { ascending: true });
    });
  });

  describe('getMonthById', () => {
    it('should query single month by id', async () => {
      const mockChain = createChainMock({ data: { id: 'month-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.getMonthById('month-1');

      expect(supabase.from).toHaveBeenCalledWith('month');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'month-1');
      expect(mockChain.maybeSingle).toHaveBeenCalled();
    });
  });

  describe('getExpensesByMonth', () => {
    it('should query expenses by month_id', async () => {
      const mockChain = createChainMock({ data: [], error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.getExpensesByMonth('month-1');

      expect(supabase.from).toHaveBeenCalledWith('expense');
      expect(mockChain.eq).toHaveBeenCalledWith('month_id', 'month-1');
    });
  });

  describe('getExpenseById', () => {
    it('should query expense by id', async () => {
      const mockChain = createChainMock({ data: { id: 'exp-1', title: 'Test' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.getExpenseById('exp-1');

      expect(supabase.from).toHaveBeenCalledWith('expense');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'exp-1');
      expect(mockChain.maybeSingle).toHaveBeenCalled();
    });
  });

  describe('getRecurringExpenses', () => {
    it('should query recurring expenses by family_id', async () => {
      const mockChain = createChainMock({ data: [], error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.getRecurringExpenses('family-123');

      expect(supabase.from).toHaveBeenCalledWith('recurring_expense');
      expect(mockChain.eq).toHaveBeenCalledWith('family_id', 'family-123');
    });
  });

  describe('getSubcategories', () => {
    it('should query subcategories by family_id', async () => {
      const mockChain = createChainMock({ data: [], error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.getSubcategories('family-123');

      expect(supabase.from).toHaveBeenCalledWith('subcategory');
      expect(mockChain.eq).toHaveBeenCalledWith('family_id', 'family-123');
    });
  });

  describe('insertSubcategory', () => {
    it('should insert valid subcategory', async () => {
      const mockChain = createChainMock({ data: { id: 'sub-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.insertSubcategory('family-123', 'Test Sub', 'essenciais');

      expect(supabase.from).toHaveBeenCalledWith('subcategory');
      expect(mockChain.insert).toHaveBeenCalledWith({
        family_id: 'family-123',
        name: 'Test Sub',
        category_key: 'essenciais'
      });
    });

    it('should return validation error for invalid input', async () => {
      const result = await budgetService.insertSubcategory('family-123', '', 'essenciais');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid input');
    });

    it('should return validation error for invalid category', async () => {
      const result = await budgetService.insertSubcategory('family-123', 'Test', 'invalid-category');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('updateSubcategoryById', () => {
    it('should update subcategory name', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.updateSubcategoryById('sub-1', 'New Name');

      expect(supabase.from).toHaveBeenCalledWith('subcategory');
      expect(mockChain.update).toHaveBeenCalledWith({ name: 'New Name' });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'sub-1');
    });
  });

  describe('deleteSubcategoryById', () => {
    it('should delete subcategory by id', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.deleteSubcategoryById('sub-1');

      expect(supabase.from).toHaveBeenCalledWith('subcategory');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'sub-1');
    });
  });

  describe('clearSubcategoryReferences', () => {
    it('should clear subcategory references in expenses', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.clearSubcategoryReferences('sub-1');

      expect(supabase.from).toHaveBeenCalledWith('expense');
      expect(mockChain.update).toHaveBeenCalledWith({ subcategory_id: null });
      expect(mockChain.eq).toHaveBeenCalledWith('subcategory_id', 'sub-1');
    });
  });

  describe('createChannel', () => {
    it('should create a supabase channel', () => {
      (supabase.channel as Mock).mockReturnValue({ on: vi.fn() });

      budgetService.createChannel('test-channel');

      expect(supabase.channel).toHaveBeenCalledWith('test-channel');
    });
  });

  describe('removeChannel', () => {
    it('should remove a supabase channel', () => {
      const mockChannel = { on: vi.fn() };

      budgetService.removeChannel(mockChannel as never);

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('insertMonth', () => {
    it('should insert valid month', async () => {
      const mockChain = createChainMock({ data: { id: 'month-1', year: 2024, month: 1 }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.insertMonth('family-123', 2024, 1);

      expect(supabase.from).toHaveBeenCalledWith('month');
      expect(mockChain.insert).toHaveBeenCalledWith({
        family_id: 'family-123',
        year: 2024,
        month: 1,
        income: 0
      });
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should return validation error for invalid month', async () => {
      const result = await budgetService.insertMonth('family-123', 2024, 13);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid input');
    });

    it('should return validation error for invalid year', async () => {
      const result = await budgetService.insertMonth('family-123', 1899, 6);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('getMonthLimits', () => {
    it('should query category limits by month_id', async () => {
      const mockChain = createChainMock({ data: [], error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.getMonthLimits('month-1');

      expect(supabase.from).toHaveBeenCalledWith('category_limit');
      expect(mockChain.eq).toHaveBeenCalledWith('month_id', 'month-1');
    });
  });

  describe('insertMonthLimit', () => {
    it('should insert category limit', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);
      const payload = { month_id: 'month-1', category_key: 'housing', percentage: 30 };

      await budgetService.insertMonthLimit(payload);

      expect(supabase.from).toHaveBeenCalledWith('category_limit');
      expect(mockChain.insert).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateMonthLimit', () => {
    it('should upsert category limit', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.updateMonthLimit('month-1', 'housing', 35);

      expect(supabase.from).toHaveBeenCalledWith('category_limit');
      expect(mockChain.upsert).toHaveBeenCalledWith(
        { month_id: 'month-1', category_key: 'housing', percentage: 35 },
        { onConflict: 'month_id,category_key' }
      );
    });
  });

  describe('copyLimitsToMonth', () => {
    it('should copy limits from source to target month', async () => {
      const sourceLimits = [
        { month_id: 'source', category_key: 'housing', percentage: 30 },
        { month_id: 'source', category_key: 'food', percentage: 25 }
      ];
      const selectChain = createChainMock({ data: sourceLimits, error: null });
      const insertChain = createChainMock();
      
      (supabase.from as Mock)
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(insertChain);

      await budgetService.copyLimitsToMonth('source', 'target');

      expect(supabase.from).toHaveBeenCalledWith('category_limit');
      expect(insertChain.insert).toHaveBeenCalledWith([
        { month_id: 'target', category_key: 'housing', percentage: 30 },
        { month_id: 'target', category_key: 'food', percentage: 25 }
      ]);
    });

    it('should not insert when source has no limits', async () => {
      const selectChain = createChainMock({ data: [], error: null });
      (supabase.from as Mock).mockReturnValue(selectChain);

      await budgetService.copyLimitsToMonth('source', 'target');

      // Should only call from once (for select), not for insert
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });
  });

  describe('insertExpense', () => {
    it('should insert valid expense', async () => {
      const mockChain = createChainMock({ data: { id: 'exp-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);
      const expense = {
        month_id: 'month-1',
        title: 'Groceries',
        category_key: 'essenciais',
        value: 100
      };

      await budgetService.insertExpense(expense);

      expect(supabase.from).toHaveBeenCalledWith('expense');
      expect(mockChain.insert).toHaveBeenCalledWith(expense);
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should return validation error for missing required fields', async () => {
      const result = await budgetService.insertExpense({ month_id: 'month-1' });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('updateExpenseById', () => {
    it('should update expense by id', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.updateExpenseById('exp-1', { value: 150 });

      expect(supabase.from).toHaveBeenCalledWith('expense');
      expect(mockChain.update).toHaveBeenCalledWith({ value: 150 });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'exp-1');
    });
  });

  describe('deleteExpenseById', () => {
    it('should delete expense by id', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.deleteExpenseById('exp-1');

      expect(supabase.from).toHaveBeenCalledWith('expense');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'exp-1');
    });
  });

  describe('deleteExpensesByMonth', () => {
    it('should delete all expenses for a month', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.deleteExpensesByMonth('month-1');

      expect(supabase.from).toHaveBeenCalledWith('expense');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('month_id', 'month-1');
    });
  });

  describe('deleteMonthById', () => {
    it('should delete month by id', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.deleteMonthById('month-1');

      expect(supabase.from).toHaveBeenCalledWith('month');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'month-1');
    });
  });

  describe('clearRecurringSubcategoryReferences', () => {
    it('should clear subcategory references in recurring expenses', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.clearRecurringSubcategoryReferences('sub-1');

      expect(supabase.from).toHaveBeenCalledWith('recurring_expense');
      expect(mockChain.update).toHaveBeenCalledWith({ subcategory_id: null });
      expect(mockChain.eq).toHaveBeenCalledWith('subcategory_id', 'sub-1');
    });
  });

  describe('updateMonthIncome', () => {
    it('should update month income', async () => {
      const mockChain = createChainMock({ data: { id: 'month-1', income: 5000 }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.updateMonthIncome('month-1', 5000);

      expect(supabase.from).toHaveBeenCalledWith('month');
      expect(mockChain.update).toHaveBeenCalledWith({ income: 5000 });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'month-1');
      expect(mockChain.single).toHaveBeenCalled();
    });
  });

  describe('updateExpense', () => {
    it('should update expense and return updated data', async () => {
      const mockChain = createChainMock({ data: { id: 'exp-1', value: 200 }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.updateExpense('exp-1', { value: 200 });

      expect(supabase.from).toHaveBeenCalledWith('expense');
      expect(mockChain.update).toHaveBeenCalledWith({ value: 200 });
      expect(mockChain.single).toHaveBeenCalled();
    });
  });

  describe('setExpensePending', () => {
    it('should set expense pending status', async () => {
      const mockChain = createChainMock({ data: { id: 'exp-1', is_pending: false }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.setExpensePending('exp-1', false);

      expect(supabase.from).toHaveBeenCalledWith('expense');
      expect(mockChain.update).toHaveBeenCalledWith({ is_pending: false });
      expect(mockChain.single).toHaveBeenCalled();
    });
  });

  describe('insertRecurring', () => {
    it('should insert valid recurring expense', async () => {
      const mockChain = createChainMock({ data: { id: 'rec-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);
      const payload = {
        title: 'Netflix',
        category_key: 'prazeres',
        value: 50,
        due_day: 15,
        is_active: true,
        start_date: '2024-01-01'
      };

      await budgetService.insertRecurring('family-123', payload);

      expect(supabase.from).toHaveBeenCalledWith('recurring_expense');
      expect(mockChain.insert).toHaveBeenCalledWith({
        family_id: 'family-123',
        ...payload
      });
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should return validation error for invalid input', async () => {
      const result = await budgetService.insertRecurring('family-123', { title: '' });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('updateRecurring', () => {
    it('should update recurring expense', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.updateRecurring('rec-1', { value: 60 });

      expect(supabase.from).toHaveBeenCalledWith('recurring_expense');
      expect(mockChain.update).toHaveBeenCalledWith({ value: 60 });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'rec-1');
    });
  });

  describe('deleteRecurring', () => {
    it('should delete recurring expense', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.deleteRecurring('rec-1');

      expect(supabase.from).toHaveBeenCalledWith('recurring_expense');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'rec-1');
    });
  });

  describe('updateExpensesByRecurringId', () => {
    it('should update all expenses with recurring id', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.updateExpensesByRecurringId('rec-1', { title: 'Updated' });

      expect(supabase.from).toHaveBeenCalledWith('expense');
      expect(mockChain.update).toHaveBeenCalledWith({ title: 'Updated' });
      expect(mockChain.eq).toHaveBeenCalledWith('recurring_expense_id', 'rec-1');
    });
  });

  describe('getIncomeSourcesByMonth', () => {
    it('should query income sources by month_id with ordering', async () => {
      const mockChain = createChainMock({ data: [], error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.getIncomeSourcesByMonth('month-1');

      expect(supabase.from).toHaveBeenCalledWith('income_source');
      expect(mockChain.eq).toHaveBeenCalledWith('month_id', 'month-1');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });
  });

  describe('insertIncomeSource', () => {
    it('should insert valid income source', async () => {
      const mockChain = createChainMock({ data: { id: 'src-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.insertIncomeSource('month-1', 'Salary', 5000);

      expect(supabase.from).toHaveBeenCalledWith('income_source');
      expect(mockChain.insert).toHaveBeenCalledWith({
        month_id: 'month-1',
        name: 'Salary',
        value: 5000
      });
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should return validation error for empty name', async () => {
      const result = await budgetService.insertIncomeSource('month-1', '', 5000);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should return validation error for negative value', async () => {
      const result = await budgetService.insertIncomeSource('month-1', 'Test', -100);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('updateIncomeSourceById', () => {
    it('should update income source', async () => {
      const mockChain = createChainMock({ data: { id: 'src-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.updateIncomeSourceById('src-1', 'New Name', 6000);

      expect(supabase.from).toHaveBeenCalledWith('income_source');
      expect(mockChain.update).toHaveBeenCalledWith({ name: 'New Name', value: 6000 });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'src-1');
      expect(mockChain.single).toHaveBeenCalled();
    });
  });

  describe('deleteIncomeSourceById', () => {
    it('should delete income source', async () => {
      const mockChain = createChainMock();
      (supabase.from as Mock).mockReturnValue(mockChain);

      await budgetService.deleteIncomeSourceById('src-1');

      expect(supabase.from).toHaveBeenCalledWith('income_source');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'src-1');
    });
  });
});
