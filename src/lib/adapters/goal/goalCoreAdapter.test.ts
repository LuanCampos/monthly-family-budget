import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalBySubcategoryId,
  getGoalByCategoryKey,
} from './goalCoreAdapter';
import * as goalService from '../../services/goalService';
import { offlineAdapter } from '../offlineAdapter';

import type { GoalRow, GoalEntryRow } from '@/types/database';
import type { GoalPayload } from './types';

// Mock dependencies
vi.mock('../../services/goalService');
vi.mock('../offlineAdapter');
vi.mock('../../logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock utils to avoid complex interactions
vi.mock('./utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('./utils')>();
  return {
    ...original,
    addCurrentValueToGoals: vi.fn((_familyId, goals) => 
      Promise.resolve(goals.map((g: { id: string }) => ({ ...g, currentValue: 100 })))
    ),
    ensureSubcategoryIsValid: vi.fn().mockResolvedValue(undefined),
  };
});

describe('goalCoreAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  const mockFamilyId = 'family-123';
  const mockOfflineFamilyId = 'offline-family-123';
  const mockGoalId = 'goal-123';

  const mockGoalRow: GoalRow = {
    id: mockGoalId,
    family_id: mockFamilyId,
    name: 'Emergency Fund',
    target_value: 10000,
    target_month: 12,
    target_year: 2025,
    account: 'savings',
    linked_subcategory_id: null,
    linked_category_key: null,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockGoalPayload: GoalPayload = {
    name: 'Emergency Fund',
    targetValue: 10000,
    targetMonth: 12,
    targetYear: 2025,
    account: 'savings',
  };

  describe('getGoals', () => {
    it('should return empty array when familyId is null', async () => {
      const result = await getGoals(null);
      expect(result).toEqual([]);
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should fetch goals from goalService when online', async () => {
        (goalService.getGoals as Mock).mockResolvedValue({ 
          data: [mockGoalRow], 
          error: null 
        });

        const result = await getGoals(mockFamilyId);

        expect(goalService.getGoals).toHaveBeenCalledWith(mockFamilyId);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: mockGoalId,
          name: 'Emergency Fund',
          targetValue: 10000,
          currentValue: 100, // enriched by mock
        });
      });

      it('should return empty array when goalService returns error', async () => {
        (goalService.getGoals as Mock).mockResolvedValue({ 
          data: null, 
          error: new Error('Network error') 
        });

        const result = await getGoals(mockFamilyId);

        expect(result).toEqual([]);
      });

      it('should return empty array when data is null', async () => {
        (goalService.getGoals as Mock).mockResolvedValue({ 
          data: null, 
          error: null 
        });

        const result = await getGoals(mockFamilyId);

        expect(result).toEqual([]);
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should fetch goals from IndexedDB when offline', async () => {
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([mockGoalRow]);

        const result = await getGoals(mockFamilyId);

        expect(offlineAdapter.getAllByIndex).toHaveBeenCalledWith('goals', 'family_id', mockFamilyId);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Emergency Fund');
      });

      it('should handle offline ID familyId', async () => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([mockGoalRow]);

        const result = await getGoals(mockOfflineFamilyId);

        expect(offlineAdapter.getAllByIndex).toHaveBeenCalledWith('goals', 'family_id', mockOfflineFamilyId);
        expect(result).toHaveLength(1);
      });

      it('should return empty array when no offline data', async () => {
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue(null);

        const result = await getGoals(mockFamilyId);

        expect(result).toEqual([]);
      });
    });
  });

  describe('createGoal', () => {
    it('should return null when familyId is null', async () => {
      const result = await createGoal(null, mockGoalPayload);
      expect(result).toBeNull();
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
        (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-goal-1');
      });

      it('should create goal via goalService when online', async () => {
        (goalService.createGoal as Mock).mockResolvedValue({ 
          data: mockGoalRow, 
          error: null 
        });

        const result = await createGoal(mockFamilyId, mockGoalPayload);

        expect(goalService.createGoal).toHaveBeenCalled();
        expect(result).toMatchObject({
          id: mockGoalId,
          name: 'Emergency Fund',
          currentValue: 100,
        });
      });

      it('should fallback to offline when service fails', async () => {
        (goalService.createGoal as Mock).mockResolvedValue({ 
          data: null, 
          error: new Error('Network error') 
        });

        const result = await createGoal(mockFamilyId, mockGoalPayload);

        expect(offlineAdapter.put).toHaveBeenCalledWith('goals', expect.objectContaining({
          id: 'offline-goal-1',
          name: 'Emergency Fund',
        }));
        expect(offlineAdapter.sync.add).toHaveBeenCalledWith(expect.objectContaining({
          type: 'goal',
          action: 'insert',
          familyId: mockFamilyId,
        }));
        expect(result).toMatchObject({
          id: 'offline-goal-1',
          name: 'Emergency Fund',
        });
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
        (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-goal-2');
      });

      it('should create goal in IndexedDB when offline', async () => {
        const result = await createGoal(mockFamilyId, mockGoalPayload);

        expect(offlineAdapter.put).toHaveBeenCalledWith('goals', expect.objectContaining({
          id: 'offline-goal-2',
          name: 'Emergency Fund',
          target_value: 10000,
        }));
        expect(result).toMatchObject({
          id: 'offline-goal-2',
          name: 'Emergency Fund',
        });
      });

      it('should handle offline family ID', async () => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);

        const result = await createGoal(mockOfflineFamilyId, mockGoalPayload);

        expect(offlineAdapter.put).toHaveBeenCalled();
        expect(goalService.createGoal).not.toHaveBeenCalled();
        expect(result).not.toBeNull();
      });
    });

    it('should handle goal with linkedSubcategoryId', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      
      const payloadWithSubcategory: GoalPayload = {
        ...mockGoalPayload,
        linkedSubcategoryId: 'sub-123',
      };

      (goalService.createGoal as Mock).mockResolvedValue({ 
        data: { ...mockGoalRow, linked_subcategory_id: 'sub-123' }, 
        error: null 
      });

      const result = await createGoal(mockFamilyId, payloadWithSubcategory);

      expect(result).not.toBeNull();
    });

    it('should handle goal with linkedCategoryKey', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      
      const payloadWithCategory: GoalPayload = {
        ...mockGoalPayload,
        linkedCategoryKey: 'liberdade',
      };

      (goalService.createGoal as Mock).mockResolvedValue({ 
        data: { ...mockGoalRow, linked_category_key: 'liberdade' }, 
        error: null 
      });

      const result = await createGoal(mockFamilyId, payloadWithCategory);

      expect(result).not.toBeNull();
    });
  });

  describe('updateGoal', () => {
    it('should do nothing when familyId is null', async () => {
      await updateGoal(null, mockGoalId, { name: 'Updated' });
      
      expect(goalService.updateGoal).not.toHaveBeenCalled();
      expect(offlineAdapter.put).not.toHaveBeenCalled();
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should update goal via goalService when online', async () => {
        (goalService.getGoalById as Mock).mockResolvedValue({ data: mockGoalRow, error: null });
        (goalService.updateGoal as Mock).mockResolvedValue({ error: null });

        await updateGoal(mockFamilyId, mockGoalId, { name: 'Updated Fund' });

        expect(goalService.updateGoal).toHaveBeenCalledWith(
          mockGoalId,
          expect.objectContaining({ name: 'Updated Fund' })
        );
      });

      it('should fallback to offline when update fails', async () => {
        (goalService.getGoalById as Mock).mockResolvedValue({ data: mockGoalRow, error: null });
        (goalService.updateGoal as Mock).mockResolvedValue({ error: new Error('Network error') });
        (offlineAdapter.get as Mock).mockResolvedValue(mockGoalRow);

        await updateGoal(mockFamilyId, mockGoalId, { name: 'Updated Fund' });

        expect(offlineAdapter.put).toHaveBeenCalledWith('goals', expect.objectContaining({
          name: 'Updated Fund',
        }));
        expect(offlineAdapter.sync.add).toHaveBeenCalled();
      });

      it('should fetch existing goal when partial update', async () => {
        (goalService.getGoalById as Mock).mockResolvedValue({ data: mockGoalRow, error: null });
        (goalService.updateGoal as Mock).mockResolvedValue({ error: null });

        await updateGoal(mockFamilyId, mockGoalId, { targetValue: 20000 });

        expect(goalService.getGoalById).toHaveBeenCalledWith(mockGoalId);
        expect(goalService.updateGoal).toHaveBeenCalled();
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should update goal in IndexedDB when offline', async () => {
        (offlineAdapter.get as Mock).mockResolvedValue(mockGoalRow);

        await updateGoal(mockFamilyId, mockGoalId, { name: 'Offline Update' });

        expect(offlineAdapter.get).toHaveBeenCalledWith('goals', mockGoalId);
        expect(offlineAdapter.put).toHaveBeenCalledWith('goals', expect.objectContaining({
          name: 'Offline Update',
          updated_at: expect.any(String),
        }));
      });

      it('should do nothing if goal not found offline', async () => {
        (offlineAdapter.get as Mock).mockResolvedValue(null);

        await updateGoal(mockFamilyId, mockGoalId, { name: 'Not Found' });

        expect(offlineAdapter.put).not.toHaveBeenCalled();
      });
    });

    it('should handle status update', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (goalService.getGoalById as Mock).mockResolvedValue({ data: mockGoalRow, error: null });
      (goalService.updateGoal as Mock).mockResolvedValue({ error: null });

      await updateGoal(mockFamilyId, mockGoalId, { status: 'archived' });

      expect(goalService.updateGoal).toHaveBeenCalledWith(
        mockGoalId,
        expect.objectContaining({ status: 'archived' })
      );
    });

    it('should handle linkedCategoryKey update', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (goalService.getGoalById as Mock).mockResolvedValue({ data: mockGoalRow, error: null });
      (goalService.updateGoal as Mock).mockResolvedValue({ error: null });

      await updateGoal(mockFamilyId, mockGoalId, { linkedCategoryKey: 'liberdade' });

      expect(goalService.updateGoal).toHaveBeenCalledWith(
        mockGoalId,
        expect.objectContaining({ linked_category_key: 'liberdade' })
      );
    });
  });

  describe('deleteGoal', () => {
    it('should do nothing when familyId is null', async () => {
      await deleteGoal(null, mockGoalId);
      
      expect(goalService.deleteGoal).not.toHaveBeenCalled();
      expect(offlineAdapter.delete).not.toHaveBeenCalled();
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should delete goal via goalService when online', async () => {
        (goalService.deleteGoal as Mock).mockResolvedValue({ error: null });

        await deleteGoal(mockFamilyId, mockGoalId);

        expect(goalService.deleteGoal).toHaveBeenCalledWith(mockGoalId);
      });

      it('should fallback to offline when delete fails', async () => {
        (goalService.deleteGoal as Mock).mockResolvedValue({ error: new Error('Network error') });

        await deleteGoal(mockFamilyId, mockGoalId);

        expect(offlineAdapter.delete).toHaveBeenCalledWith('goals', mockGoalId);
        expect(offlineAdapter.sync.add).toHaveBeenCalledWith(expect.objectContaining({
          type: 'goal',
          action: 'delete',
          data: { id: mockGoalId },
        }));
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should delete goal and entries from IndexedDB when offline', async () => {
        const mockEntries: GoalEntryRow[] = [
          { 
            id: 'entry-1', 
            goal_id: mockGoalId, 
            value: 500, 
            month: 1, 
            year: 2024, 
            expense_id: null,
            description: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          { 
            id: 'entry-2', 
            goal_id: mockGoalId, 
            value: 500, 
            month: 2, 
            year: 2024,
            expense_id: null,
            description: null,
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-01T00:00:00Z',
          },
        ];
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue(mockEntries);

        await deleteGoal(mockFamilyId, mockGoalId);

        expect(offlineAdapter.getAllByIndex).toHaveBeenCalledWith('goal_entries', 'goal_id', mockGoalId);
        expect(offlineAdapter.delete).toHaveBeenCalledWith('goal_entries', 'entry-1');
        expect(offlineAdapter.delete).toHaveBeenCalledWith('goal_entries', 'entry-2');
        expect(offlineAdapter.delete).toHaveBeenCalledWith('goals', mockGoalId);
      });

      it('should handle offline family ID', async () => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);

        await deleteGoal(mockOfflineFamilyId, mockGoalId);

        expect(goalService.deleteGoal).not.toHaveBeenCalled();
        expect(offlineAdapter.delete).toHaveBeenCalledWith('goals', mockGoalId);
      });
    });
  });

  describe('getGoalBySubcategoryId', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    });

    it('should return goal from offline if found', async () => {
      const goalWithSubcategory: GoalRow = {
        ...mockGoalRow,
        linked_subcategory_id: 'sub-123',
        status: 'active',
      };
      (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([goalWithSubcategory]);

      const result = await getGoalBySubcategoryId('sub-123');

      expect(offlineAdapter.getAllByIndex).toHaveBeenCalledWith('goals', 'linked_subcategory_id', 'sub-123');
      expect(result).toMatchObject({
        id: mockGoalId,
        linkedSubcategoryId: 'sub-123',
      });
    });

    it('should return null when no goal linked to subcategory', async () => {
      (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);
      (goalService.getGoalBySubcategoryId as Mock).mockResolvedValue({ data: null, error: null });

      const result = await getGoalBySubcategoryId('sub-456');

      expect(result).toBeNull();
    });
  });

  describe('getGoalByCategoryKey', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    });

    it('should return goal from offline if found', async () => {
      const goalWithCategory: GoalRow = {
        ...mockGoalRow,
        linked_category_key: 'liberdade',
        status: 'active',
      };
      (offlineAdapter.getAll as Mock).mockResolvedValue([goalWithCategory]);

      const result = await getGoalByCategoryKey('liberdade');

      expect(offlineAdapter.getAll).toHaveBeenCalledWith('goals');
      expect(result).toMatchObject({
        id: mockGoalId,
        linkedCategoryKey: 'liberdade',
      });
    });

    it('should return null when no goal linked to category', async () => {
      (offlineAdapter.getAll as Mock).mockResolvedValue([]);
      (goalService.getGoalByCategoryKey as Mock).mockResolvedValue({ data: null, error: null });

      const result = await getGoalByCategoryKey('essenciais');

      expect(result).toBeNull();
    });
  });
});
