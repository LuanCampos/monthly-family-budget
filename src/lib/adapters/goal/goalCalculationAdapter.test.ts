import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { calculateMonthlySuggestion } from './goalCalculationAdapter';
import * as goalService from '../../services/goalService';
import { offlineAdapter } from '../offlineAdapter';

import type { GoalRow, GoalEntryRow } from '@/types/database';

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

describe('goalCalculationAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  const mockGoalId = 'goal-123';

  const createMockGoalRow = (overrides: Partial<GoalRow> = {}): GoalRow => ({
    id: mockGoalId,
    family_id: 'family-123',
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
    ...overrides,
  });

  const createMockEntryRow = (overrides: Partial<GoalEntryRow> = {}): GoalEntryRow => ({
    id: 'entry-1',
    goal_id: mockGoalId,
    expense_id: null,
    value: 500,
    description: 'Monthly deposit',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    ...overrides,
  });

  describe('calculateMonthlySuggestion', () => {
    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      });

      it('should return null when goal not found', async () => {
        (goalService.getGoalById as Mock).mockResolvedValue({ 
          data: null, 
          error: new Error('Not found') 
        });

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).toBeNull();
      });

      it('should return null when goal is not active', async () => {
        (goalService.getGoalById as Mock).mockResolvedValue({ 
          data: createMockGoalRow({ status: 'archived' }), 
          error: null 
        });

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).toBeNull();
      });

      it('should calculate suggestion from service', async () => {
        const mockGoal = createMockGoalRow();
        (goalService.getGoalById as Mock).mockResolvedValue({ 
          data: mockGoal, 
          error: null 
        });
        (goalService.calculateMonthlySuggestion as Mock).mockResolvedValue({ 
          data: [{
            remaining_value: 5000,
            months_remaining: 12,
            suggested_monthly: 416.67,
          }], 
          error: null 
        });
        (goalService.getEntries as Mock).mockResolvedValue({ 
          data: [], 
          error: null 
        });

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(goalService.calculateMonthlySuggestion).toHaveBeenCalledWith(mockGoalId);
        expect(result).not.toBeNull();
        expect(result?.remainingValue).toBe(5000);
        expect(result?.monthsRemaining).toBe(12);
      });

      it('should return null when suggestion calculation fails', async () => {
        const mockGoal = createMockGoalRow();
        (goalService.getGoalById as Mock).mockResolvedValue({ 
          data: mockGoal, 
          error: null 
        });
        (goalService.calculateMonthlySuggestion as Mock).mockResolvedValue({ 
          data: null, 
          error: new Error('Failed') 
        });

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).toBeNull();
      });

      it('should return null when suggestion returns empty array', async () => {
        const mockGoal = createMockGoalRow();
        (goalService.getGoalById as Mock).mockResolvedValue({ 
          data: mockGoal, 
          error: null 
        });
        (goalService.calculateMonthlySuggestion as Mock).mockResolvedValue({ 
          data: [], 
          error: null 
        });

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).toBeNull();
      });

      it('should adjust suggestion based on current month contributions', async () => {
        const mockGoal = createMockGoalRow();
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        (goalService.getGoalById as Mock).mockResolvedValue({ 
          data: mockGoal, 
          error: null 
        });
        (goalService.calculateMonthlySuggestion as Mock).mockResolvedValue({ 
          data: [{
            remaining_value: 5000,
            months_remaining: 12,
            suggested_monthly: 416.67,
          }], 
          error: null 
        });
        (goalService.getEntries as Mock).mockResolvedValue({ 
          data: [createMockEntryRow({ month: currentMonth, year: currentYear, value: 200 })], 
          error: null 
        });

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).not.toBeNull();
        expect(result?.monthlyContributed).toBe(200);
      });

      it('should handle null months_remaining and suggested_monthly', async () => {
        const mockGoal = createMockGoalRow({ target_month: null, target_year: null });
        (goalService.getGoalById as Mock).mockResolvedValue({ 
          data: mockGoal, 
          error: null 
        });
        (goalService.calculateMonthlySuggestion as Mock).mockResolvedValue({ 
          data: [{
            remaining_value: 5000,
            months_remaining: null,
            suggested_monthly: null,
          }], 
          error: null 
        });
        (goalService.getEntries as Mock).mockResolvedValue({ 
          data: [], 
          error: null 
        });

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).not.toBeNull();
        expect(result?.monthsRemaining).toBeNull();
        expect(result?.suggestedMonthly).toBeNull();
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      });

      it('should return null when goal not found offline', async () => {
        (offlineAdapter.get as Mock).mockResolvedValue(null);

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).toBeNull();
      });

      it('should return null when goal is not active offline', async () => {
        (offlineAdapter.get as Mock).mockResolvedValue(createMockGoalRow({ status: 'archived' }));

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).toBeNull();
      });

      it('should calculate suggestion from IndexedDB', async () => {
        const mockGoal = createMockGoalRow({ 
          target_value: 10000,
          target_month: 12,
          target_year: new Date().getFullYear() + 1,
        });
        const mockEntries = [
          createMockEntryRow({ value: 1000 }),
          createMockEntryRow({ id: 'entry-2', value: 1500 }),
        ];
        
        (offlineAdapter.get as Mock).mockResolvedValue(mockGoal);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue(mockEntries);

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(offlineAdapter.get).toHaveBeenCalledWith('goals', mockGoalId);
        expect(offlineAdapter.getAllByIndex).toHaveBeenCalledWith('goal_entries', 'goal_id', mockGoalId);
        expect(result).not.toBeNull();
        expect(result?.remainingValue).toBe(7500); // 10000 - 2500
      });

      it('should return partial result when no target date set', async () => {
        const mockGoal = createMockGoalRow({ 
          target_value: 10000,
          target_month: null,
          target_year: null,
        });
        const mockEntries = [createMockEntryRow({ value: 2000 })];
        
        (offlineAdapter.get as Mock).mockResolvedValue(mockGoal);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue(mockEntries);

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).not.toBeNull();
        expect(result?.remainingValue).toBe(8000);
        expect(result?.monthsRemaining).toBeNull();
        expect(result?.suggestedMonthly).toBeNull();
      });

      it('should calculate months remaining correctly', async () => {
        const today = new Date();
        const targetYear = today.getFullYear() + 1;
        const targetMonth = today.getMonth() + 1; // Same month next year
        
        const mockGoal = createMockGoalRow({ 
          target_value: 12000,
          target_month: targetMonth,
          target_year: targetYear,
        });
        
        (offlineAdapter.get as Mock).mockResolvedValue(mockGoal);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).not.toBeNull();
        expect(result?.monthsRemaining).toBe(12); // Exactly 12 months
        expect(result?.suggestedMonthly).toBe(1000); // 12000 / 12
      });

      it('should calculate current month contributions', async () => {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        
        const mockGoal = createMockGoalRow({ 
          target_value: 10000,
          target_month: 12,
          target_year: currentYear + 1,
        });
        const mockEntries = [
          createMockEntryRow({ value: 500, month: currentMonth, year: currentYear }),
          createMockEntryRow({ id: 'entry-2', value: 300, month: currentMonth, year: currentYear }),
          createMockEntryRow({ id: 'entry-3', value: 200, month: currentMonth - 1 || 12, year: currentMonth === 1 ? currentYear - 1 : currentYear }),
        ];
        
        (offlineAdapter.get as Mock).mockResolvedValue(mockGoal);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue(mockEntries);

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).not.toBeNull();
        expect(result?.monthlyContributed).toBe(800); // 500 + 300 from current month
      });

      it('should handle overachieved current month', async () => {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        
        // Set up a scenario where the target is far in the future and user contributed a lot
        const mockGoal = createMockGoalRow({ 
          target_value: 12000,
          target_month: 12,
          target_year: currentYear + 1, // Target in about a year
        });
        // User contributed 2000 this month (more than average of ~1000/month)
        const mockEntries = [
          createMockEntryRow({ value: 2000, month: currentMonth, year: currentYear }),
        ];
        
        (offlineAdapter.get as Mock).mockResolvedValue(mockGoal);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue(mockEntries);

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).not.toBeNull();
        expect(result?.monthlyContributed).toBe(2000);
        expect(result?.remainingValue).toBe(10000); // 12000 - 2000
      });

      it('should handle goal with past target date', async () => {
        const today = new Date();
        const pastYear = today.getFullYear() - 1;
        
        const mockGoal = createMockGoalRow({ 
          target_value: 10000,
          target_month: 1,
          target_year: pastYear,
        });
        
        (offlineAdapter.get as Mock).mockResolvedValue(mockGoal);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).not.toBeNull();
        expect(result?.monthsRemaining).toBe(0); // Target already passed
      });

      it('should handle empty entries', async () => {
        const mockGoal = createMockGoalRow({ 
          target_value: 5000,
          target_month: 12,
          target_year: new Date().getFullYear() + 1,
        });
        
        (offlineAdapter.get as Mock).mockResolvedValue(mockGoal);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).not.toBeNull();
        expect(result?.remainingValue).toBe(5000);
        expect(result?.monthlyContributed).toBe(0);
      });

      it('should handle null entries array', async () => {
        const mockGoal = createMockGoalRow({ 
          target_value: 5000,
          target_month: 12,
          target_year: new Date().getFullYear() + 1,
        });
        
        (offlineAdapter.get as Mock).mockResolvedValue(mockGoal);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue(null);

        const result = await calculateMonthlySuggestion(mockGoalId);

        expect(result).not.toBeNull();
        expect(result?.remainingValue).toBe(5000);
      });

      it('should default status to active when undefined', async () => {
        const mockGoal = createMockGoalRow({ status: undefined as unknown as 'active' });
        
        (offlineAdapter.get as Mock).mockResolvedValue(mockGoal);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([]);

        const result = await calculateMonthlySuggestion(mockGoalId);

        // Should not return null because undefined status defaults to 'active'
        expect(result).not.toBeNull();
      });
    });
  });
});
