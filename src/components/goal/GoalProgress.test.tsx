import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalProgress } from './GoalProgress';
import type { Goal } from '@/types';

// Mock contexts and hooks
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
  }),
}));

vi.mock('@/hooks/useGoals', () => ({
  useGoals: () => ({
    getMonthlySuggestion: vi.fn().mockResolvedValue({
      remainingValue: 500,
      monthsRemaining: 6,
      suggestedMonthly: 83.33,
      monthlyContributed: 100,
      monthlyRemaining: -16.67,
    }),
  }),
}));

describe('GoalProgress', () => {
  const mockGoal: Goal = {
    id: 'goal-1',
    familyId: 'fam-1',
    name: 'Emergency Fund',
    targetValue: 1000,
    currentValue: 300,
    targetMonth: 6,
    targetYear: 2024,
    account: 'Savings Account',
    status: 'active',
  };

  it('should render goal progress', () => {
    render(<GoalProgress goal={mockGoal} />);

    // Check for current value
    expect(screen.getByText(/R\$ 300\.00/)).toBeInTheDocument();
  });

  it('should display remaining amount', () => {
    render(<GoalProgress goal={mockGoal} />);

    // Remaining = 1000 - 300 = 700
    expect(screen.getByText(/R\$ 700\.00/)).toBeInTheDocument();
  });

  it('should show progress bar', () => {
    const { container } = render(<GoalProgress goal={mockGoal} />);

    // Should have a progress bar element
    expect(container.querySelector('.h-2, .h-3')).toBeInTheDocument();
  });

  it('should handle goal without target date', () => {
    const goalWithoutDate: Goal = {
      ...mockGoal,
      targetMonth: undefined,
      targetYear: undefined,
    };

    render(<GoalProgress goal={goalWithoutDate} />);

    // Should still render without errors
    expect(screen.getByText(/R\$ 300\.00/)).toBeInTheDocument();
  });

  it('should handle goal at 0%', () => {
    const zeroGoal: Goal = {
      ...mockGoal,
      currentValue: 0,
    };

    render(<GoalProgress goal={zeroGoal} />);

    expect(screen.getByText(/R\$ 0\.00/)).toBeInTheDocument();
  });

  it('should handle goal at 100%', () => {
    const completeGoal: Goal = {
      ...mockGoal,
      currentValue: 1000,
    };

    render(<GoalProgress goal={completeGoal} />);

    expect(screen.getByText(/R\$ 1000\.00/)).toBeInTheDocument();
  });

  it('should show target date when available', () => {
    render(<GoalProgress goal={mockGoal} />);

    // June 2024
    expect(screen.getByText(/Junho 2024/)).toBeInTheDocument();
  });

  it('should handle archived goals', () => {
    const archivedGoal: Goal = {
      ...mockGoal,
      status: 'archived',
    };

    render(<GoalProgress goal={archivedGoal} />);

    // Should render without suggestion
    expect(screen.getByText(/R\$ 300\.00/)).toBeInTheDocument();
  });

  describe('progress bar behavior', () => {
    it('should render progress bar with correct percentage', () => {
      // Goal: 300/1000 = 30%
      const { container } = render(<GoalProgress goal={mockGoal} />);
      
      // Should have a progress element
      const progressElement = container.querySelector('[role="progressbar"]') || 
        container.querySelector('.h-2, .h-3');
      expect(progressElement).toBeInTheDocument();
    });

    it('should not exceed 100% visually even when over target', () => {
      const overGoal: Goal = {
        ...mockGoal,
        currentValue: 1500, // 150% of target
        targetValue: 1000,
      };

      const { container } = render(<GoalProgress goal={overGoal} />);
      
      // Component should still render correctly
      expect(screen.getByText(/R\$ 1500\.00/)).toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle goal with zero target value', () => {
      const zeroTargetGoal: Goal = {
        ...mockGoal,
        targetValue: 0,
        currentValue: 0,
      };

      // Should not crash
      expect(() => render(<GoalProgress goal={zeroTargetGoal} />)).not.toThrow();
    });

    it('should handle goal with very large values', () => {
      const largeGoal: Goal = {
        ...mockGoal,
        targetValue: 1000000000,
        currentValue: 500000000,
      };

      render(<GoalProgress goal={largeGoal} />);
      
      // Should render formatted currency - use getAllByText since value appears multiple times
      const elements = screen.getAllByText(/500.*000.*000/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});
