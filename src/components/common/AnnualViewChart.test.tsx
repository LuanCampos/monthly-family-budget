import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnnualViewChart } from './AnnualViewChart';
import type { Month, CategoryKey } from '@/types/budget';

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
        essenciais: 'Essentials',
        conforto: 'Comfort',
        metas: 'Goals',
        prazeres: 'Pleasures',
        liberdade: 'Financial Freedom',
        conhecimento: 'Knowledge',
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

const createMonth = (year: number, month: number, expenses: Array<{ categoryKey: CategoryKey; value: number }>): Month => ({
  id: `month-${year}-${month}`,
  label: `${String(month).padStart(2, '0')}/${year}`,
  year,
  month,
  income: 5000,
  expenses: expenses.map((exp, idx) => ({
    id: `exp-${idx}`,
    title: 'Test expense',
    category: exp.categoryKey,
    value: exp.value,
    isRecurring: false,
  })),
  incomeSources: [],
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
      const months2023 = [createMonth(2023, 1, [{ categoryKey: 'essenciais', value: 1000 }])];
      render(<AnnualViewChart months={months2023} currentYear={2024} />);
      expect(screen.getByText('No expenses')).toBeInTheDocument();
    });
  });
});
