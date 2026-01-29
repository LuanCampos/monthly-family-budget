import type { Entry } from '@/types/budget';

export function makeMockEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'entry-1',
    goalId: 'goal-1',
    expenseId: 'expense-1',
    value: 100,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
