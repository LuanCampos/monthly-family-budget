import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpenseChart } from './ExpenseChart';
import type { CategoryKey } from '@/types/budget';

// Mock contexts
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        noExpenses: 'No expenses yet',
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

// Mock Recharts - they don't render well in JSDOM
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="pie" data-count={data?.length}>{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('ExpenseChart', () => {
  const mockData = [
    { key: 'custos-fixos' as CategoryKey, name: 'Fixed Costs', spent: 500, color: '#FF0000' },
    { key: 'conforto' as CategoryKey, name: 'Comfort', spent: 300, color: '#00FF00' },
    { key: 'metas' as CategoryKey, name: 'Goals', spent: 0, color: '#0000FF' },
  ];

  const defaultProps = {
    data: mockData,
    hasExpenses: true,
  };

  it('should render chart when has expenses', () => {
    render(<ExpenseChart {...defaultProps} />);

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('should show empty message when no expenses', () => {
    render(<ExpenseChart {...defaultProps} hasExpenses={false} />);

    expect(screen.getByText('No expenses yet')).toBeInTheDocument();
  });

  it('should show empty message when all data is zero', () => {
    const zeroData = mockData.map(d => ({ ...d, spent: 0 }));
    
    render(<ExpenseChart {...defaultProps} data={zeroData} hasExpenses={true} />);

    expect(screen.getByText('No expenses yet')).toBeInTheDocument();
  });

  it('should filter out categories with zero spent', () => {
    render(<ExpenseChart {...defaultProps} />);

    const pie = screen.getByTestId('pie');
    // Only 2 categories have spending > 0
    expect(pie).toHaveAttribute('data-count', '2');
  });

  it('should render responsive container', () => {
    render(<ExpenseChart {...defaultProps} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('should handle empty data array', () => {
    render(<ExpenseChart {...defaultProps} data={[]} hasExpenses={true} />);

    expect(screen.getByText('No expenses yet')).toBeInTheDocument();
  });

  it('should handle single category data', () => {
    const singleData = [mockData[0]];
    
    render(<ExpenseChart {...defaultProps} data={singleData} />);

    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-count', '1');
  });

  it('should render chart with onSelectCategory callback available', () => {
    const onSelectCategory = vi.fn();
    
    render(<ExpenseChart {...defaultProps} onSelectCategory={onSelectCategory} />);

    // Chart should render successfully with the callback
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    // The callback is passed to the chart for click handling
    // We can't easily test Recharts click events in JSDOM, but we verify the chart renders
  });

  it('should correctly calculate chart data from input', () => {
    const testData = [
      { key: 'custos-fixos' as CategoryKey, name: 'Fixed', spent: 100, color: '#F00' },
      { key: 'conforto' as CategoryKey, name: 'Comfort', spent: 200, color: '#0F0' },
    ];
    
    render(<ExpenseChart data={testData} hasExpenses={true} />);

    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-count', '2');
  });
});
