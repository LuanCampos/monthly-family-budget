import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
import { useFamily } from '@/contexts/FamilyContext';

describe('Goals Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderGoals = () => {
    return render(
      <MemoryRouter>
        <Goals />
      </MemoryRouter>
    );
  };

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

    it('should render goals list with goals', () => {
      const mockGoals = [
        {
          id: 'goal-1',
          name: 'Emergency Fund',
          targetValue: 10000,
          currentValue: 5000,
          status: 'active' as const,
        },
      ];

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
  });
});
