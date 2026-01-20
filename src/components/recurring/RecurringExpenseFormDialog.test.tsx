import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurringExpenseFormDialog } from './RecurringExpenseFormDialog';
import type { RecurringExpense, Subcategory } from '@/types';

// Mock dependencies
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({ currencySymbol: 'R$' }),
}));

vi.mock('@/lib/utils/formatters', () => ({
  parseCurrencyInput: vi.fn((val: string) => parseFloat(val.replace(',', '.')) || 0),
  formatCurrencyInput: vi.fn((val: number) => val.toFixed(2).replace('.', ',')),
  sanitizeCurrencyInput: vi.fn((val: string) => val),
}));

vi.mock('./RecurringExpenseFormFields', () => ({
  RecurringExpenseFormFields: ({
    title,
    onTitleChange,
    value,
    onValueChange,
  }: {
    title: string;
    onTitleChange: (v: string) => void;
    value: string;
    onValueChange: (v: string) => void;
  }) => (
    <div data-testid="form-fields">
      <input 
        data-testid="title-input"
        value={title} 
        onChange={(e) => onTitleChange(e.target.value)} 
        placeholder="Title"
      />
      <input 
        data-testid="value-input"
        value={value} 
        onChange={(e) => onValueChange(e.target.value)} 
        placeholder="Value"
      />
    </div>
  ),
}));

const mockSubcategories: Subcategory[] = [
  {
    id: 'subcat-1',
    name: 'Test Subcategory',
    category: 'housing',
    family_id: 'family-1',
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockExpense: RecurringExpense = {
  id: 'recurring-1',
  title: 'Monthly Rent',
  category: 'housing',
  subcategoryId: 'subcat-1',
  value: 1500,
  dueDay: 5,
  hasInstallments: false,
  family_id: 'family-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const createDefaultProps = () => ({
  open: true,
  onOpenChange: vi.fn(),
  expense: null as RecurringExpense | null,
  subcategories: mockSubcategories,
  defaultMonth: 1,
  defaultYear: 2025,
  onAdd: vi.fn().mockResolvedValue(undefined),
  onUpdate: vi.fn().mockResolvedValue(undefined),
});

describe('RecurringExpenseFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dialog rendering', () => {
    it('should render when open is true', () => {
      const props = createDefaultProps();
      render(<RecurringExpenseFormDialog {...props} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show add title when creating new expense', () => {
      const props = createDefaultProps();
      render(<RecurringExpenseFormDialog {...props} />);
      
      expect(screen.getByText('newRecurringExpense')).toBeInTheDocument();
    });

    it('should show edit title when editing expense', () => {
      const props = createDefaultProps();
      props.expense = mockExpense;
      
      render(<RecurringExpenseFormDialog {...props} />);
      
      expect(screen.getByText('editRecurringExpense')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const props = createDefaultProps();
      props.open = false;
      
      render(<RecurringExpenseFormDialog {...props} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('should render form fields component', () => {
      const props = createDefaultProps();
      render(<RecurringExpenseFormDialog {...props} />);
      
      expect(screen.getByTestId('form-fields')).toBeInTheDocument();
    });

    it('should populate fields when editing', () => {
      const props = createDefaultProps();
      props.expense = mockExpense;
      
      render(<RecurringExpenseFormDialog {...props} />);
      
      expect(screen.getByTestId('title-input')).toHaveValue('Monthly Rent');
    });

    it('should have empty fields when creating new', () => {
      const props = createDefaultProps();
      render(<RecurringExpenseFormDialog {...props} />);
      
      expect(screen.getByTestId('title-input')).toHaveValue('');
    });
  });

  describe('form actions', () => {
    it('should have save/add button', () => {
      const props = createDefaultProps();
      render(<RecurringExpenseFormDialog {...props} />);
      
      // Button shows 'add' when creating new expense
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    it('should have cancel button', () => {
      const props = createDefaultProps();
      render(<RecurringExpenseFormDialog {...props} />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onOpenChange(false) when cancel is clicked', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<RecurringExpenseFormDialog {...props} />);
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(props.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('add expense', () => {
    it('should call onAdd when form is submitted with new expense', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<RecurringExpenseFormDialog {...props} />);
      
      await user.type(screen.getByTestId('title-input'), 'New Expense');
      await user.type(screen.getByTestId('value-input'), '100');
      await user.click(screen.getByRole('button', { name: /add/i }));
      
      await waitFor(() => {
        expect(props.onAdd).toHaveBeenCalled();
      });
    });

    it('should close dialog after adding', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<RecurringExpenseFormDialog {...props} />);
      
      await user.type(screen.getByTestId('title-input'), 'New Expense');
      await user.type(screen.getByTestId('value-input'), '100');
      await user.click(screen.getByRole('button', { name: /add/i }));
      
      await waitFor(() => {
        expect(props.onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('edit expense', () => {
    it('should show update confirmation dialog when editing', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      props.expense = mockExpense;
      
      render(<RecurringExpenseFormDialog {...props} />);
      
      await user.click(screen.getByRole('button', { name: /save/i }));
      
      await waitFor(() => {
        expect(screen.getByText('updateRecurringTitle')).toBeInTheDocument();
      });
    });
  });
});
