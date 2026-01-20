import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubcategoryChart } from './SubcategoryChart';
import type { CategoryKey, Expense, Subcategory } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        back: 'Back',
        noSubcategoryExpenses: 'No expenses in this category',
        notSpecified: 'Not Specified',
        housing: 'Housing',
        transportation: 'Transportation',
        food: 'Food',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatCurrency: (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`,
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="pie" data-segments={data.length}>{children}</div>
  ),
  Cell: ({ fill }: { fill: string }) => <div data-testid="cell" data-fill={fill} />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const mockSubcategories: Subcategory[] = [
  { id: 'sub1', name: 'Rent', categoryKey: 'housing' },
  { id: 'sub2', name: 'Internet', categoryKey: 'housing' },
  { id: 'sub3', name: 'Gas', categoryKey: 'transportation' },
];

const createMockExpense = (id: string, category: CategoryKey, value: number, subcategoryId?: string): Expense => ({
  id,
  title: `Expense ${id}`,
  category,
  value,
  date: '2024-01-01',
  subcategoryId,
});

describe('SubcategoryChart', () => {
  const defaultProps = {
    categoryKey: 'housing' as CategoryKey,
    expenses: [] as Expense[],
    subcategories: mockSubcategories,
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header', () => {
    it('should render back button', () => {
      render(<SubcategoryChart {...defaultProps} />);

      expect(screen.getByLabelText('Back')).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();
      render(<SubcategoryChart {...defaultProps} onBack={onBack} />);

      await user.click(screen.getByLabelText('Back'));

      expect(onBack).toHaveBeenCalled();
    });

    it('should display category name', () => {
      render(<SubcategoryChart {...defaultProps} />);

      expect(screen.getByText('Housing')).toBeInTheDocument();
    });

    it('should display category color indicator', () => {
      render(<SubcategoryChart {...defaultProps} />);

      const colorIndicator = document.querySelector('.w-3.h-3.rounded-full');
      expect(colorIndicator).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no expenses', () => {
      render(<SubcategoryChart {...defaultProps} expenses={[]} />);

      expect(screen.getByText('No expenses in this category')).toBeInTheDocument();
    });

    it('should show empty message when category has no expenses', () => {
      const expenses = [
        createMockExpense('1', 'transportation', 100),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByText('No expenses in this category')).toBeInTheDocument();
    });
  });

  describe('Chart Rendering', () => {
    it('should render pie chart when there are expenses', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000, 'sub1'),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should render responsive container', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000, 'sub1'),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render tooltip', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000, 'sub1'),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  describe('Data Processing', () => {
    it('should group expenses by subcategory', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000, 'sub1'),
        createMockExpense('2', 'housing', 500, 'sub1'),
        createMockExpense('3', 'housing', 300, 'sub2'),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.getByText('Internet')).toBeInTheDocument();
    });

    it('should show formatted values in legend', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1500, 'sub1'),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByText('R$ 1500,00')).toBeInTheDocument();
    });

    it('should group uncategorized expenses', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000),
        createMockExpense('2', 'housing', 500),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByText('Not Specified')).toBeInTheDocument();
    });

    it('should handle missing subcategory reference', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000, 'non-existent-sub'),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByText('Not Specified')).toBeInTheDocument();
    });
  });

  describe('Legend Display', () => {
    it('should display all subcategories in legend', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000, 'sub1'),
        createMockExpense('2', 'housing', 500, 'sub2'),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.getByText('Internet')).toBeInTheDocument();
    });

    it('should show color indicators in legend', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000, 'sub1'),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      const colorIndicators = document.querySelectorAll('.w-2.h-2.rounded-full');
      expect(colorIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Different Categories', () => {
    it('should filter expenses by category', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000, 'sub1'),
        createMockExpense('2', 'transportation', 500, 'sub3'),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} categoryKey="transportation" />);

      expect(screen.getByText('Transportation')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle large number of subcategories', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000, 'sub1'),
        createMockExpense('2', 'housing', 500, 'sub2'),
        createMockExpense('3', 'housing', 300),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should handle very large values', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000000, 'sub1'),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByText('R$ 1000000,00')).toBeInTheDocument();
    });

    it('should handle very small values', () => {
      const expenses = [
        createMockExpense('1', 'housing', 0.01, 'sub1'),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should handle empty subcategories list', () => {
      const expenses = [
        createMockExpense('1', 'housing', 1000),
      ];
      render(<SubcategoryChart {...defaultProps} expenses={expenses} subcategories={[]} />);

      expect(screen.getByText('Not Specified')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on back button', () => {
      render(<SubcategoryChart {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });
  });
});
