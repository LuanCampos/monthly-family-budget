import type { Goal } from '@/types/budget';

export function makeMockGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    familyId: 'family-1',
    name: 'Test Goal',
    targetValue: 1000,
    currentValue: 0,
    status: 'active',
    ...overrides,
  };
}
