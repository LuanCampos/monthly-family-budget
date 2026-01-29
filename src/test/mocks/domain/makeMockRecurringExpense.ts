import type { RecurringExpense } from '@/types/budget';

export function makeMockRecurringExpense(overrides: Partial<RecurringExpense> = {}): RecurringExpense {
  return {
    id: 'recurring-1',
    title: 'Monthly Rent',
    category: 'essenciais',
    subcategoryId: 'subcat-1',
    value: 1500,
    dueDay: 5,
    hasInstallments: false,
    isRecurring: true,
    ...overrides,
  };
}
