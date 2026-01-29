import type { Month, CategoryKey } from '@/types/budget';

export function makeMockMonth(overrides: Partial<Month> = {}): Month {
  return {
    id: 'month-1',
    label: '01/2026',
    year: 2026,
    month: 1,
    income: 5000,
    incomeSources: [],
    expenses: [],
    categoryLimits: {} as Record<CategoryKey, number>,
    ...overrides,
  };
}
