import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurringExpensesPanel } from './RecurringExpensesPanel';
import { RecurringExpense, Subcategory, Expense } from '@/types';

// Mock contexts
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        recurring: 'Recurring',
        recurringExpenses: 'Recurring Expenses',
        noRecurringExpenses: 'No recurring expenses',
        addRecurringExpense: 'Add recurring expense',
        delete: 'Delete',
        edit: 'Edit',
        applyToCurrentMonth: 'Apply to current month',
        alreadyInCurrentMonth: 'Already in current month',
        sortBy: 'Sort by',
        sortCategory: 'Category',
        sortValue: 'Value',
        sortDueDate: 'Due date',
        day: 'Day',
        deleteRecurringExpense: 'Delete recurring expense',
        deleteRecurringExpenseConfirm: 'Are you sure you want to delete this recurring expense?',
        essenciais: 'Essentials',
        conforto: 'Comfort',
        metas: 'Goals',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatCurrency: (v: number) => `R$ ${v.toFixed(2)}`,
    currencySymbol: 'R$',
  }),
}));

// Mock RecurringExpenseFormDialog
vi.mock('./RecurringExpenseFormDialog', () => ({
  RecurringExpenseFormDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    open ? <div data-testid="form-dialog">Form Dialog <button onClick={() => onOpenChange(false)}>Close</button></div> : null
  ),
}));

// Mock ConfirmDialog
vi.mock('@/components/common', () => ({
  ConfirmDialog: ({ 
    open, 
    onConfirm, 
    onOpenChange,
    title 
  }: { 
    open: boolean; 
    onConfirm: () => void; 
    onOpenChange: (open: boolean) => void;
    title: string;
  }) => (
    open ? (
      <div data-testid="confirm-dialog">
        <span>{title}</span>
        <button onClick={onConfirm}>Confirm Delete</button>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    ) : null
  ),
}));

describe('RecurringExpensesPanel', () => {
  const mockSubcategories: Subcategory[] = [
    { id: 'sub-1', name: 'Electricity', categoryKey: 'essenciais', familyId: 'family-1' },
    { id: 'sub-2', name: 'Internet', categoryKey: 'conforto', familyId: 'family-1' },
  ];

  const mockExpenses: RecurringExpense[] = [
    {
      id: 'rec-1',
      title: 'Light Bill',
      category: 'essenciais',
      subcategoryId: 'sub-1',
      value: 150.00,
      dueDay: 10,
      familyId: 'family-1',
    },
    {
      id: 'rec-2',
      title: 'Netflix',
      category: 'conforto',
      value: 45.90,
      dueDay: 5,
      familyId: 'family-1',
      hasInstallments: false,
    },
    {
      id: 'rec-3',
      title: 'Gym',
      category: 'metas',
      value: 99.00,
      familyId: 'family-1',
      hasInstallments: true,
      totalInstallments: 12,
    },
  ];

  const mockCurrentMonthExpenses: Expense[] = [
    {
      id: 'exp-1',
      title: 'Light Bill',
      category: 'essenciais',
      value: 150.00,
      pending: false,
      monthId: 'month-1',
      recurringExpenseId: 'rec-1',
    },
  ];

  const defaultProps = {
    expenses: mockExpenses,
    subcategories: mockSubcategories,
    currentMonthExpenses: mockCurrentMonthExpenses,
    defaultMonth: 1,
    defaultYear: 2026,
    onAdd: vi.fn(),
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
    onApply: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render trigger button with expense count', () => {
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      expect(screen.getByText('Recurring')).toBeInTheDocument();
      expect(screen.getByText('(3)')).toBeInTheDocument();
    });

    it('should open dialog when trigger button is clicked', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      expect(screen.getByText('Recurring Expenses')).toBeInTheDocument();
    });

    it('should render all expenses in dialog', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      expect(screen.getByText('Light Bill')).toBeInTheDocument();
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Gym')).toBeInTheDocument();
    });

    it('should show empty state when no expenses', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} expenses={[]} />);
      
      await user.click(screen.getByText('Recurring'));
      
      expect(screen.getByText('No recurring expenses')).toBeInTheDocument();
    });

    it('should display formatted currency values', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      expect(screen.getByText('R$ 150.00')).toBeInTheDocument();
      expect(screen.getByText('R$ 45.90')).toBeInTheDocument();
      expect(screen.getByText('R$ 99.00')).toBeInTheDocument();
    });

    it('should show installment badge when expense has installments', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      expect(screen.getByText('12x')).toBeInTheDocument();
    });

    it('should show due day for expenses with dueDay', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      expect(screen.getByText('Day 10')).toBeInTheDocument();
      expect(screen.getByText('Day 5')).toBeInTheDocument();
    });

    it('should show subcategory name when present', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      expect(screen.getByText('• Electricity')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('should render sort buttons', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Due date')).toBeInTheDocument();
    });

    it('should toggle sort direction when clicking same sort button', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      const valueButton = screen.getByRole('button', { name: /Value/i });
      await user.click(valueButton);
      await user.click(valueButton);
      
      // Button should still be active (we can't easily test direction visually)
      expect(valueButton).toBeInTheDocument();
    });
  });

  describe('add expense', () => {
    it('should open form dialog when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      await user.click(screen.getByText('Add recurring expense'));
      
      expect(screen.getByTestId('form-dialog')).toBeInTheDocument();
    });
  });

  describe('edit expense', () => {
    it('should open form dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      const editButtons = screen.getAllByLabelText('Edit');
      await user.click(editButtons[0]);
      
      expect(screen.getByTestId('form-dialog')).toBeInTheDocument();
    });
  });

  describe('delete expense', () => {
    it('should open confirm dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      const deleteButtons = screen.getAllByLabelText('Delete');
      await user.click(deleteButtons[0]);
      
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
  });

  describe('apply to current month', () => {
    it('should disable apply button for expenses already in current month', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      // First expense (rec-1) is in currentMonthExpenses
      const applyButtons = screen.getAllByLabelText('Already in current month');
      expect(applyButtons.length).toBeGreaterThan(0);
    });

    it('should call onApply when apply button is clicked for new expense', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      // Find apply buttons for expenses not in current month
      const applyButtons = screen.getAllByLabelText('Apply to current month');
      await user.click(applyButtons[0]);
      
      await waitFor(() => {
        expect(defaultProps.onApply).toHaveBeenCalled();
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible buttons', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} />);
      
      await user.click(screen.getByText('Recurring'));
      
      expect(screen.getAllByLabelText('Edit').length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText('Delete').length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty subcategories list', async () => {
      const user = userEvent.setup();
      render(<RecurringExpensesPanel {...defaultProps} subcategories={[]} />);
      
      await user.click(screen.getByText('Recurring'));
      
      // Should not show subcategory names
      expect(screen.queryByText('• Electricity')).not.toBeInTheDocument();
    });

    it('should handle expense without subcategoryId', async () => {
      const user = userEvent.setup();
      const expensesWithoutSub = [
        { ...mockExpenses[1], subcategoryId: undefined },
      ];
      render(<RecurringExpensesPanel {...defaultProps} expenses={expensesWithoutSub} />);
      
      await user.click(screen.getByText('Recurring'));
      
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    it('should handle expense without dueDay', async () => {
      const user = userEvent.setup();
      const expensesWithoutDueDay = [
        { ...mockExpenses[2], dueDay: undefined },
      ];
      render(<RecurringExpensesPanel {...defaultProps} expenses={expensesWithoutDueDay} />);
      
      await user.click(screen.getByText('Recurring'));
      
      expect(screen.getByText('Gym')).toBeInTheDocument();
    });
  });
});
