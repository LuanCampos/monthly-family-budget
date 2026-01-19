import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as goalService from './goalService';

// Mock the supabase client
vi.mock('../supabase', () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc
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
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  // Make the chain thenable
  Object.defineProperty(chain, 'then', {
    value: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
    writable: true
  });
  return chain;
};

describe('goalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGoals', () => {
    it('should query goals with correct filters and ordering', async () => {
      const mockChain = createChainMock({ data: [{ id: 'goal-1' }], error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.getGoals('family-123');

      expect(supabase.from).toHaveBeenCalledWith('goal');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('family_id', 'family-123');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });
  });

  describe('getGoalById', () => {
    it('should query single goal by id', async () => {
      const mockChain = createChainMock({ data: { id: 'goal-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.getGoalById('goal-1');

      expect(supabase.from).toHaveBeenCalledWith('goal');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'goal-1');
      expect(mockChain.maybeSingle).toHaveBeenCalled();
    });
  });

  describe('getGoalBySubcategoryId', () => {
    it('should query active goal by subcategory id', async () => {
      const mockChain = createChainMock({ data: { id: 'goal-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.getGoalBySubcategoryId('sub-1');

      expect(supabase.from).toHaveBeenCalledWith('goal');
      expect(mockChain.eq).toHaveBeenCalledWith('linked_subcategory_id', 'sub-1');
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockChain.maybeSingle).toHaveBeenCalled();
    });
  });

  describe('getGoalByCategoryKey', () => {
    it('should query active goal by category key', async () => {
      const mockChain = createChainMock({ data: { id: 'goal-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.getGoalByCategoryKey('metas');

      expect(supabase.from).toHaveBeenCalledWith('goal');
      expect(mockChain.eq).toHaveBeenCalledWith('linked_category_key', 'metas');
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockChain.maybeSingle).toHaveBeenCalled();
    });
  });

  describe('createGoal', () => {
    it('should insert valid goal', async () => {
      const mockChain = createChainMock({ data: { id: 'goal-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);
      const goalData = {
        family_id: 'family-123',
        name: 'Save for vacation',
        target_value: 5000,
        status: 'active' as const
      };

      await goalService.createGoal(goalData);

      expect(supabase.from).toHaveBeenCalledWith('goal');
      expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Save for vacation',
        target_value: 5000
      }));
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should return validation error for missing required fields', async () => {
      const result = await goalService.createGoal({ name: 'Incomplete' });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid input');
    });

    it('should return validation error for invalid target value', async () => {
      const result = await goalService.createGoal({
        family_id: 'family-123',
        name: 'Invalid Goal',
        target_value: -100,
        status: 'active' as const
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('updateGoal', () => {
    it('should update goal with valid data', async () => {
      const mockChain = createChainMock({ data: { id: 'goal-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.updateGoal('goal-1', { name: 'Updated Name' });

      expect(supabase.from).toHaveBeenCalledWith('goal');
      expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'goal-1');
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should accept empty object (partial update schema)', async () => {
      const mockChain = createChainMock({ data: { id: 'goal-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);
      
      // UpdateGoalInputSchema is partial, so empty object is valid
      const result = await goalService.updateGoal('goal-1', {});

      expect(supabase.from).toHaveBeenCalledWith('goal');
      expect(result.data).toBeDefined();
    });
  });

  describe('deleteGoal', () => {
    it('should delete goal by id', async () => {
      const mockChain = createChainMock({ data: null, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.deleteGoal('goal-123456789');

      expect(supabase.from).toHaveBeenCalledWith('goal');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'goal-123456789');
    });

    it('should return error for invalid id', async () => {
      const result = await goalService.deleteGoal('short');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid ID');
    });

    it('should return error for empty id', async () => {
      const result = await goalService.deleteGoal('');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('getEntries', () => {
    it('should query entries with correct ordering', async () => {
      const mockChain = createChainMock({ data: [], error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.getEntries('goal-1');

      expect(supabase.from).toHaveBeenCalledWith('goal_entry');
      expect(mockChain.eq).toHaveBeenCalledWith('goal_id', 'goal-1');
      expect(mockChain.order).toHaveBeenCalledWith('year', { ascending: false });
      expect(mockChain.order).toHaveBeenCalledWith('month', { ascending: false });
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('getEntryById', () => {
    it('should query single entry by id', async () => {
      const mockChain = createChainMock({ data: { id: 'entry-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.getEntryById('entry-1');

      expect(supabase.from).toHaveBeenCalledWith('goal_entry');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'entry-1');
      expect(mockChain.maybeSingle).toHaveBeenCalled();
    });
  });

  describe('getEntryByExpense', () => {
    it('should query entry by expense id', async () => {
      const mockChain = createChainMock({ data: { id: 'entry-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.getEntryByExpense('expense-1');

      expect(supabase.from).toHaveBeenCalledWith('goal_entry');
      expect(mockChain.eq).toHaveBeenCalledWith('expense_id', 'expense-1');
      expect(mockChain.maybeSingle).toHaveBeenCalled();
    });
  });

  describe('createEntry', () => {
    it('should insert valid entry', async () => {
      const mockChain = createChainMock({ data: { id: 'entry-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);
      const entryData = {
        goal_id: 'goal-1',
        value: 500,
        year: 2024,
        month: 3,
        expense_id: 'expense-1'
      };

      await goalService.createEntry(entryData);

      expect(supabase.from).toHaveBeenCalledWith('goal_entry');
      expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining({
        goal_id: 'goal-1',
        value: 500
      }));
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should return validation error for missing required fields', async () => {
      const result = await goalService.createEntry({ goal_id: 'goal-1' });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('createManualEntry', () => {
    it('should insert valid manual entry', async () => {
      const mockChain = createChainMock({ data: { id: 'entry-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);
      const entryData = {
        goal_id: 'goal-1',
        value: 500,
        description: 'Manual contribution',
        year: 2024,
        month: 3
      };

      await goalService.createManualEntry(entryData);

      expect(supabase.from).toHaveBeenCalledWith('goal_entry');
      expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining({
        goal_id: 'goal-1',
        value: 500
      }));
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should return validation error for missing required fields', async () => {
      const result = await goalService.createManualEntry({ value: 100 });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('updateEntry', () => {
    it('should update entry with valid data', async () => {
      const mockChain = createChainMock({ data: { id: 'entry-1' }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.updateEntry('entry-1', { value: 600 });

      expect(supabase.from).toHaveBeenCalledWith('goal_entry');
      expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({ value: 600 }));
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'entry-1');
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should accept negative values (for corrections/withdrawals)', async () => {
      // UpdateGoalEntryInputSchema allows negative values
      const mockChain = createChainMock({ data: { id: 'entry-1', value: -100 }, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      const result = await goalService.updateEntry('entry-1', { value: -100 });

      expect(supabase.from).toHaveBeenCalledWith('goal_entry');
      expect(result.data).toBeDefined();
    });
  });

  describe('deleteEntry', () => {
    it('should delete entry by id', async () => {
      const mockChain = createChainMock({ data: null, error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.deleteEntry('entry-12345678');

      expect(supabase.from).toHaveBeenCalledWith('goal_entry');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'entry-12345678');
    });

    it('should return error for invalid id', async () => {
      const result = await goalService.deleteEntry('short');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid ID');
    });
  });

  describe('getHistoricalExpenses', () => {
    it('should return empty array when no expenses found', async () => {
      const mockExpenseChain = createChainMock({ data: [], error: null });
      (supabase.from as Mock).mockReturnValue(mockExpenseChain);

      const result = await goalService.getHistoricalExpenses('sub-1');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should filter out already imported expenses', async () => {
      const expenses = [
        { id: 'exp-1', subcategory_id: 'sub-1', value: 100 },
        { id: 'exp-2', subcategory_id: 'sub-1', value: 200 },
        { id: 'exp-3', subcategory_id: 'sub-1', value: 300 }
      ];
      const entries = [{ expense_id: 'exp-2' }];

      const mockExpenseChain = createChainMock({ data: expenses, error: null });
      const mockEntryChain = createChainMock({ data: entries, error: null });

      (supabase.from as Mock)
        .mockReturnValueOnce(mockExpenseChain)
        .mockReturnValueOnce(mockEntryChain);

      const result = await goalService.getHistoricalExpenses('sub-1');

      expect(result.data).toHaveLength(2);
      expect(result.data?.map(e => e.id)).toEqual(['exp-1', 'exp-3']);
    });

    it('should return error when expenses query fails', async () => {
      const mockChain = createChainMock({ data: null, error: new Error('Query failed') });
      (supabase.from as Mock).mockReturnValue(mockChain);

      const result = await goalService.getHistoricalExpenses('sub-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('importExpenseAsEntry', () => {
    it('should call rpc function with correct parameters', async () => {
      (supabase.rpc as Mock).mockResolvedValue({ data: { id: 'entry-1' }, error: null });

      await goalService.importExpenseAsEntry('goal-1', 'expense-1');

      expect(supabase.rpc).toHaveBeenCalledWith('import_expense_as_goal_entry', {
        goal_id: 'goal-1',
        expense_id: 'expense-1'
      });
    });
  });

  describe('calculateMonthlySuggestion', () => {
    it('should call rpc function with correct parameters', async () => {
      (supabase.rpc as Mock).mockResolvedValue({ data: 250, error: null });

      await goalService.calculateMonthlySuggestion('goal-1');

      expect(supabase.rpc).toHaveBeenCalledWith('calculate_monthly_contribution_suggestion', {
        goal_id: 'goal-1'
      });
    });
  });

  describe('getEntriesByGoalIds', () => {
    it('should return empty array for empty goal ids', async () => {
      const result = await goalService.getEntriesByGoalIds([]);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should query entries for multiple goal ids', async () => {
      const mockChain = createChainMock({ data: [{ id: 'entry-1' }], error: null });
      (supabase.from as Mock).mockReturnValue(mockChain);

      await goalService.getEntriesByGoalIds(['goal-1', 'goal-2']);

      expect(supabase.from).toHaveBeenCalledWith('goal_entry');
      expect(mockChain.in).toHaveBeenCalledWith('goal_id', ['goal-1', 'goal-2']);
      expect(mockChain.order).toHaveBeenCalledWith('year', { ascending: false });
      expect(mockChain.order).toHaveBeenCalledWith('month', { ascending: false });
    });
  });
});
