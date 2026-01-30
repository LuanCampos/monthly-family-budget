import type { GoalEntry } from '@/types/budget';

export function makeMockEntry(overrides: Partial<GoalEntry> = {}): GoalEntry {
  return {
    id: 'entry-1',
    goalId: 'goal-1',
    expenseId: 'expense-1',
    value: 100,
    month: 1,
    year: 2026,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
