import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GoalMonthlySuggestion } from './GoalMonthlySuggestion';
import type { Goal } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        loading: 'Loading',
        goalCompleted: 'Goal completed!',
        monthlyContributionSuggestion: 'Monthly contribution suggestion',
        goalRemaining: 'Remaining',
        deadline: 'Deadline',
        month: 'month',
        months: 'months',
        suggestedMonthlyContribution: 'Suggested monthly contribution',
        thisMonthRemaining: 'Still remaining this month',
        contributed: 'contributed',
        goal: 'goal',
        thisMonthComplete: 'This month goal reached!',
        setTargetDateForSuggestion: 'Set a target date to see monthly suggestion',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatCurrency: (value: number) => `$${value.toFixed(2)}`,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const mockGoal: Goal = {
  id: 'goal-1',
  familyId: 'family-1',
  name: 'Vacation',
  targetValue: 5000,
  currentValue: 2000,
  targetMonth: 12,
  targetYear: 2025,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('GoalMonthlySuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    const calculateSuggestion = vi.fn().mockImplementation(() => new Promise(() => {}));
    
    render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show goal completed when remainingValue is 0', async () => {
    const calculateSuggestion = vi.fn().mockResolvedValue({
      remainingValue: 0,
      monthsRemaining: null,
      suggestedMonthly: null,
      monthlyContributed: null,
      monthlyRemaining: null,
    });
    
    render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Goal completed!')).toBeInTheDocument();
    });
  });

  it('should show goal completed when remainingValue is negative', async () => {
    const calculateSuggestion = vi.fn().mockResolvedValue({
      remainingValue: -100,
      monthsRemaining: null,
      suggestedMonthly: null,
      monthlyContributed: null,
      monthlyRemaining: null,
    });
    
    render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Goal completed!')).toBeInTheDocument();
    });
  });

  it('should show remaining value and deadline with months', async () => {
    const calculateSuggestion = vi.fn().mockResolvedValue({
      remainingValue: 3000,
      monthsRemaining: 6,
      suggestedMonthly: 500,
      monthlyContributed: 0,
      monthlyRemaining: 500,
    });
    
    render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('$3000.00')).toBeInTheDocument();
      expect(screen.getByText('6 months')).toBeInTheDocument();
    });
  });

  it('should show singular month when 1 month remaining', async () => {
    const calculateSuggestion = vi.fn().mockResolvedValue({
      remainingValue: 500,
      monthsRemaining: 1,
      suggestedMonthly: 500,
      monthlyContributed: 0,
      monthlyRemaining: 500,
    });
    
    render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('1 month')).toBeInTheDocument();
    });
  });

  it('should show suggested monthly contribution', async () => {
    const calculateSuggestion = vi.fn().mockResolvedValue({
      remainingValue: 3000,
      monthsRemaining: 6,
      suggestedMonthly: 500,
      monthlyContributed: 100,
      monthlyRemaining: 400,
    });
    
    render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
      expect(screen.getByText('Suggested monthly contribution')).toBeInTheDocument();
    });
  });

  it('should show this month remaining when there is remaining', async () => {
    const calculateSuggestion = vi.fn().mockResolvedValue({
      remainingValue: 3000,
      monthsRemaining: 6,
      suggestedMonthly: 500,
      monthlyContributed: 100,
      monthlyRemaining: 400,
    });
    
    render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Still remaining this month')).toBeInTheDocument();
      expect(screen.getByText('$400.00')).toBeInTheDocument();
    });
  });

  it('should show this month complete when monthlyRemaining is 0', async () => {
    const calculateSuggestion = vi.fn().mockResolvedValue({
      remainingValue: 2500,
      monthsRemaining: 5,
      suggestedMonthly: 500,
      monthlyContributed: 500,
      monthlyRemaining: 0,
    });
    
    render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('This month goal reached!')).toBeInTheDocument();
    });
  });

  it('should show message to set target date when no deadline', async () => {
    const calculateSuggestion = vi.fn().mockResolvedValue({
      remainingValue: 3000,
      monthsRemaining: null,
      suggestedMonthly: null,
      monthlyContributed: null,
      monthlyRemaining: null,
    });
    
    render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Set a target date to see monthly suggestion')).toBeInTheDocument();
    });
  });

  it('should handle error in calculateSuggestion', async () => {
    const { logger } = await import('@/lib/logger');
    const calculateSuggestion = vi.fn().mockRejectedValue(new Error('Failed'));
    
    render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith(
        'goal.calculateSuggestion.failed',
        expect.objectContaining({ goalId: 'goal-1' })
      );
    });
  });

  it('should handle null suggestion', async () => {
    const calculateSuggestion = vi.fn().mockResolvedValue(null);
    
    render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Goal completed!')).toBeInTheDocument();
    });
  });

  it('should recalculate when goal currentValue changes', async () => {
    const calculateSuggestion = vi.fn().mockResolvedValue({
      remainingValue: 3000,
      monthsRemaining: 6,
      suggestedMonthly: 500,
      monthlyContributed: 0,
      monthlyRemaining: 500,
    });
    
    const { rerender } = render(
      <GoalMonthlySuggestion 
        goal={mockGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(calculateSuggestion).toHaveBeenCalledTimes(1);
    });
    
    const updatedGoal = { ...mockGoal, currentValue: 2500 };
    rerender(
      <GoalMonthlySuggestion 
        goal={updatedGoal} 
        calculateSuggestion={calculateSuggestion} 
      />
    );
    
    await waitFor(() => {
      expect(calculateSuggestion).toHaveBeenCalledTimes(2);
    });
  });
});
