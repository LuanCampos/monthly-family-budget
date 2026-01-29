import type { Goal } from '@/types/budget';

export function makeMockGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    name: 'Test Goal',
    target: 1000,
    current: 0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    ...overrides,
  };
}
