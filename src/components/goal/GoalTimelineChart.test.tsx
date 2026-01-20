import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalTimelineChart } from './GoalTimelineChart';
import type { GoalEntry } from '@/types';

// Mock dependencies
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({ 
    formatCurrency: (val: number) => `R$ ${val.toFixed(2)}`,
  }),
}));

// Mock Recharts - it doesn't work well in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => <div data-testid="line-chart" data-count={data.length}>{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: ({ y }: { y: number }) => <div data-testid="reference-line" data-y={y} />,
}));

const mockEntries: GoalEntry[] = [
  {
    id: 'entry-1',
    goal_id: 'goal-1',
    value: 500,
    description: 'First deposit',
    month: 1,
    year: 2025,
    created_at: new Date().toISOString(),
  },
  {
    id: 'entry-2',
    goal_id: 'goal-1',
    value: 750,
    description: 'Second deposit',
    month: 2,
    year: 2025,
    created_at: new Date().toISOString(),
  },
  {
    id: 'entry-3',
    goal_id: 'goal-1',
    value: 1000,
    description: 'Third deposit',
    month: 3,
    year: 2025,
    created_at: new Date().toISOString(),
  },
];

describe('GoalTimelineChart', () => {
  describe('empty state', () => {
    it('should show no entries message when entries array is empty', () => {
      render(<GoalTimelineChart entries={[]} targetValue={10000} />);
      
      expect(screen.getByText('noEntries')).toBeInTheDocument();
    });

    it('should not render chart when no entries', () => {
      render(<GoalTimelineChart entries={[]} targetValue={10000} />);
      
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('chart rendering', () => {
    it('should render chart container when entries exist', () => {
      render(<GoalTimelineChart entries={mockEntries} targetValue={10000} />);
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render line chart with correct data count', () => {
      render(<GoalTimelineChart entries={mockEntries} targetValue={10000} />);
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toHaveAttribute('data-count', '3');
    });

    it('should render chart axes', () => {
      render(<GoalTimelineChart entries={mockEntries} targetValue={10000} />);
      
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });

    it('should render reference line for target value', () => {
      render(<GoalTimelineChart entries={mockEntries} targetValue={10000} />);
      
      const refLine = screen.getByTestId('reference-line');
      expect(refLine).toHaveAttribute('data-y', '10000');
    });

    it('should render grid and tooltip', () => {
      render(<GoalTimelineChart entries={mockEntries} targetValue={10000} />);
      
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should render line element', () => {
      render(<GoalTimelineChart entries={mockEntries} targetValue={10000} />);
      
      expect(screen.getByTestId('line')).toBeInTheDocument();
    });
  });

  describe('data handling', () => {
    it('should handle single entry', () => {
      const singleEntry = [mockEntries[0]];
      render(<GoalTimelineChart entries={singleEntry} targetValue={5000} />);
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toHaveAttribute('data-count', '1');
    });

    it('should handle entries from different years', () => {
      const multiYearEntries: GoalEntry[] = [
        { ...mockEntries[0], year: 2024 },
        { ...mockEntries[1], year: 2025 },
      ];
      
      render(<GoalTimelineChart entries={multiYearEntries} targetValue={10000} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});
