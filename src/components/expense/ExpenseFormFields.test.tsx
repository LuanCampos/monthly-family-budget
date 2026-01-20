import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseFormFields, ExpenseFormFieldsRef } from './ExpenseFormFields';
import { createRef } from 'react';
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

describe('ExpenseFormFields', () => {
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<ExpenseFormFields {...defaultProps} />);
      
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Subcategory')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('should render currency symbol', () => {
      render(<ExpenseFormFields {...defaultProps} />);
      expect(screen.getByText('R$')).toBeInTheDocument();
    });

    it('should display initial values', () => {
      render(
        <ExpenseFormFields 
          {...defaultProps} 
          title="Test expense"
          value="100,00"
        />
      );
      
      expect(screen.getByDisplayValue('Test expense')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100,00')).toBeInTheDocument();
    });
  });

  describe('Title Input', () => {
    it('should call onTitleChange when title is entered', async () => {
      const user = userEvent.setup();
      const onTitleChange = vi.fn();
      render(<ExpenseFormFields {...defaultProps} onTitleChange={onTitleChange} />);
      
      const input = screen.getByLabelText(/description/i);
      await user.type(input, 'Rent payment');
      
      expect(onTitleChange).toHaveBeenCalled();
    });
  });

  describe('Value Input', () => {
    it('should call onValueChange when value is entered', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<ExpenseFormFields {...defaultProps} onValueChange={onValueChange} />);
      
      const inputs = screen.getAllByRole('textbox');
      const valueInput = inputs.find(input => input.getAttribute('inputmode') === 'decimal');
      if (valueInput) {
        await user.type(valueInput, '100');
        expect(onValueChange).toHaveBeenCalled();
      }
    });
  });

  describe('Ref Methods', () => {
    it('should expose applyPendingSum method via ref', () => {
      const ref = createRef<ExpenseFormFieldsRef>();
      render(<ExpenseFormFields {...defaultProps} ref={ref} />);
      
      expect(ref.current).toBeDefined();
      expect(ref.current?.applyPendingSum).toBeInstanceOf(Function);
    });
  });
});
