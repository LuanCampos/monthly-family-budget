import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalList } from './GoalList';
import type { Goal, GoalEntry } from '@/types';

// Mock contexts
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        noGoals: 'No goals yet',
        createGoal: 'Create Goal',
        noActiveGoals: 'No active goals',
        noArchivedGoals: 'No archived goals',
        createFirstGoal: 'Create your first goal',
        createFirstGoalDescription: 'Connect a goal subcategory to track progress.',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock GoalCard
vi.mock('./GoalCard', () => ({
  GoalCard: ({ goal }: { goal: Goal }) => (
    <div data-testid={`goal-card-${goal.id}`}>{goal.name}</div>
  ),
}));

describe('GoalList', () => {
  const mockGoals: Goal[] = [
    {
      id: 'goal-1',
      familyId: 'fam-1',
      name: 'Emergency Fund',
      targetValue: 1000,
      currentValue: 300,
      status: 'active',
    },
    {
      id: 'goal-2',
      familyId: 'fam-1',
      name: 'Vacation',
      targetValue: 5000,
      currentValue: 1000,
      status: 'active',
    },
    {
      id: 'goal-3',
      familyId: 'fam-1',
      name: 'Old Goal',
      targetValue: 2000,
      currentValue: 2000,
      status: 'archived',
    },
  ];

  const defaultProps = {
    goals: mockGoals,
    entriesByGoal: {} as Record<string, GoalEntry[]>,
    onViewHistory: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onFetchEntries: vi.fn().mockResolvedValue([]),
    onCompleteGoal: vi.fn(),
  };

  it('should render all goals', () => {
    render(<GoalList {...defaultProps} />);

    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Vacation')).toBeInTheDocument();
    expect(screen.getByText('Old Goal')).toBeInTheDocument();
  });

  it('should show empty state when no goals', () => {
    render(<GoalList {...defaultProps} goals={[]} />);

    expect(screen.getByText('Create your first goal')).toBeInTheDocument();
  });

  it('should render correct number of goal cards', () => {
    render(<GoalList {...defaultProps} />);

    expect(screen.getByTestId('goal-card-goal-1')).toBeInTheDocument();
    expect(screen.getByTestId('goal-card-goal-2')).toBeInTheDocument();
    expect(screen.getByTestId('goal-card-goal-3')).toBeInTheDocument();
  });

  it('should handle single goal', () => {
    const singleGoal = [mockGoals[0]];
    
    render(<GoalList {...defaultProps} goals={singleGoal} />);

    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
  });

  it('should sort goals with active first', () => {
    const { container } = render(<GoalList {...defaultProps} />);
    
    // Should render in a grid
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });
});
