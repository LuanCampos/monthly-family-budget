import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnnualViewChart } from './AnnualViewChart';
import type { Month } from '@/types/budget';

// Mock ResizeObserver for Recharts
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
window.ResizeObserver = MockResizeObserver;

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        noExpenses: 'No expenses',
        housing: 'Housing',
        food: 'Food',
        transportation: 'Transportation',
        utilities: 'Utilities',
        healthcare: 'Healthcare',
        entertainment: 'Entertainment',
        education: 'Education',
        clothing: 'Clothing',
        personal: 'Personal',
        savings: 'Savings',
        liberdade: 'Financial Freedom',
        other: 'Other',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatCurrency: (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`,
    currencySymbol: 'R$',
  }),
}));

const createMonth = (year: number, month: number, expenses: Array<{ categoryKey: string; value: number }>): Month => ({
  id: `month-${year}-${month}`,
  year,
  month,
  expenses: expenses.map((exp, idx) => ({
    id: `exp-${idx}`,
    description: 'Test expense',
    categoryKey: exp.categoryKey as 'housing' | 'food' | 'transportation',
    value: exp.value,
    date: `${year}-${String(month).padStart(2, '0')}-15`,
  })),
  incomeSources: [],
  limits: [],
});

describe('AnnualViewChart', () => {
  describe('Empty States', () => {
    it('should show empty message when no months', () => {
      render(<AnnualViewChart months={[]} currentYear={2024} />);
      expect(screen.getByText('No expenses')).toBeInTheDocument();
    });

    it('should show empty message when months have no expenses', () => {
      const emptyMonths = [createMonth(2024, 1, []), createMonth(2024, 2, [])];
      render(<AnnualViewChart months={emptyMonths} currentYear={2024} />);
      expect(screen.getByText('No expenses')).toBeInTheDocument();
    });

    it('should show empty when year has no data', () => {
      const months2023 = [createMonth(2023, 1, [{ categoryKey: 'housing', value: 1000 }])];
      render(<AnnualViewChart months={months2023} currentYear={2024} />);
      expect(screen.getByText('No expenses')).toBeInTheDocument();
    });
  });
});
