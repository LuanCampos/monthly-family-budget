import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurringExpenseFormFields } from './RecurringExpenseFormFields';
import type { Subcategory } from '@/types/budget';

window.HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        expenseTitle: 'Description',
        expenseCategory: 'Category',
        expenseSubcategory: 'Subcategory',
        expenseValue: 'Value',
        noSubcategory: 'No subcategory',
        selectCategory: 'Select category',
        selectSubcategory: 'Select subcategory',
        housing: 'Housing',
        food: 'Food',
        transportation: 'Transportation',
        utilities: 'Utilities',
        healthcare: 'Healthcare',
        entertainment: 'Entertainment',
        education: 'Education',
        clothing: 'Clothing',
        personal: 'Personal',
        savings: 'Savings',
        liberdade: 'Financial Freedom',
        other: 'Other',
        hasInstallments: 'Installments',
        totalInstallments: 'Total installments',
        startMonth: 'Start month',
        startYear: 'Start year',
        dueDay: 'Due day',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    currencySymbol: 'R$',
  }),
}));

const mockSubcategories: Subcategory[] = [
  { id: 'sub1', name: 'Rent', categoryKey: 'housing' },
  { id: 'sub2', name: 'Groceries', categoryKey: 'food' },
];

describe('RecurringExpenseFormFields', () => {
  const defaultProps = {
    title: '',
    category: 'housing' as const,
    subcategoryId: '',
    value: '',
    subcategories: mockSubcategories,
    onTitleChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onSubcategoryChange: vi.fn(),
    onValueChange: vi.fn(),
    isInstallment: false,
    onIsInstallmentChange: vi.fn(),
    totalInstallments: 1,
    onTotalInstallmentsChange: vi.fn(),
    startMonth: 1,
    onStartMonthChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all basic form fields', () => {
      render(<RecurringExpenseFormFields {...defaultProps} />);
      
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Subcategory')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('should render currency symbol', () => {
      render(<RecurringExpenseFormFields {...defaultProps} />);
      expect(screen.getByText('R$')).toBeInTheDocument();
    });

    it('should render installment checkbox', () => {
      render(<RecurringExpenseFormFields {...defaultProps} />);
      expect(screen.getByText('Installments')).toBeInTheDocument();
    });
  });

  describe('Title Input', () => {
    it('should call onTitleChange when title is entered', async () => {
      const user = userEvent.setup();
      const onTitleChange = vi.fn();
      render(<RecurringExpenseFormFields {...defaultProps} onTitleChange={onTitleChange} />);
      
      const input = screen.getByLabelText(/description/i);
      await user.type(input, 'Netflix');
      
      expect(onTitleChange).toHaveBeenCalled();
    });
  });

  describe('Installments Section', () => {
    it('should show installment checkbox', () => {
      render(<RecurringExpenseFormFields {...defaultProps} />);
      
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should not show installment fields when isInstallment is false', () => {
      render(<RecurringExpenseFormFields {...defaultProps} isInstallment={false} />);
      
      expect(screen.queryByText('totalInstallments')).not.toBeInTheDocument();
    });
  });
});
