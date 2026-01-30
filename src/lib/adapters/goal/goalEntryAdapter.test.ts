import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  getEntries,
  getEntryByExpense,
  createEntry,
  createManualEntry,
  updateEntry,
  deleteEntry,
  getHistoricalExpenses,
  importExpense,
} from './goalEntryAdapter';
import * as goalService from '../../services/goalService';
import { offlineAdapter } from '../offlineAdapter';

import type { GoalEntryRow, ExpenseRow } from '@/types/database';
import type { GoalEntryPayload } from './types';

// Helper to create proper PostgrestSingleResponse
const createSuccessResponse = <T,>(data: T) => ({
  data,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK',
});

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

describe('goalEntryAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  const mockFamilyId = 'family-123';
  const _mockOfflineFamilyId = 'offline-family-123';
  const mockGoalId = 'goal-123';
  const mockEntryId = 'entry-123';
  const mockExpenseId = 'expense-123';

  const mockEntryRow: GoalEntryRow = {
    id: mockEntryId,
    goal_id: mockGoalId,
    expense_id: null,
    value: 500,
    description: 'Monthly deposit',
    month: 1,
    year: 2024,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  };

  const mockAutomaticEntryRow: GoalEntryRow = {
    ...mockEntryRow,
    id: 'entry-auto',
    expense_id: mockExpenseId,
    description: 'Imported expense',
  };

  const mockEntryPayload: GoalEntryPayload = {
    goalId: mockGoalId,
    value: 500,
    description: 'Monthly deposit',
    month: 1,
    year: 2024,
  };

  const mockExpenseRow: ExpenseRow = {
    id: mockExpenseId,
    month_id: 'month-123',
    family_id: mockFamilyId,
    title: 'Test Expense',
    category_key: 'essenciais',
    subcategory_id: null,
    value: 100,
    is_recurring: false,
    is_pending: false,
    due_day: null,
    recurring_expense_id: null,
    installment_current: null,
    installment_total: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  };

  describe('getEntries', () => {
    it('should return empty array when familyId is null', async () => {
      const result = await getEntries(null, mockGoalId);
      expect(result).toEqual([]);
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should fetch entries from goalService when online', async () => {
        (goalService.getEntries as Mock).mockResolvedValue({ 
          data: [mockEntryRow], 
          error: null 
        });

        const result = await getEntries(mockFamilyId, mockGoalId);

        expect(goalService.getEntries).toHaveBeenCalledWith(mockGoalId);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: mockEntryId,
          goalId: mockGoalId,
          value: 500,
        });
      });

      it('should return empty array when goalService returns error', async () => {
        (goalService.getEntries as Mock).mockResolvedValue({ 
          data: null, 
          error: new Error('Network error') 
        });

        const result = await getEntries(mockFamilyId, mockGoalId);

        expect(result).toEqual([]);
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should fetch entries from IndexedDB when offline', async () => {
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([mockEntryRow]);

        const result = await getEntries(mockFamilyId, mockGoalId);

        expect(offlineAdapter.getAllByIndex).toHaveBeenCalledWith('goal_entries', 'goal_id', mockGoalId);
        expect(result).toHaveLength(1);
      });

      it('should sort entries by year/month descending', async () => {
        const entries: GoalEntryRow[] = [
          { ...mockEntryRow, id: 'e1', month: 1, year: 2024 },
          { ...mockEntryRow, id: 'e2', month: 6, year: 2024 },
          { ...mockEntryRow, id: 'e3', month: 12, year: 2023 },
        ];
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue(entries);

        const result = await getEntries(mockFamilyId, mockGoalId);

        expect(result[0].id).toBe('e2'); // June 2024
        expect(result[1].id).toBe('e1'); // January 2024
        expect(result[2].id).toBe('e3'); // December 2023
      });
    });
  });

  describe('getEntryByExpense', () => {
    it('should return entry from offline if found', async () => {
      (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([mockAutomaticEntryRow]);

      const result = await getEntryByExpense(mockExpenseId);

      expect(offlineAdapter.getAllByIndex).toHaveBeenCalledWith('goal_entries', 'expense_id', mockExpenseId);
      expect(result).toMatchObject({
        id: 'entry-auto',
        expenseId: mockExpenseId,
      });
    });

    it('should fetch from service if not found offline and online', async () => {
      (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);
      (goalService.getEntryByExpense as Mock).mockResolvedValue({ 
        data: mockAutomaticEntryRow, 
        error: null 
      });

      const result = await getEntryByExpense(mockExpenseId);

      expect(goalService.getEntryByExpense).toHaveBeenCalledWith(mockExpenseId);
      expect(result).toMatchObject({
        id: 'entry-auto',
      });
    });

    it('should return null if offline and not found locally', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);

      const result = await getEntryByExpense(mockExpenseId);

      expect(goalService.getEntryByExpense).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('createEntry', () => {
    it('should return null when familyId is null', async () => {
      const result = await createEntry(null, mockEntryPayload);
      expect(result).toBeNull();
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
        (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-entry-1');
      });

      it('should create entry via goalService when online', async () => {
        (goalService.createEntry as Mock).mockResolvedValue({ 
          data: mockEntryRow, 
          error: null 
        });

        const result = await createEntry(mockFamilyId, mockEntryPayload);

        expect(goalService.createEntry).toHaveBeenCalled();
        expect(result).toMatchObject({
          id: mockEntryId,
          goalId: mockGoalId,
          value: 500,
        });
      });

      it('should fallback to offline when service fails', async () => {
        (goalService.createEntry as Mock).mockResolvedValue({ 
          data: null, 
          error: new Error('Network error') 
        });

        const result = await createEntry(mockFamilyId, mockEntryPayload);

        expect(offlineAdapter.put).toHaveBeenCalledWith('goal_entries', expect.objectContaining({
          id: 'offline-entry-1',
          goal_id: mockGoalId,
        }));
        expect(offlineAdapter.sync.add).toHaveBeenCalled();
        expect(result).toMatchObject({
          id: 'offline-entry-1',
        });
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
        (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-entry-2');
      });

      it('should create entry in IndexedDB when offline', async () => {
        const result = await createEntry(mockFamilyId, mockEntryPayload);

        expect(offlineAdapter.put).toHaveBeenCalledWith('goal_entries', expect.objectContaining({
          id: 'offline-entry-2',
          goal_id: mockGoalId,
          value: 500,
        }));
        expect(result).toMatchObject({
          id: 'offline-entry-2',
          goalId: mockGoalId,
        });
      });
    });
  });

  describe('createManualEntry', () => {
    it('should delegate to createEntry', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (goalService.createEntry as Mock).mockResolvedValue({ 
        data: mockEntryRow, 
        error: null 
      });

      const result = await createManualEntry(mockFamilyId, mockEntryPayload);

      expect(goalService.createEntry).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: mockEntryId,
      });
    });
  });

  describe('updateEntry', () => {
    it('should do nothing when familyId is null', async () => {
      await updateEntry(null, mockEntryId, { value: 1000 });
      
      expect(goalService.updateEntry).not.toHaveBeenCalled();
      expect(offlineAdapter.put).not.toHaveBeenCalled();
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should update entry via goalService when online', async () => {
        (goalService.getEntryById as Mock).mockResolvedValue({ data: mockEntryRow, error: null });
        (goalService.updateEntry as Mock).mockResolvedValue({ error: null });

        await updateEntry(mockFamilyId, mockEntryId, { value: 1000, description: 'Updated', month: 1, year: 2024 });

        expect(goalService.updateEntry).toHaveBeenCalledWith(
          mockEntryId,
          expect.objectContaining({ value: 1000 })
        );
      });

      it('should throw when editing automatic entry without allowAutomaticUpdate', async () => {
        (goalService.getEntryById as Mock).mockResolvedValue({ 
          data: mockAutomaticEntryRow, 
          error: null 
        });

        await expect(updateEntry(mockFamilyId, 'entry-auto', { value: 1000, description: 'Updated', month: 1, year: 2024 }))
          .rejects.toThrow('Automatic entries cannot be edited');
      });

      it('should allow updating automatic entry when allowAutomaticUpdate is true', async () => {
        (goalService.getEntryById as Mock).mockResolvedValue({ 
          data: mockAutomaticEntryRow, 
          error: null 
        });
        (goalService.updateEntry as Mock).mockResolvedValue({ error: null });

        await updateEntry(mockFamilyId, 'entry-auto', { value: 1000, description: 'Updated', month: 1, year: 2024 }, true);

        expect(goalService.updateEntry).toHaveBeenCalled();
      });

      it('should fallback to offline when update fails', async () => {
        (goalService.getEntryById as Mock).mockResolvedValue({ data: mockEntryRow, error: null });
        (goalService.updateEntry as Mock).mockResolvedValue({ error: new Error('Network error') });
        (offlineAdapter.get as Mock).mockResolvedValue(mockEntryRow);

        await updateEntry(mockFamilyId, mockEntryId, { value: 1000, description: 'Updated', month: 1, year: 2024 });

        expect(offlineAdapter.put).toHaveBeenCalled();
        expect(offlineAdapter.sync.add).toHaveBeenCalled();
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should update entry in IndexedDB when offline', async () => {
        (offlineAdapter.get as Mock).mockResolvedValue(mockEntryRow);

        await updateEntry(mockFamilyId, mockEntryId, { value: 1000, description: 'Updated', month: 1, year: 2024 });

        expect(offlineAdapter.get).toHaveBeenCalledWith('goal_entries', mockEntryId);
        expect(offlineAdapter.put).toHaveBeenCalledWith('goal_entries', expect.objectContaining({
          value: 1000,
          updated_at: expect.any(String),
        }));
      });

      it('should do nothing if entry not found offline', async () => {
        (offlineAdapter.get as Mock).mockResolvedValue(null);

        await updateEntry(mockFamilyId, mockEntryId, { value: 1000, description: 'Updated', month: 1, year: 2024 });

        expect(offlineAdapter.put).not.toHaveBeenCalled();
      });

      it('should throw when editing automatic entry offline without flag', async () => {
        (offlineAdapter.get as Mock).mockResolvedValue(mockAutomaticEntryRow);

        await expect(updateEntry(mockFamilyId, 'entry-auto', { value: 1000, description: 'Updated', month: 1, year: 2024 }))
          .rejects.toThrow('Automatic entries cannot be edited');
      });
    });
  });

  describe('deleteEntry', () => {
    it('should do nothing when familyId is null', async () => {
      await deleteEntry(null, mockEntryId);
      
      expect(goalService.deleteEntry).not.toHaveBeenCalled();
      expect(offlineAdapter.delete).not.toHaveBeenCalled();
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should delete entry via goalService when online', async () => {
        (goalService.getEntryById as Mock).mockResolvedValue({ data: mockEntryRow, error: null });
        (goalService.deleteEntry as Mock).mockResolvedValue({ error: null });

        await deleteEntry(mockFamilyId, mockEntryId);

        expect(goalService.deleteEntry).toHaveBeenCalledWith(mockEntryId);
      });

      it('should fallback to offline when delete fails', async () => {
        (goalService.getEntryById as Mock).mockResolvedValue({ data: mockEntryRow, error: null });
        (goalService.deleteEntry as Mock).mockResolvedValue({ error: new Error('Network error') });

        await deleteEntry(mockFamilyId, mockEntryId);

        expect(offlineAdapter.delete).toHaveBeenCalledWith('goal_entries', mockEntryId);
        expect(offlineAdapter.sync.add).toHaveBeenCalled();
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should delete entry from IndexedDB when offline', async () => {
        (offlineAdapter.get as Mock).mockResolvedValue(mockEntryRow);

        await deleteEntry(mockFamilyId, mockEntryId);

        expect(offlineAdapter.delete).toHaveBeenCalledWith('goal_entries', mockEntryId);
      });

      it('should do nothing if entry not found offline', async () => {
        (offlineAdapter.get as Mock).mockResolvedValue(null);

        await deleteEntry(mockFamilyId, mockEntryId);

        expect(offlineAdapter.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('getHistoricalExpenses', () => {
    it('should return empty array when familyId is null', async () => {
      const result = await getHistoricalExpenses(null, 'sub-123');
      expect(result).toEqual([]);
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should fetch historical expenses from goalService', async () => {
        (goalService.getHistoricalExpenses as Mock).mockResolvedValue({ 
          data: [mockExpenseRow], 
          error: null 
        });

        const result = await getHistoricalExpenses(mockFamilyId, 'sub-123');

        expect(goalService.getHistoricalExpenses).toHaveBeenCalledWith('sub-123');
        expect(result).toHaveLength(1);
      });

      it('should return empty array when service returns error', async () => {
        (goalService.getHistoricalExpenses as Mock).mockResolvedValue({ 
          data: null, 
          error: new Error('Network error') 
        });

        const result = await getHistoricalExpenses(mockFamilyId, 'sub-123');

        expect(result).toEqual([]);
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should filter expenses by subcategory and exclude imported', async () => {
        const expenses: ExpenseRow[] = [
          { ...mockExpenseRow, id: 'e1', subcategory_id: 'sub-123' },
          { ...mockExpenseRow, id: 'e2', subcategory_id: 'sub-123' },
          { ...mockExpenseRow, id: 'e3', subcategory_id: 'sub-other' },
        ];
        const entries: GoalEntryRow[] = [
          { ...mockAutomaticEntryRow, expense_id: 'e1' },
        ];
        (offlineAdapter.getAll as Mock)
          .mockResolvedValueOnce(expenses)
          .mockResolvedValueOnce(entries);

        const result = await getHistoricalExpenses(mockFamilyId, 'sub-123');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('e2');
      });
    });
  });

  describe('importExpense', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
    });

    it('should return null when familyId is null', async () => {
      const result = await importExpense(null, mockGoalId, mockExpenseId);
      expect(result).toBeNull();
    });


    it('should import expense and create entry', async () => {
      (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]); // No existing entry
      // No need to mock getEntryByExpense for online
      vi.spyOn(goalService, 'importExpenseAsEntry').mockResolvedValue(createSuccessResponse(mockAutomaticEntryRow));

      const result = await importExpense(mockFamilyId, mockGoalId, mockExpenseId);

      expect(goalService.importExpenseAsEntry).toHaveBeenCalledWith(mockGoalId, mockExpenseId);
      expect(result).toMatchObject({
        id: 'entry-auto',
        expenseId: mockExpenseId,
      });
    });


    it('should throw when expense already imported', async () => {
      (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);
      // Simula erro de já importado
      vi.spyOn(goalService, 'importExpenseAsEntry').mockResolvedValue({ 
        data: null, 
        error: { message: 'already imported', details: '', hint: '', code: 'ERROR', name: 'PostgrestError' },
        count: null,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(importExpense(mockFamilyId, mockGoalId, mockExpenseId))
        .rejects.toThrow('already imported');
    });

    it('should throw when expense not found', async () => {
      (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);
      // Simula erro de not found
      vi.spyOn(goalService, 'importExpenseAsEntry').mockResolvedValue({ 
        data: null, 
        error: { message: 'not found', details: '', hint: '', code: 'ERROR', name: 'PostgrestError' },
        count: null,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(importExpense(mockFamilyId, mockGoalId, mockExpenseId))
        .rejects.toThrow('not found');
    });
  });
});
