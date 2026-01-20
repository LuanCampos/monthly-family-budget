import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { forwardRef } from 'react';
import { ExpenseFormDialog } from './ExpenseFormDialog';

// Mock dependencies
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    language: 'pt',
    t: (key: string) => key,
  })),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: vi.fn(() => ({
    currency: 'BRL',
    currencySymbol: 'R$',
    formatCurrency: (v: number) => `R$ ${v.toFixed(2)}`,
  })),
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) => 
    open !== false ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-trigger">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => 
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (v: boolean) => void }) => 
    <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} data-testid="checkbox" />,
}));

vi.mock('./ExpenseFormFields', () => ({
  ExpenseFormFields: forwardRef<HTMLDivElement, {
    title: string;
    value: string;
    onTitleChange: (v: string) => void;
    onValueChange: (v: string) => void;
  }>(({ title, value, onTitleChange, onValueChange }, ref) => (
    <div data-testid="expense-form-fields" ref={ref}>
      <input 
        data-testid="title-input" 
        value={title} 
        onChange={(e) => onTitleChange(e.target.value)} 
        placeholder="title"
      />
      <input 
        data-testid="value-input" 
        value={value} 
        onChange={(e) => onValueChange(e.target.value)} 
        placeholder="value"
      />
    </div>
  )),
}));

describe('ExpenseFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('edit mode', () => {
    it('should open dialog automatically in edit mode with initial data', () => {
      const initialData = {
        id: 'expense-1',
        title: 'Test Expense',
        category: 'housing' as const,
        value: 100,
        isPending: false,
      };

      render(
        <ExpenseFormDialog 
          mode="edit" 
          subcategories={[]} 
          initialData={initialData}
          onUpdate={vi.fn()}
        />
      );

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('should render form fields in edit mode', () => {
      const initialData = {
        id: 'expense-1',
        title: 'Test Expense',
        category: 'housing' as const,
        value: 100,
        isPending: true,
      };

      render(
        <ExpenseFormDialog 
          mode="edit" 
          subcategories={[]} 
          initialData={initialData}
          onUpdate={vi.fn()}
        />
      );

      expect(screen.getByTestId('expense-form-fields')).toBeInTheDocument();
    });

    it('should show pending checkbox in edit mode for recurring expenses', () => {
      const initialData = {
        id: 'expense-1',
        title: 'Test Expense',
        category: 'housing' as const,
        value: 100,
        isRecurring: true,
        isPending: true,
      };

      render(
        <ExpenseFormDialog 
          mode="edit" 
          subcategories={[]} 
          initialData={initialData}
          onUpdate={vi.fn()}
        />
      );

      expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    });
  });
});
