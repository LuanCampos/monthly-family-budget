import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurringExpenseFormFields } from './RecurringExpenseFormFields';
import type { Subcategory, CategoryKey } from '@/types/budget';

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
        essenciais: 'Essentials',
        conforto: 'Comfort',
        metas: 'Goals',
        prazeres: 'Pleasures',
        liberdade: 'Financial Freedom',
        conhecimento: 'Knowledge',
        hasInstallments: 'Installments',
        totalInstallments: 'Total installments',
        startMonth: 'Start month',
        startYear: 'Start year',
        dueDay: 'Due day',
        isTotalValue: 'Enter total value',
        totalValue: 'Total value',
        monthlyValueCalculation: 'Monthly value',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    currencySymbol: 'R$',
    formatCurrency: (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`,
  }),
}));

import { makeMockSubcategory } from '@/test/mocks/domain/makeMockSubcategory';

const mockSubcategories: Subcategory[] = [
  makeMockSubcategory({ id: 'sub1', name: 'Rent' }),
  makeMockSubcategory({ id: 'sub2', name: 'Groceries' }),
];

describe('RecurringExpenseFormFields', () => {
  const defaultProps = {
    title: '',
    category: 'essenciais' as CategoryKey,
    subcategoryId: '',
    value: '',
    subcategories: mockSubcategories,
    onTitleChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onSubcategoryChange: vi.fn(),
    onValueChange: vi.fn(),
    hasInstallments: false,
    onHasInstallmentsChange: vi.fn(),
    totalInstallments: '1',
    onTotalInstallmentsChange: vi.fn(),
    startMonth: '1',
    onStartMonthChange: vi.fn(),
    startYear: '2026',
    onStartYearChange: vi.fn(),
    dueDay: '1',
    onDueDayChange: vi.fn(),
    isTotalValue: false,
    onIsTotalValueChange: vi.fn(),
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

    it('should not show installment fields when hasInstallments is false', () => {
      render(<RecurringExpenseFormFields {...defaultProps} hasInstallments={false} />);
      
      expect(screen.queryByText('totalInstallments')).not.toBeInTheDocument();
    });

    it('should not show total value toggle when hasInstallments is false', () => {
      render(<RecurringExpenseFormFields {...defaultProps} hasInstallments={false} />);
      
      expect(screen.queryByText('Enter total value')).not.toBeInTheDocument();
    });

    it('should show total value toggle when hasInstallments is true', () => {
      render(<RecurringExpenseFormFields {...defaultProps} hasInstallments={true} />);
      
      expect(screen.getByText('Enter total value')).toBeInTheDocument();
    });

    it('should call onIsTotalValueChange when toggle is clicked', async () => {
      const user = userEvent.setup();
      const onIsTotalValueChange = vi.fn();
      render(
        <RecurringExpenseFormFields 
          {...defaultProps} 
          hasInstallments={true} 
          onIsTotalValueChange={onIsTotalValueChange} 
        />
      );
      
      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      expect(onIsTotalValueChange).toHaveBeenCalledWith(true);
    });

    it('should show monthly value calculation when isTotalValue is true and totalInstallments > 0', () => {
      render(
        <RecurringExpenseFormFields 
          {...defaultProps} 
          hasInstallments={true}
          isTotalValue={true}
          value="1200,00"
          totalInstallments="12"
        />
      );
      
      expect(screen.getByTestId('monthly-calculation')).toBeInTheDocument();
      expect(screen.getByText(/Monthly value/)).toBeInTheDocument();
    });

    it('should change value label to Total value when isTotalValue is true', () => {
      render(
        <RecurringExpenseFormFields 
          {...defaultProps} 
          hasInstallments={true}
          isTotalValue={true}
        />
      );
      
      expect(screen.getByText('Total value')).toBeInTheDocument();
      expect(screen.queryByText('Value')).not.toBeInTheDocument();
    });

    it('should show Monthly value label when hasInstallments is true and isTotalValue is false', () => {
      render(
        <RecurringExpenseFormFields 
          {...defaultProps} 
          hasInstallments={true}
          isTotalValue={false}
        />
      );
      
      expect(screen.getByText('Monthly value')).toBeInTheDocument();
    });

    it('should show Value label when hasInstallments is false', () => {
      render(
        <RecurringExpenseFormFields 
          {...defaultProps} 
          hasInstallments={false}
          isTotalValue={false}
        />
      );
      
      expect(screen.getByText('Value')).toBeInTheDocument();
    });
  });
});
