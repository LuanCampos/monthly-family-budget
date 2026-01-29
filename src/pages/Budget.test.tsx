import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { forwardRef } from 'react';
import { makeMockMonth } from '@/test/mocks/domain/makeMockMonth';
import { makeMockExpense } from '@/test/mocks/domain/makeMockExpense';
import { makeMockFamily } from '@/test/mocks/domain/makeMockFamily';

// Mock all dependencies
vi.mock('@/hooks/useBudget', () => ({
  useBudget: vi.fn(() => ({
    months: [makeMockMonth()],
    currentMonth: makeMockMonth(),
    currentMonthId: makeMockMonth().id,
    recurringExpenses: [],
    subcategories: [],
    loading: false,
    hasInitialized: true,
    addMonth: vi.fn(),
    selectMonth: vi.fn(),
    addExpense: vi.fn(),
    removeExpense: vi.fn(),
    updateExpense: vi.fn(),
    confirmPayment: vi.fn(),
    addRecurringExpense: vi.fn(),
    removeRecurringExpense: vi.fn(),
    updateRecurringExpense: vi.fn(),
    applyRecurringToCurrentMonth: vi.fn(),
    addSubcategory: vi.fn(),
    updateSubcategory: vi.fn(),
    removeSubcategory: vi.fn(),
    getCategorySummary: vi.fn(() => ({})),
    getTotals: vi.fn(() => ({ totalSpent: 0, totalBudget: 0, usedPercentage: 0 })),
    removeMonth: vi.fn(),
    currentMonthLimits: {},
    updateMonthLimits: vi.fn(),
    addIncomeSource: vi.fn(),
    updateIncomeSource: vi.fn(),
    deleteIncomeSource: vi.fn(),
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
    currentFamilyId: makeMockFamily().id,
    currentFamily: makeMockFamily(),
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

vi.mock('@/lib/storage/secureStorage', () => ({
  getSecureStorageItem: vi.fn(() => null),
  setSecureStorageItem: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }>(
    ({ children, ...props }, ref) => <button ref={ref} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} {...props} />
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock all component imports
vi.mock('@/components/month', () => ({
  MonthSelector: () => <div data-testid="month-selector">MonthSelector</div>,
}));

vi.mock('@/components/income', () => ({
  IncomeInput: () => <div data-testid="income-input">IncomeInput</div>,
  IncomeSourceListDialog: () => null,
}));

vi.mock('@/components/expense', () => ({
  ExpenseChart: () => <div data-testid="expense-chart">ExpenseChart</div>,
  ExpenseFormDialog: () => null,
  ExpenseList: () => <div data-testid="expense-list">ExpenseList</div>,
}));

vi.mock('@/components/subcategory', () => ({
  SubcategoryChart: () => null,
  SubcategoryListDialog: () => null,
}));

vi.mock('@/components/common', () => ({
  CategoryLegend: () => null,
  SummaryTable: () => <div data-testid="summary-table">SummaryTable</div>,
  LimitsPanel: () => null,
  AnnualViewChart: () => null,
  OnlineStatusBar: () => null,
}));

vi.mock('@/components/recurring', () => ({
  RecurringExpensesPanel: () => <div data-testid="recurring-panel">RecurringExpensesPanel</div>,
}));

vi.mock('@/components/settings', () => ({
  SettingsDialog: () => null,
}));

vi.mock('@/components/family', () => ({
  FamilySetup: () => <div data-testid="family-setup">FamilySetup</div>,
}));

import { Budget } from './Budget';
import { useBudget } from '@/hooks/useBudget';
import { useFamily } from '@/contexts/FamilyContext';

describe('Budget Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderBudget = () => {
    const user = userEvent.setup();
    const utils = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Budget />
      </MemoryRouter>
    );
    return { user, ...utils };
  };

  const mockMonthWithExpenses = makeMockMonth({
    id: 'month-123',
    expenses: [
      makeMockExpense({ id: 'exp-1', title: 'Aluguel', category: 'essenciais', value: 1500, isPending: false }),
      makeMockExpense({ id: 'exp-2', title: 'Netflix', category: 'prazeres', value: 45, isPending: true }),
      makeMockExpense({ id: 'exp-3', title: 'Supermercado', category: 'essenciais', value: 800, isPending: false }),
    ],
  });

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        loading: true,
        hasInitialized: false,
      });

      renderBudget();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no months exist', () => {
      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        months: [],
        loading: false,
        hasInitialized: true,
      });

      renderBudget();

      expect(screen.getByText('emptyStateTitle')).toBeInTheDocument();
      expect(screen.getByTestId('month-selector')).toBeInTheDocument();
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

      renderBudget();

      expect(screen.getByTestId('family-setup')).toBeInTheDocument();
    });
  });

  describe('main content', () => {
    it('should render main budget content when month exists', () => {


      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        months: [makeMockMonth()],
        currentMonth: makeMockMonth(),
        currentMonthId: 'month-123',
        loading: false,
        hasInitialized: true,
        getCategorySummary: () => [],
        getTotals: () => ({ totalSpent: 0, totalBudget: 5000, usedPercentage: 0 }),
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderBudget();

      expect(screen.getByTestId('month-selector')).toBeInTheDocument();
    });

    it('should display budget totals correctly', () => {
      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        months: [mockMonthWithExpenses],
        currentMonth: mockMonthWithExpenses,
        currentMonthId: 'month-123',
        loading: false,
        hasInitialized: true,
        getCategorySummary: () => [
          {
            key: 'essenciais',
            name: 'essenciais',
            percentage: 46,
            budget: 2300,
            spent: 2300,
            remaining: 0,
            usedPercentage: 100,
            color: 'hsl(187, 85%, 53%)',
          },
          {
            key: 'prazeres',
            name: 'prazeres',
            percentage: 0.9,
            budget: 45,
            spent: 45,
            remaining: 0,
            usedPercentage: 100,
            color: 'hsl(291, 64%, 42%)',
          },
        ],
        getTotals: () => ({ totalSpent: 2345, totalBudget: 5000, usedPercentage: 46.9 }),
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderBudget();

      // Should render chart and summary table
      expect(screen.getByTestId('expense-chart')).toBeInTheDocument();
      expect(screen.getByTestId('summary-table')).toBeInTheDocument();
    });

    it('should render expense list when month has expenses', () => {
      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        months: [mockMonthWithExpenses],
        currentMonth: mockMonthWithExpenses,
        currentMonthId: 'month-123',
        loading: false,
        hasInitialized: true,
        getCategorySummary: () => [],
        getTotals: () => ({ totalSpent: 2345, totalBudget: 5000, usedPercentage: 46.9 }),
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderBudget();

      expect(screen.getByTestId('expense-list')).toBeInTheDocument();
    });

    it('should render recurring panel', () => {
      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        months: [mockMonthWithExpenses],
        currentMonth: mockMonthWithExpenses,
        currentMonthId: 'month-123',
        recurringExpenses: [
          { id: 'rec-1', title: 'Netflix', category: 'prazeres', value: 45, isRecurring: true, dueDay: 10 },
        ],
        loading: false,
        hasInitialized: true,
        getCategorySummary: () => [],
        getTotals: () => ({ totalSpent: 2345, totalBudget: 5000, usedPercentage: 46.9 }),
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderBudget();

      expect(screen.getByTestId('recurring-panel')).toBeInTheDocument();
    });

    it('should render income input component', () => {
      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        months: [mockMonthWithExpenses],
        currentMonth: mockMonthWithExpenses,
        currentMonthId: 'month-123',
        loading: false,
        hasInitialized: true,
        getCategorySummary: () => [],
        getTotals: () => ({ totalSpent: 0, totalBudget: 5000, usedPercentage: 0 }),
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderBudget();

      expect(screen.getByTestId('income-input')).toBeInTheDocument();
    });
  });

  describe('pending invitations', () => {
    it('should show notification badge when user has pending invitations', () => {
      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        months: [mockMonthWithExpenses],
        currentMonth: mockMonthWithExpenses,
        currentMonthId: 'month-123',
        loading: false,
        hasInitialized: true,
        getCategorySummary: () => [],
        getTotals: () => ({ totalSpent: 0, totalBudget: 5000, usedPercentage: 0 }),
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [
          { id: 'inv-1', family_id: 'family-456', invited_email: 'test@example.com', status: 'pending' },
          { id: 'inv-2', family_id: 'family-789', invited_email: 'test@example.com', status: 'pending' },
        ],
        loading: false,
      } as unknown as ReturnType<typeof useFamily>);

      renderBudget();

      // Should show the count of pending invitations
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('app title', () => {
    it('should display app title from translations', () => {
      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        months: [mockMonthWithExpenses],
        currentMonth: mockMonthWithExpenses,
        currentMonthId: 'month-123',
        loading: false,
        hasInitialized: true,
        getCategorySummary: () => [],
        getTotals: () => ({ totalSpent: 0, totalBudget: 5000, usedPercentage: 0 }),
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderBudget();

      expect(screen.getByText('appTitle')).toBeInTheDocument();
    });
  });

  describe('waiting for month auto-selection', () => {
    it('should show loading spinner when months exist but currentMonthId not set', () => {


      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        months: [makeMockMonth()],
        currentMonth: null,
        currentMonthId: null,
        loading: false,
        hasInitialized: true,
        getCategorySummary: () => [],
        getTotals: () => ({ totalSpent: 0, totalBudget: 5000, usedPercentage: 0 }),
      });

      vi.mocked(useFamily).mockReturnValue({
        currentFamilyId: 'family-123',
        currentFamily: { id: 'family-123', name: 'Test Family' },
        myPendingInvitations: [],
        loading: false,
      } as ReturnType<typeof useFamily>);

      renderBudget();

      // Should show loading spinner while waiting for auto-selection
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
});
