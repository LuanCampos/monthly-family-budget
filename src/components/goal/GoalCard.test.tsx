import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalCard } from './GoalCard';
import type { Goal, GoalEntry } from '@/types';

// Mock contexts
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        notSpecified: 'Not specified',
        targetValue: 'Target',
        goalStatusArchived: 'Archived',
        goalMarkComplete: 'Mark Complete',
        evolution: 'Evolution',
        history: 'History',
        edit: 'Edit',
        delete: 'Delete',
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

// Mock child components
vi.mock('./GoalProgress', () => ({
  GoalProgress: ({ goal }: { goal: Goal }) => (
    <div data-testid="goal-progress">Progress: {goal.currentValue}/{goal.targetValue}</div>
  ),
}));

vi.mock('./GoalTimelineChart', () => ({
  GoalTimelineChart: () => <div data-testid="goal-timeline">Timeline Chart</div>,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('GoalCard', () => {
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

  const mockEntries: GoalEntry[] = [
    {
      id: 'entry-1',
      goalId: 'goal-1',
      value: 100,
      month: 1,
      year: 2024,
      description: 'First deposit',
    },
  ];

  const defaultProps = {
    goal: mockGoal,
    entries: mockEntries,
    onViewHistory: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onFetchEntries: vi.fn().mockResolvedValue(mockEntries),
    onCompleteGoal: vi.fn(),
  };

  it('should render goal name', () => {
    render(<GoalCard {...defaultProps} />);

    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
  });

  it('should display target value', () => {
    render(<GoalCard {...defaultProps} />);

    expect(screen.getByText('R$ 1000.00')).toBeInTheDocument();
  });

  it('should display account name', () => {
    render(<GoalCard {...defaultProps} />);

    expect(screen.getByText('Savings Account')).toBeInTheDocument();
  });

  it('should render goal progress component', () => {
    render(<GoalCard {...defaultProps} />);

    expect(screen.getByTestId('goal-progress')).toBeInTheDocument();
  });

  it('should show archived badge for non-active goals', () => {
    const archivedGoal = { ...mockGoal, status: 'archived' as const };
    
    render(<GoalCard {...defaultProps} goal={archivedGoal} />);

    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('should show complete button when goal is complete and active', () => {
    const completeGoal = { ...mockGoal, currentValue: 1000 };
    
    render(<GoalCard {...defaultProps} goal={completeGoal} />);

    expect(screen.getByText('Mark Complete')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    
    render(<GoalCard {...defaultProps} onEdit={onEdit} />);

    // Find and click edit button by aria-label
    const editButton = screen.getByRole('button', { name: 'Edit' });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    
    render(<GoalCard {...defaultProps} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onViewHistory when entries button is clicked', async () => {
    const user = userEvent.setup();
    const onViewHistory = vi.fn();
    
    render(<GoalCard {...defaultProps} onViewHistory={onViewHistory} />);

    const entriesButton = screen.getByRole('button', { name: 'entries' });
    await user.click(entriesButton);

    expect(onViewHistory).toHaveBeenCalledTimes(1);
  });

  it('should show not specified for account when not provided', () => {
    const goalWithoutAccount = { ...mockGoal, account: undefined };
    
    render(<GoalCard {...defaultProps} goal={goalWithoutAccount} />);

    expect(screen.getByText('Not specified')).toBeInTheDocument();
  });

  it('should call onCompleteGoal when complete button is clicked', async () => {
    const user = userEvent.setup();
    const onCompleteGoal = vi.fn();
    const completeGoal = { ...mockGoal, currentValue: 1000 };
    
    render(<GoalCard {...defaultProps} goal={completeGoal} onCompleteGoal={onCompleteGoal} />);

    const completeButton = screen.getByText('Mark Complete');
    await user.click(completeButton);

    expect(onCompleteGoal).toHaveBeenCalledTimes(1);
  });
});
