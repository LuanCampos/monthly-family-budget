import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryTable } from './SummaryTable';

// Mock contexts
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        totalSpent: 'Total Spent',
        totalRemaining: 'Total Remaining',
        used: 'used',
        'custos-fixos': 'Fixed Costs',
        'conforto': 'Comfort',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
  }),
}));

vi.mock('@/constants/categories', () => ({
  getCategoryByKey: (key: string) => ({
    key,
    color: '#3B82F6',
    name: key,
  }),
}));

describe('SummaryTable', () => {
  const mockCategories = [
    {
      key: 'custos-fixos' as const,
      name: 'Custos Fixos',
      percentage: 50,
      budget: 1000,
      spent: 500,
      remaining: 500,
      usedPercentage: 50,
    },
    {
      key: 'conforto' as const,
      name: 'Conforto',
      percentage: 30,
      budget: 600,
      spent: 700,
      remaining: -100,
      usedPercentage: 116.67,
    },
  ];

  const defaultProps = {
    categories: mockCategories,
    totalSpent: 1200,
    totalBudget: 1600,
    usedPercentage: 75,
  };

  it('should render all categories', () => {
    render(<SummaryTable {...defaultProps} />);

    expect(screen.getByText('Fixed Costs')).toBeInTheDocument();
    expect(screen.getByText('Comfort')).toBeInTheDocument();
  });

  it('should display formatted spent values', () => {
    render(<SummaryTable {...defaultProps} />);

    expect(screen.getByText('R$ 500.00')).toBeInTheDocument();
    expect(screen.getByText('R$ 700.00')).toBeInTheDocument();
  });

  it('should display budget values for each category', () => {
    render(<SummaryTable {...defaultProps} />);

    // Budget values are prefixed with "/" and nbsp - check the spent values instead
    // Category 1 spent: R$ 500.00, Category 2 spent: R$ 700.00
    expect(screen.getByText('R$ 500.00')).toBeInTheDocument();
    expect(screen.getByText('R$ 700.00')).toBeInTheDocument();
    
    // Check budget values with prefix (using regex for the nbsp)
    expect(screen.getByText(/\/.*1000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\/.*600\.00/)).toBeInTheDocument();
  });

  it('should show percentage values', () => {
    render(<SummaryTable {...defaultProps} />);

    // Check for percentage display with 2 decimal places
    expect(screen.getByText('50.00%')).toBeInTheDocument();
  });

  it('should show exceeded category with destructive styling', () => {
    render(<SummaryTable {...defaultProps} />);

    // The exceeded category should have destructive color class
    const exceededSpent = screen.getByText('R$ 700.00');
    expect(exceededSpent).toHaveClass('text-destructive');
  });

  it('should render progress bars for each category', () => {
    const { container } = render(<SummaryTable {...defaultProps} />);

    // One progress bar per category (2 categories in mockCategories)
    const progressBars = container.querySelectorAll('.bg-secondary.rounded-full');
    expect(progressBars).toHaveLength(2);
  });

  it('should display totals section', () => {
    render(<SummaryTable {...defaultProps} />);

    // Check for total labels
    expect(screen.getByText('Total Spent')).toBeInTheDocument();
    expect(screen.getByText('Total Remaining')).toBeInTheDocument();
    expect(screen.getByText('used')).toBeInTheDocument();
  });

  it('should display total spent value', () => {
    render(<SummaryTable {...defaultProps} />);

    // Total spent is 1200
    expect(screen.getByText('R$ 1200.00')).toBeInTheDocument();
  });

  it('should display total remaining value', () => {
    render(<SummaryTable {...defaultProps} />);

    // Remaining is 1600 - 1200 = 400
    expect(screen.getByText('R$ 400.00')).toBeInTheDocument();
  });

  it('should display used percentage', () => {
    render(<SummaryTable {...defaultProps} />);

    // formatPercentage uses 2 decimal places
    expect(screen.getByText('75.00%')).toBeInTheDocument();
  });

  it('should handle empty categories', () => {
    const props = {
      ...defaultProps,
      categories: [],
    };

    render(<SummaryTable {...props} />);
    
    // Should still render the totals section even with no categories
    expect(screen.getByText('Total Spent')).toBeInTheDocument();
    expect(screen.getByText('Total Remaining')).toBeInTheDocument();
    // Should not render any category rows
    expect(screen.queryByText('Fixed Costs')).not.toBeInTheDocument();
  });

  it('should cap progress bar width at 100%', () => {
    const { container } = render(<SummaryTable {...defaultProps} />);

    // All progress bar inner elements should have max 100% width
    const progressInners = container.querySelectorAll('.h-full.rounded-full');
    progressInners.forEach(inner => {
      const style = inner.getAttribute('style');
      if (style) {
        const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)/);
        if (widthMatch) {
          const width = parseFloat(widthMatch[1]);
          expect(width).toBeLessThanOrEqual(100);
        }
      }
    });
  });
});
