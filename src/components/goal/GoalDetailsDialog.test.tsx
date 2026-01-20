import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalDetailsDialog } from './GoalDetailsDialog';
import type { Goal, GoalEntry } from '@/types';

// Mock dependencies
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({ 
    formatCurrency: (val: number) => `R$ ${val.toFixed(2)}`,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('./GoalTimelineChart', () => ({
  GoalTimelineChart: () => <div data-testid="goal-timeline-chart">Chart</div>,
}));

const mockGoal: Goal = {
  id: 'goal-1',
  name: 'Emergency Fund',
  target_value: 10000,
  targetValue: 10000,
  current_value: 2500,
  currentValue: 2500,
  target_date: '2025-12-31',
  family_id: 'family-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockEntries: GoalEntry[] = [
  {
    id: 'entry-1',
    goal_id: 'goal-1',
    value: 1000,
    description: 'First deposit',
    month: 1,
    year: 2025,
    created_at: new Date().toISOString(),
  },
  {
    id: 'entry-2',
    goal_id: 'goal-1',
    value: 1500,
    description: 'Second deposit',
    month: 2,
    year: 2025,
    created_at: new Date().toISOString(),
  },
];

const createDefaultProps = () => ({
  goal: mockGoal,
  entries: mockEntries,
  onFetchEntries: vi.fn().mockResolvedValue(mockEntries),
  calculateSuggestion: vi.fn().mockResolvedValue({
    remainingValue: 7500,
    monthsRemaining: 10,
    suggestedMonthly: 750,
  }),
});

describe('GoalDetailsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trigger button', () => {
    it('should render details button', () => {
      const props = createDefaultProps();
      render(<GoalDetailsDialog {...props} />);
      
      expect(screen.getByRole('button', { name: /details/i })).toBeInTheDocument();
    });

    it('should open dialog when button is clicked', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<GoalDetailsDialog {...props} />);
      await user.click(screen.getByRole('button', { name: /details/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('dialog content', () => {
    it('should show goal name as title', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<GoalDetailsDialog {...props} />);
      await user.click(screen.getByRole('button', { name: /details/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      });
    });

    it('should show current value', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<GoalDetailsDialog {...props} />);
      await user.click(screen.getByRole('button', { name: /details/i }));
      
      await waitFor(() => {
        expect(screen.getByText('R$ 2500.00')).toBeInTheDocument();
      });
    });

    it('should show target value', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<GoalDetailsDialog {...props} />);
      await user.click(screen.getByRole('button', { name: /details/i }));
      
      await waitFor(() => {
        expect(screen.getByText('R$ 10000.00')).toBeInTheDocument();
      });
    });

    it('should show remaining value', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<GoalDetailsDialog {...props} />);
      await user.click(screen.getByRole('button', { name: /details/i }));
      
      await waitFor(() => {
        // 10000 - 2500 = 7500
        expect(screen.getByText('R$ 7500.00')).toBeInTheDocument();
      });
    });

    it('should render timeline chart', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<GoalDetailsDialog {...props} />);
      await user.click(screen.getByRole('button', { name: /details/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('goal-timeline-chart')).toBeInTheDocument();
      });
    });
  });

  describe('data fetching', () => {
    it('should call onFetchEntries when dialog opens', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<GoalDetailsDialog {...props} />);
      await user.click(screen.getByRole('button', { name: /details/i }));
      
      await waitFor(() => {
        expect(props.onFetchEntries).toHaveBeenCalledTimes(1);
      });
    });
  });
});
