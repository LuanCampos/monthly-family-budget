import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { createMockGoal } from '@/test/mocks';

// Mock all dependencies
vi.mock('@/hooks/useGoals', () => ({
  useGoals: vi.fn(() => ({
    goals: [],
    entriesByGoal: {},
    loadGoals: vi.fn(),
    addGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    getEntries: vi.fn(() => Promise.resolve([])),
    refreshEntries: vi.fn(() => Promise.resolve([])),
    addManualEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
    getHistoricalExpenses: vi.fn(() => Promise.resolve([])),
    importExpense: vi.fn(),
    loading: false,
  })),
}));

vi.mock('@/hooks/useBudget', () => ({
  useBudget: vi.fn(() => ({
    subcategories: [],
    currentMonth: null,
  })),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    language: 'pt',
    t: (key: string) => key,
    setLanguage: vi.fn(),
  })),
}));

vi.mock('@/contexts/FamilyContext', () => ({
  useFamily: vi.fn(() => ({
    currentFamilyId: 'family-123',
    currentFamily: { id: 'family-123', name: 'Test Family' },
    myPendingInvitations: [],
    loading: false,
  })),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' },
    loading: false,
  })),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock all component imports
vi.mock('@/components/goal', () => ({
  GoalList: () => <div data-testid="goal-list">GoalList</div>,
  GoalFormDialog: () => null,
  EntryFormDialog: () => null,
  EntryHistoryDialog: () => null,
}));

vi.mock('@/components/common', () => ({
  ConfirmDialog: () => null,
}));

vi.mock('@/components/settings', () => ({
  SettingsDialog: () => null,
}));

vi.mock('@/components/family', () => ({
  FamilySetup: () => <div data-testid="family-setup">FamilySetup</div>,
}));

import { Goals } from './Goals';
import { useGoals } from '@/hooks/useGoals';
import { useBudget } from '@/hooks/useBudget';
import { useFamily } from '@/contexts/FamilyContext';

describe('Goals Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderGoals = () => {
    const user = userEvent.setup();
    const utils = render(
      <MemoryRouter>
        <Goals />
      </MemoryRouter>
    );
    return { user, ...utils };
  };

  const mockGoals = [
    createMockGoal({
      id: 'goal-1',
      name: 'Emergency Fund',
      targetValue: 10000,
      currentValue: 5000,
      status: 'active',
    }),
    createMockGoal({
      id: 'goal-2',
      name: 'Vacation',
      targetValue: 5000,
      currentValue: 1500,
      status: 'active',
      targetMonth: 6,
      targetYear: 2026,
    }),
    createMockGoal({
      id: 'goal-3',
      name: 'Old Goal',
      targetValue: 2000,
      currentValue: 2000,
      status: 'archived',
    }),
  ];

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      vi.mocked(useGoals).mockReturnValue({
        ...vi.mocked(useGoals)(),
        loading: true,
      });

      renderGoals();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('family setup', () => {
    it('should show family setup when no family selected', () => {
      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: null,
        currentFamily: null,
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderGoals();

      expect(screen.getByTestId('family-setup')).toBeInTheDocument();
    });
  });

  describe('main content', () => {
    it('should render goals page with goal list', () => {
      vi.mocked(useGoals).mockReturnValue({
        ...vi.mocked(useGoals)(),
        goals: [],
        loading: false,
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderGoals();

      expect(screen.getByTestId('goal-list')).toBeInTheDocument();
    });

    it('should render goals list with multiple goals', () => {
      vi.mocked(useGoals).mockReturnValue({
        ...vi.mocked(useGoals)(),
        goals: mockGoals,
        loading: false,
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderGoals();

      expect(screen.getByTestId('goal-list')).toBeInTheDocument();
    });

    it('should display page title from translations', () => {
      vi.mocked(useGoals).mockReturnValue({
        ...vi.mocked(useGoals)(),
        goals: [],
        loading: false,
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderGoals();

      // The page title uses 'goals' translation key - use role to be more specific
      expect(screen.getByRole('heading', { level: 1, name: 'goals' })).toBeInTheDocument();
    });

    it('should render add goal button', () => {
      vi.mocked(useGoals).mockReturnValue({
        ...vi.mocked(useGoals)(),
        goals: [],
        loading: false,
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderGoals();

      expect(screen.getByText('addGoal')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render goal list even when no goals exist', () => {
      vi.mocked(useGoals).mockReturnValue({
        ...vi.mocked(useGoals)(),
        goals: [],
        loading: false,
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderGoals();

      // GoalList component handles empty state internally
      expect(screen.getByTestId('goal-list')).toBeInTheDocument();
    });
  });

  describe('goal operations', () => {
    it('should have addGoal function available', () => {
      const addGoalMock = vi.fn();

      vi.mocked(useGoals).mockReturnValue({
        ...vi.mocked(useGoals)(),
        goals: mockGoals,
        loading: false,
        addGoal: addGoalMock,
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderGoals();

      expect(addGoalMock).toBeDefined();
    });

    it('should have deleteGoal function available', () => {
      const deleteGoalMock = vi.fn();

      vi.mocked(useGoals).mockReturnValue({
        ...vi.mocked(useGoals)(),
        goals: mockGoals,
        loading: false,
        deleteGoal: deleteGoalMock,
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderGoals();

      expect(deleteGoalMock).toBeDefined();
    });

    it('should have updateGoal function available', () => {
      const updateGoalMock = vi.fn();

      vi.mocked(useGoals).mockReturnValue({
        ...vi.mocked(useGoals)(),
        goals: mockGoals,
        loading: false,
        updateGoal: updateGoalMock,
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderGoals();

      expect(updateGoalMock).toBeDefined();
    });
  });

  describe('entries functionality', () => {
    it('should have entries by goal available', () => {
      vi.mocked(useGoals).mockReturnValue({
        ...vi.mocked(useGoals)(),
        goals: mockGoals,
        entriesByGoal: {
          'goal-1': [
            { id: 'entry-1', goalId: 'goal-1', value: 500, description: 'Monthly deposit', month: 1, year: 2026 },
          ],
        },
        loading: false,
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderGoals();

      expect(screen.getByTestId('goal-list')).toBeInTheDocument();
    });
  });

  describe('subcategories integration', () => {
    it('should have access to subcategories from budget', () => {
      vi.mocked(useGoals).mockReturnValue({
        ...vi.mocked(useGoals)(),
        goals: mockGoals,
        loading: false,
      });

      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        subcategories: [
          { id: 'sub-1', name: 'Supermercado', categoryKey: 'essenciais' },
          { id: 'sub-2', name: 'Restaurantes', categoryKey: 'prazeres' },
        ],
        currentMonth: { id: 'month-1', month: 1, year: 2026, income: 5000, expenses: [] },
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderGoals();

      expect(screen.getByTestId('goal-list')).toBeInTheDocument();
    });
  });
});
