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
    hasInstallments,
    onHasInstallmentsChange,
    totalInstallments,
    onTotalInstallmentsChange,
    isTotalValue,
    onIsTotalValueChange,
  }: {
    title: string;
    onTitleChange: (v: string) => void;
    value: string;
    onValueChange: (v: string) => void;
    hasInstallments: boolean;
    onHasInstallmentsChange: (v: boolean) => void;
    totalInstallments: string;
    onTotalInstallmentsChange: (v: string) => void;
    isTotalValue: boolean;
    onIsTotalValueChange: (v: boolean) => void;
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
      <label>
        <input
          data-testid="has-installments-checkbox"
          type="checkbox"
          checked={hasInstallments}
          onChange={(e) => onHasInstallmentsChange(e.target.checked)}
        />
        Has Installments
      </label>
      <input
        data-testid="total-installments-input"
        type="number"
        value={totalInstallments}
        onChange={(e) => onTotalInstallmentsChange(e.target.value)}
        placeholder="Total Installments"
      />
      <label>
        <input
          data-testid="is-total-value-checkbox"
          type="checkbox"
          checked={isTotalValue}
          onChange={(e) => onIsTotalValueChange(e.target.checked)}
        />
        Is Total Value
      </label>
    </div>
  ),
}));

import { makeMockRecurringExpense } from '@/test/mocks/domain/makeMockRecurringExpense';
import { makeMockSubcategory } from '@/test/mocks/domain/makeMockSubcategory';

const mockSubcategories: Subcategory[] = [makeMockSubcategory()];
const mockExpense: RecurringExpense = makeMockRecurringExpense();

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

  describe('total value calculation', () => {
    it('should divide value by installments when isTotalValue is true on submit', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<RecurringExpenseFormDialog {...props} />);
      
      // Fill in title
      await user.type(screen.getByTestId('title-input'), 'New Expense');
      
      // Enable installments first
      await user.click(screen.getByTestId('has-installments-checkbox'));
      
      // Set total installments to 12
      const installmentsInput = screen.getByTestId('total-installments-input');
      await user.clear(installmentsInput);
      await user.type(installmentsInput, '12');
      
      // Enable "is total value" checkbox BEFORE entering value
      await user.click(screen.getByTestId('is-total-value-checkbox'));
      
      // Now enter the total value of 1200
      await user.type(screen.getByTestId('value-input'), '1200');
      
      // Submit the form
      await user.click(screen.getByRole('button', { name: /add/i }));
      
      await waitFor(() => {
        expect(props.onAdd).toHaveBeenCalled();
        // Value should be 1200 / 12 = 100
        const calledWith = props.onAdd.mock.calls[0];
        expect(calledWith[3]).toBe(100); // 4th argument is the value
      });
    });

    it('should not divide value when isTotalValue is false', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<RecurringExpenseFormDialog {...props} />);
      
      // Fill in title and value
      await user.type(screen.getByTestId('title-input'), 'New Expense');
      await user.type(screen.getByTestId('value-input'), '100');
      
      // Enable installments but NOT isTotalValue
      await user.click(screen.getByTestId('has-installments-checkbox'));
      
      const installmentsInput = screen.getByTestId('total-installments-input');
      await user.clear(installmentsInput);
      await user.type(installmentsInput, '12');
      
      // Submit the form (isTotalValue is false by default)
      await user.click(screen.getByRole('button', { name: /add/i }));
      
      await waitFor(() => {
        expect(props.onAdd).toHaveBeenCalled();
        // Value should remain 100 (not divided)
        const calledWith = props.onAdd.mock.calls[0];
        expect(calledWith[3]).toBe(100);
      });
    });

    it('should recalculate value when toggling isTotalValue from false to true', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<RecurringExpenseFormDialog {...props} />);
      
      // Fill in title
      await user.type(screen.getByTestId('title-input'), 'New Expense');
      
      // Enable installments first
      await user.click(screen.getByTestId('has-installments-checkbox'));
      
      // Set installments to 12
      const installmentsInput = screen.getByTestId('total-installments-input');
      await user.clear(installmentsInput);
      await user.type(installmentsInput, '12');
      
      // Enter monthly value of 100
      await user.type(screen.getByTestId('value-input'), '100');
      
      // Toggle to total value - should multiply by 12
      await user.click(screen.getByTestId('is-total-value-checkbox'));
      
      // Value should now be 1200 (100 * 12)
      expect(screen.getByTestId('value-input')).toHaveValue('1200,00');
    });

    it('should recalculate value when toggling isTotalValue from true to false', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<RecurringExpenseFormDialog {...props} />);
      
      // Fill in title
      await user.type(screen.getByTestId('title-input'), 'New Expense');
      
      // Enable installments first
      await user.click(screen.getByTestId('has-installments-checkbox'));
      
      // Set installments to 12
      const installmentsInput = screen.getByTestId('total-installments-input');
      await user.clear(installmentsInput);
      await user.type(installmentsInput, '12');
      
      // Toggle to total value first
      await user.click(screen.getByTestId('is-total-value-checkbox'));
      
      // Enter total value of 1200
      await user.type(screen.getByTestId('value-input'), '1200');
      
      // Toggle back to monthly value - should divide by 12
      await user.click(screen.getByTestId('is-total-value-checkbox'));
      
      // Value should now be 100 (1200 / 12)
      expect(screen.getByTestId('value-input')).toHaveValue('100,00');
    });
  });
});
