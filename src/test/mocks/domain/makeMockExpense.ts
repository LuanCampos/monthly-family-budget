import type { Expense } from '@/types/budget';

export function makeMockExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    title: 'Light Bill',
    category: 'essenciais',
    value: 150.00,
    isPending: false,
    isRecurring: false,
    recurringExpenseId: 'rec-1',
    ...overrides,
  };
}
