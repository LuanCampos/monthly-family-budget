import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock all dependencies
vi.mock('@/hooks/useBudget', () => ({
  useBudget: vi.fn(() => ({
    months: [],
    currentMonth: null,
    currentMonthId: null,
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
  Button: ({ children, ...props }: { children: React.ReactNode }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
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
    return render(
      <MemoryRouter>
        <Budget />
      </MemoryRouter>
    );
  };

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
      const mockMonth = {
        id: 'month-123',
        month: 1,
        year: 2026,
        income: 5000,
        expenses: [],
        incomeSources: [],
      };

      vi.mocked(useBudget).mockReturnValue({
        ...vi.mocked(useBudget)(),
        months: [mockMonth],
        currentMonth: mockMonth,
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
  });
});
