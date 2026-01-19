import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpenseList } from './ExpenseList';
import type { Expense } from '@/types';

// Mock dependencies
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    language: 'pt',
    t: (key: string) => key,
  })),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: vi.fn(() => ({
    currency: 'BRL',
    currencySymbol: 'R$',
    formatCurrency: (v: number) => `R$ ${v.toFixed(2)}`,
  })),
}));

vi.mock('@/components/common', () => ({
  ConfirmDialog: () => null,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void }) => 
    <button onClick={onClick} {...props}>{children}</button>,
}));

describe('ExpenseList', () => {
  const defaultProps = {
    expenses: [] as Expense[],
    subcategories: [],
    recurringExpenses: [],
    onRemove: vi.fn(),
    onEdit: vi.fn(),
    onConfirmPayment: vi.fn(),
    sortType: 'createdAt' as const,
    sortDirection: 'desc' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('should show empty message when no expenses', () => {
      render(<ExpenseList {...defaultProps} expenses={[]} />);
      
      expect(screen.getByText('noExpenses')).toBeInTheDocument();
    });
  });

  describe('with expenses', () => {
    it('should render expense items', () => {
      const expenses: Expense[] = [
        {
          id: 'expense-1',
          title: 'Rent',
          categoryKey: 'housing',
          value: 1500,
          monthId: 'month-1',
          isRecurring: false,
          isPending: false,
        },
        {
          id: 'expense-2',
          title: 'Groceries',
          categoryKey: 'food',
          value: 500,
          monthId: 'month-1',
          isRecurring: false,
          isPending: false,
        },
      ];

      render(<ExpenseList {...defaultProps} expenses={expenses} />);
      
      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    it('should render expense values', () => {
      const expenses: Expense[] = [
        {
          id: 'expense-1',
          title: 'Rent',
          categoryKey: 'housing',
          value: 1500,
          monthId: 'month-1',
          isRecurring: false,
          isPending: false,
        },
      ];

      render(<ExpenseList {...defaultProps} expenses={expenses} />);
      
      expect(screen.getByText('R$ 1500.00')).toBeInTheDocument();
    });

    it('should show pending indicator for pending expenses', () => {
      const expenses: Expense[] = [
        {
          id: 'expense-1',
          title: 'Pending Bill',
          categoryKey: 'utilities',
          value: 200,
          monthId: 'month-1',
          isRecurring: true,
          isPending: true,
        },
      ];

      render(<ExpenseList {...defaultProps} expenses={expenses} />);
      
      expect(screen.getByText('Pending Bill')).toBeInTheDocument();
      // Check for pending indicator (button with title)
      expect(screen.getByTitle('confirmPayment')).toBeInTheDocument();
    });
  });

  describe('search filter', () => {
    it('should filter expenses by search term', () => {
      const expenses: Expense[] = [
        {
          id: 'expense-1',
          title: 'Rent',
          categoryKey: 'housing',
          value: 1500,
          monthId: 'month-1',
          isRecurring: false,
          isPending: false,
        },
        {
          id: 'expense-2',
          title: 'Groceries',
          categoryKey: 'food',
          value: 500,
          monthId: 'month-1',
          isRecurring: false,
          isPending: false,
        },
      ];

      render(<ExpenseList {...defaultProps} expenses={expenses} searchTerm="Rent" />);
      
      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
    });
  });
});
