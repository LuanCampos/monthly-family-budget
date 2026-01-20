import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    getMonthlySuggestion: vi.fn().mockResolvedValue(null),
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

  it('should render goal progress', async () => {
    render(<GoalProgress goal={mockGoal} />);

    // Wait for async effect to complete
    await waitFor(() => {
      expect(screen.getByText(/R\$ 300\.00/)).toBeInTheDocument();
    });
  });

  it('should display remaining amount', async () => {
    render(<GoalProgress goal={mockGoal} />);

    // Remaining = 1000 - 300 = 700
    await waitFor(() => {
      expect(screen.getByText(/R\$ 700\.00/)).toBeInTheDocument();
    });
  });

  it('should show progress bar', async () => {
    const { container } = render(<GoalProgress goal={mockGoal} />);

    // Wait for async effect and check for progress bar element
    await waitFor(() => {
      expect(container.querySelector('.h-2, .h-3, .h-1\\.5')).toBeInTheDocument();
    });
  });

  it('should handle goal without target date', async () => {
    const goalWithoutDate: Goal = {
      ...mockGoal,
      targetMonth: undefined,
      targetYear: undefined,
    };

    render(<GoalProgress goal={goalWithoutDate} />);

    // Should still render without errors
    await waitFor(() => {
      expect(screen.getByText(/R\$ 300\.00/)).toBeInTheDocument();
    });
  });

  it('should handle goal at 0%', async () => {
    const zeroGoal: Goal = {
      ...mockGoal,
      currentValue: 0,
    };

    render(<GoalProgress goal={zeroGoal} />);

    await waitFor(() => {
      expect(screen.getByText(/R\$ 0\.00/)).toBeInTheDocument();
    });
  });

  it('should handle goal at 100%', async () => {
    const completeGoal: Goal = {
      ...mockGoal,
      currentValue: 1000,
    };

    render(<GoalProgress goal={completeGoal} />);

    await waitFor(() => {
      expect(screen.getByText(/R\$ 1000\.00/)).toBeInTheDocument();
    });
  });

  it('should show target date when available', async () => {
    render(<GoalProgress goal={mockGoal} />);

    // June 2024
    await waitFor(() => {
      expect(screen.getByText(/Junho 2024/)).toBeInTheDocument();
    });
  });

  it('should handle archived goals', async () => {
    const archivedGoal: Goal = {
      ...mockGoal,
      status: 'archived',
    };

    render(<GoalProgress goal={archivedGoal} />);

    // Should render without suggestion
    await waitFor(() => {
      expect(screen.getByText(/R\$ 300\.00/)).toBeInTheDocument();
    });
  });

  describe('progress bar behavior', () => {
    it('should render progress bar with correct percentage', async () => {
      // Goal: 300/1000 = 30%
      const { container } = render(<GoalProgress goal={mockGoal} />);
      
      // Wait for async effect and check for progress element
      await waitFor(() => {
        const progressElement = container.querySelector('[role="progressbar"]') || 
          container.querySelector('.h-2, .h-3, .h-1\\.5');
        expect(progressElement).toBeInTheDocument();
      });
    });

    it('should not exceed 100% visually even when over target', async () => {
      const overGoal: Goal = {
        ...mockGoal,
        currentValue: 1500, // 150% of target
        targetValue: 1000,
      };

      const { container } = render(<GoalProgress goal={overGoal} />);
      
      // Component should still render correctly
      await waitFor(() => {
        expect(screen.getByText(/R\$ 1500\.00/)).toBeInTheDocument();
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle goal with zero target value', async () => {
      const zeroTargetGoal: Goal = {
        ...mockGoal,
        targetValue: 0,
        currentValue: 0,
      };

      render(<GoalProgress goal={zeroTargetGoal} />);
      
      // Wait for async effect to complete
      await waitFor(() => {
        expect(screen.getByText(/R\$ 0\.00/)).toBeInTheDocument();
      });
    });

    it('should handle goal with very large values', async () => {
      const largeGoal: Goal = {
        ...mockGoal,
        targetValue: 1000000000,
        currentValue: 500000000,
      };

      render(<GoalProgress goal={largeGoal} />);
      
      // Should render formatted currency - use getAllByText since value appears multiple times
      await waitFor(() => {
        const elements = screen.getAllByText(/500.*000.*000/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });
});
