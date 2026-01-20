import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Goal, GoalStatus } from '@/types';
import type { GoalRow, GoalEntryRow, SubcategoryRow } from '@/types/database';

// Mock dependencies
vi.mock('@/lib/adapters/offlineAdapter', () => ({
  offlineAdapter: {
    isOfflineId: vi.fn((id: string) => id?.startsWith('offline-')),
    getAll: vi.fn(() => Promise.resolve([])),
    getAllByIndex: vi.fn(() => Promise.resolve([])),
    get: vi.fn(() => Promise.resolve(null)),
  },
}));

vi.mock('@/lib/services/goalService', () => ({
  getEntriesByGoalIds: vi.fn(() => Promise.resolve({ data: [], error: null })),
  getGoalBySubcategoryId: vi.fn(() => Promise.resolve({ data: null, error: null })),
  getGoalByCategoryKey: vi.fn(() => Promise.resolve({ data: null, error: null })),
}));

vi.mock('@/lib/services/budgetService', () => ({
  getSubcategories: vi.fn(() => Promise.resolve({ data: [], error: null })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import mocked modules
import { offlineAdapter } from '@/lib/adapters/offlineAdapter';
import * as goalService from '@/lib/services/goalService';
import * as budgetService from '@/lib/services/budgetService';

// Import after mocks
import { addCurrentValueToGoals, toGoalRow, toGoalEntryRow, ensureSubcategoryIsValid, getGoalBySubcategoryIdInternal, getGoalByCategoryKeyInternal } from './utils';

describe('goal/utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.onLine to true by default
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  describe('addCurrentValueToGoals', () => {
    const createMockGoal = (id: string, name: string): Goal => ({
      id,
      name,
      targetValue: 1000,
      currentValue: 0,
      status: 'active' as GoalStatus,
      familyId: 'family-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    it('should return empty array for empty goals', async () => {
      const result = await addCurrentValueToGoals('family-123', []);
      expect(result).toEqual([]);
    });

    it('should aggregate currentValue from entries (online)', async () => {
      const goals = [createMockGoal('goal-1', 'Goal 1')];
      
      vi.mocked(goalService.getEntriesByGoalIds).mockResolvedValue({
        data: [
          { id: 'entry-1', goal_id: 'goal-1', value: 100, month: 1, year: 2026 },
          { id: 'entry-2', goal_id: 'goal-1', value: 250, month: 2, year: 2026 },
        ] as GoalEntryRow[],
        error: null,
      });

      const result = await addCurrentValueToGoals('family-123', goals);
      
      expect(result[0].currentValue).toBe(350);
    });

    it('should handle multiple goals with different values', async () => {
      const goals = [
        createMockGoal('goal-1', 'Goal 1'),
        createMockGoal('goal-2', 'Goal 2'),
      ];
      
      vi.mocked(goalService.getEntriesByGoalIds).mockResolvedValue({
        data: [
          { id: 'entry-1', goal_id: 'goal-1', value: 100, month: 1, year: 2026 },
          { id: 'entry-2', goal_id: 'goal-2', value: 500, month: 1, year: 2026 },
          { id: 'entry-3', goal_id: 'goal-2', value: 200, month: 2, year: 2026 },
        ] as GoalEntryRow[],
        error: null,
      });

      const result = await addCurrentValueToGoals('family-123', goals);
      
      expect(result[0].currentValue).toBe(100);
      expect(result[1].currentValue).toBe(700);
    });

    it('should return 0 for goals without entries', async () => {
      const goals = [createMockGoal('goal-1', 'Goal 1')];
      
      vi.mocked(goalService.getEntriesByGoalIds).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await addCurrentValueToGoals('family-123', goals);
      
      expect(result[0].currentValue).toBe(0);
    });

    it('should handle query error gracefully', async () => {
      const goals = [createMockGoal('goal-1', 'Goal 1')];
      goals[0].currentValue = 50; // Pre-existing value
      
      vi.mocked(goalService.getEntriesByGoalIds).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const result = await addCurrentValueToGoals('family-123', goals);
      
      // Should keep existing value
      expect(result[0].currentValue).toBe(50);
    });

    it('should use offline storage for offline families', async () => {
      const goals = [createMockGoal('goal-1', 'Goal 1')];
      
      vi.mocked(offlineAdapter.getAll).mockResolvedValue([
        { id: 'entry-1', goal_id: 'goal-1', value: 150, month: 1, year: 2026 } as GoalEntryRow,
      ]);

      const result = await addCurrentValueToGoals('offline-family-123', goals);
      
      expect(result[0].currentValue).toBe(150);
      expect(offlineAdapter.getAll).toHaveBeenCalledWith('goal_entries');
    });

    it('should use offline storage when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      const goals = [createMockGoal('goal-1', 'Goal 1')];
      
      vi.mocked(offlineAdapter.getAll).mockResolvedValue([
        { id: 'entry-1', goal_id: 'goal-1', value: 200, month: 1, year: 2026 } as GoalEntryRow,
      ]);

      const result = await addCurrentValueToGoals('family-123', goals);
      
      expect(result[0].currentValue).toBe(200);
    });

    it('should handle entries with null/undefined values', async () => {
      const goals = [createMockGoal('goal-1', 'Goal 1')];
      
      vi.mocked(goalService.getEntriesByGoalIds).mockResolvedValue({
        data: [
          { id: 'entry-1', goal_id: 'goal-1', value: 100, month: 1, year: 2026 },
          { id: 'entry-2', goal_id: 'goal-1', value: null as unknown as number, month: 2, year: 2026 },
          { id: 'entry-3', goal_id: 'goal-1', value: undefined as unknown as number, month: 3, year: 2026 },
        ] as GoalEntryRow[],
        error: null,
      });

      const result = await addCurrentValueToGoals('family-123', goals);
      
      // Should handle null/undefined gracefully (treat as 0)
      expect(result[0].currentValue).toBe(100);
    });
  });

  describe('toGoalRow', () => {
    it('should convert payload to row format', () => {
      const payload = {
        name: 'Test Goal',
        targetValue: 5000,
        targetMonth: 12,
        targetYear: 2026,
        account: 'savings',
        status: 'active' as GoalStatus,
      };

      const result = toGoalRow('family-123', payload);

      expect(result.family_id).toBe('family-123');
      expect(result.name).toBe('Test Goal');
      expect(result.target_value).toBe(5000);
      expect(result.target_month).toBe(12);
      expect(result.target_year).toBe(2026);
      expect(result.account).toBe('savings');
      expect(result.status).toBe('active');
    });

    it('should handle optional fields', () => {
      const payload = {
        name: 'Minimal Goal',
        targetValue: 1000,
      };

      const result = toGoalRow('family-123', payload);

      expect(result.name).toBe('Minimal Goal');
      expect(result.target_value).toBe(1000);
      expect(result.target_month).toBeNull();
      expect(result.target_year).toBeNull();
      expect(result.account).toBeNull();
      expect(result.status).toBe('active'); // Default
    });

    it('should include linked subcategory when provided', () => {
      const payload = {
        name: 'Linked Goal',
        targetValue: 2000,
        linkedSubcategoryId: 'subcat-123',
      };

      const result = toGoalRow('family-123', payload);

      expect(result.linked_subcategory_id).toBe('subcat-123');
    });

    it('should include linked category key when provided', () => {
      const payload = {
        name: 'Category Goal',
        targetValue: 10000,
        linkedCategoryKey: 'liberdade',
      };

      const result = toGoalRow('family-123', payload);

      expect(result.linked_category_key).toBe('liberdade');
    });

    it('should accept empty name (schema allows it)', () => {
      const payload = {
        name: '',
        targetValue: 1000,
      };

      // Schema allows empty string for name
      const result = toGoalRow('family-123', payload);
      expect(result.name).toBe('');
    });

    it('should throw for invalid payload (negative target)', () => {
      const payload = {
        name: 'Invalid Goal',
        targetValue: -100,
      };

      expect(() => toGoalRow('family-123', payload)).toThrow();
    });

    it('should accept zero target value (schema allows it)', () => {
      const payload = {
        name: 'Zero Goal',
        targetValue: 0,
      };

      // Schema allows 0 for target_value
      const result = toGoalRow('family-123', payload);
      expect(result.target_value).toBe(0);
    });
  });

  describe('toGoalEntryRow', () => {
    it('should convert entry payload to row format', () => {
      const payload = {
        goalId: 'goal-123',
        value: 500,
        month: 1,
        year: 2026,
        description: 'Monthly contribution',
      };

      const result = toGoalEntryRow(payload);

      expect(result.goal_id).toBe('goal-123');
      expect(result.value).toBe(500);
      expect(result.month).toBe(1);
      expect(result.year).toBe(2026);
      expect(result.description).toBe('Monthly contribution');
      expect(result.expense_id).toBeNull();
    });

    it('should handle expense-linked entry', () => {
      const payload = {
        goalId: 'goal-123',
        expenseId: 'expense-456',
        value: 200,
        month: 3,
        year: 2026,
      };

      const result = toGoalEntryRow(payload);

      expect(result.expense_id).toBe('expense-456');
    });

    it('should require description for manual entries', () => {
      const payload = {
        goalId: 'goal-123',
        value: 100,
        month: 6,
        year: 2026,
        // No description - should throw for manual entry
      };

      // CreateManualGoalEntryInputSchema requires description to be a string
      expect(() => toGoalEntryRow(payload)).toThrow();
    });

    it('should accept description for manual entries', () => {
      const payload = {
        goalId: 'goal-123',
        value: 100,
        month: 6,
        year: 2026,
        description: 'Test contribution',
      };

      const result = toGoalEntryRow(payload);

      expect(result.description).toBe('Test contribution');
    });
  });

  describe('getGoalBySubcategoryIdInternal', () => {
    it('should return null when no goal found', async () => {
      vi.mocked(offlineAdapter.getAllByIndex).mockResolvedValue([]);
      vi.mocked(goalService.getGoalBySubcategoryId).mockResolvedValue({ data: null, error: null });

      const result = await getGoalBySubcategoryIdInternal('subcat-123');

      expect(result).toBeNull();
    });

    it('should return offline goal when found', async () => {
      const mockGoalRow: GoalRow = {
        id: 'goal-123',
        family_id: 'family-123',
        name: 'Offline Goal',
        target_value: 1000,
        status: 'active',
        linked_subcategory_id: 'subcat-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(offlineAdapter.getAllByIndex).mockResolvedValue([mockGoalRow]);

      const result = await getGoalBySubcategoryIdInternal('subcat-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('goal-123');
    });

    it('should skip inactive goals in offline mode', async () => {
      const mockGoalRow: GoalRow = {
        id: 'goal-123',
        family_id: 'family-123',
        name: 'Inactive Goal',
        target_value: 1000,
        status: 'completed',
        linked_subcategory_id: 'subcat-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(offlineAdapter.getAllByIndex).mockResolvedValue([mockGoalRow]);
      vi.mocked(goalService.getGoalBySubcategoryId).mockResolvedValue({ data: null, error: null });

      const result = await getGoalBySubcategoryIdInternal('subcat-123');

      expect(result).toBeNull();
    });
  });

  describe('getGoalByCategoryKeyInternal', () => {
    it('should return null when no goal found', async () => {
      vi.mocked(offlineAdapter.getAll).mockResolvedValue([]);
      vi.mocked(goalService.getGoalByCategoryKey).mockResolvedValue({ data: null, error: null });

      const result = await getGoalByCategoryKeyInternal('liberdade');

      expect(result).toBeNull();
    });

    it('should return offline goal matching category key', async () => {
      const mockGoalRow: GoalRow = {
        id: 'goal-456',
        family_id: 'family-123',
        name: 'Freedom Goal',
        target_value: 50000,
        status: 'active',
        linked_category_key: 'liberdade',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(offlineAdapter.getAll).mockResolvedValue([mockGoalRow]);

      const result = await getGoalByCategoryKeyInternal('liberdade');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('goal-456');
    });
  });

  describe('ensureSubcategoryIsValid', () => {
    it('should not throw for goal without subcategory or category', async () => {
      await expect(ensureSubcategoryIsValid('family-123', undefined, undefined, 'active')).resolves.not.toThrow();
    });

    it('should throw when subcategory not found (offline)', async () => {
      vi.mocked(offlineAdapter.get).mockResolvedValue(null);

      await expect(
        ensureSubcategoryIsValid('offline-family-123', 'subcat-999', undefined, 'active')
      ).rejects.toThrow('Subcategory not found');
    });

    it('should allow linking to subcategory when no active goal exists', async () => {
      vi.mocked(offlineAdapter.get).mockResolvedValue({ id: 'subcat-123', name: 'Test' } as SubcategoryRow);
      vi.mocked(offlineAdapter.getAllByIndex).mockResolvedValue([]);

      await expect(
        ensureSubcategoryIsValid('offline-family-123', 'subcat-123', undefined, 'active')
      ).resolves.not.toThrow();
    });

    it('should throw when subcategory already linked to active goal (offline)', async () => {
      vi.mocked(offlineAdapter.get).mockResolvedValue({ id: 'subcat-123', name: 'Test' } as SubcategoryRow);
      vi.mocked(offlineAdapter.getAllByIndex).mockResolvedValue([
        {
          id: 'goal-existing',
          family_id: 'offline-family-123',
          name: 'Existing Goal',
          target_value: 1000,
          status: 'active',
          linked_subcategory_id: 'subcat-123',
        } as GoalRow,
      ]);

      await expect(
        ensureSubcategoryIsValid('offline-family-123', 'subcat-123', undefined, 'active')
      ).rejects.toThrow('já está vinculada a uma meta ativa');
    });

    it('should allow updating same goal without conflict', async () => {
      vi.mocked(offlineAdapter.get).mockResolvedValue({ id: 'subcat-123', name: 'Test' } as SubcategoryRow);
      vi.mocked(offlineAdapter.getAllByIndex).mockResolvedValue([
        {
          id: 'goal-123', // Same as currentGoalId
          family_id: 'offline-family-123',
          name: 'My Goal',
          target_value: 1000,
          status: 'active',
          linked_subcategory_id: 'subcat-123',
        } as GoalRow,
      ]);

      await expect(
        ensureSubcategoryIsValid('offline-family-123', 'subcat-123', undefined, 'active', 'goal-123')
      ).resolves.not.toThrow();
    });

    it('should throw when liberdade category already has active goal (offline)', async () => {
      vi.mocked(offlineAdapter.getAll).mockResolvedValue([
        {
          id: 'goal-existing',
          family_id: 'offline-family-123',
          name: 'Existing Freedom Goal',
          target_value: 50000,
          status: 'active',
          linked_category_key: 'liberdade',
        } as GoalRow,
      ]);

      await expect(
        ensureSubcategoryIsValid('offline-family-123', undefined, 'liberdade', 'active')
      ).rejects.toThrow('Já existe uma meta ativa vinculada à categoria Liberdade Financeira');
    });

    it('should allow inactive goal with same subcategory', async () => {
      vi.mocked(offlineAdapter.get).mockResolvedValue({ id: 'subcat-123', name: 'Test' } as SubcategoryRow);
      vi.mocked(offlineAdapter.getAllByIndex).mockResolvedValue([
        {
          id: 'goal-existing',
          family_id: 'offline-family-123',
          name: 'Completed Goal',
          target_value: 1000,
          status: 'completed', // Inactive
          linked_subcategory_id: 'subcat-123',
        } as GoalRow,
      ]);

      await expect(
        ensureSubcategoryIsValid('offline-family-123', 'subcat-123', undefined, 'active')
      ).resolves.not.toThrow();
    });

    it('should validate online subcategory (online mode)', async () => {
      vi.mocked(budgetService.getSubcategories).mockResolvedValue({
        data: [{ id: 'subcat-123', name: 'Test', family_id: 'family-123' } as SubcategoryRow],
        error: null,
      });
      vi.mocked(goalService.getGoalBySubcategoryId).mockResolvedValue({ data: null, error: null });
      vi.mocked(offlineAdapter.getAllByIndex).mockResolvedValue([]);

      await expect(
        ensureSubcategoryIsValid('family-123', 'subcat-123', undefined, 'active')
      ).resolves.not.toThrow();
    });

    it('should throw when subcategory not found online', async () => {
      vi.mocked(offlineAdapter.getAllByIndex).mockResolvedValue([]);
      vi.mocked(budgetService.getSubcategories).mockResolvedValue({
        data: [],
        error: null,
      });

      await expect(
        ensureSubcategoryIsValid('family-123', 'subcat-999', undefined, 'active')
      ).rejects.toThrow('Subcategory not found');
    });
  });

  describe('edge cases', () => {
    describe('addCurrentValueToGoals edge cases', () => {
      const createMockGoal = (id: string): Goal => ({
        id,
        name: 'Test',
        targetValue: 1000,
        currentValue: 0,
        status: 'active' as GoalStatus,
        familyId: 'family-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      it('should handle very large entry values', async () => {
        const goals = [createMockGoal('goal-1')];
        
        vi.mocked(goalService.getEntriesByGoalIds).mockResolvedValue({
          data: [
            { id: 'entry-1', goal_id: 'goal-1', value: 999999999.99, month: 1, year: 2026 },
          ] as GoalEntryRow[],
          error: null,
        });

        const result = await addCurrentValueToGoals('family-123', goals);
        
        expect(result[0].currentValue).toBe(999999999.99);
      });

      it('should handle entries with decimal precision', async () => {
        const goals = [createMockGoal('goal-1')];
        
        vi.mocked(goalService.getEntriesByGoalIds).mockResolvedValue({
          data: [
            { id: 'entry-1', goal_id: 'goal-1', value: 0.01, month: 1, year: 2026 },
            { id: 'entry-2', goal_id: 'goal-1', value: 0.02, month: 2, year: 2026 },
            { id: 'entry-3', goal_id: 'goal-1', value: 0.03, month: 3, year: 2026 },
          ] as GoalEntryRow[],
          error: null,
        });

        const result = await addCurrentValueToGoals('family-123', goals);
        
        // Note: JS floating point precision
        expect(result[0].currentValue).toBeCloseTo(0.06, 10);
      });

      it('should ignore entries for goals not in the list', async () => {
        const goals = [createMockGoal('goal-1')];
        
        vi.mocked(goalService.getEntriesByGoalIds).mockResolvedValue({
          data: [
            { id: 'entry-1', goal_id: 'goal-1', value: 100, month: 1, year: 2026 },
            { id: 'entry-2', goal_id: 'goal-other', value: 500, month: 1, year: 2026 },
          ] as GoalEntryRow[],
          error: null,
        });

        const result = await addCurrentValueToGoals('family-123', goals);
        
        expect(result[0].currentValue).toBe(100);
      });
    });
  });
});
