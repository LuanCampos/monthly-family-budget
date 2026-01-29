import { Expense } from '@/types';
import { CategoryKey } from '@/types/budget';

export function makeMockExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'expense-1',
    title: 'Default Expense',
    category: 'essenciais' as CategoryKey,
    value: 100,
    isRecurring: false,
    isPending: false,
    ...overrides,
  };
}