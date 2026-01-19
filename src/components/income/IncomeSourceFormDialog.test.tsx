import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomeSourceFormDialog } from './IncomeSourceFormDialog';

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
  })),
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) => 
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => 
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: { children: React.ReactNode }) => <label {...props}>{children}</label>,
}));

describe('IncomeSourceFormDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render dialog when open', () => {
      render(<IncomeSourceFormDialog {...defaultProps} />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      render(<IncomeSourceFormDialog {...defaultProps} open={false} />);
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should show add title for new income source', () => {
      render(<IncomeSourceFormDialog {...defaultProps} />);
      
      expect(screen.getByText('addIncomeSource')).toBeInTheDocument();
    });

    it('should show edit title when editing', () => {
      const incomeSource = { id: '1', name: 'Salary', value: 5000, monthId: 'month-1' };
      
      render(<IncomeSourceFormDialog {...defaultProps} incomeSource={incomeSource} />);
      
      expect(screen.getByText('editIncomeSource')).toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('should populate fields when editing', () => {
      const incomeSource = { id: '1', name: 'Salary', value: 5000, monthId: 'month-1' };
      
      render(<IncomeSourceFormDialog {...defaultProps} incomeSource={incomeSource} />);
      
      const nameInput = screen.getByPlaceholderText('incomeSourceNamePlaceholder');
      expect(nameInput).toHaveValue('Salary');
    });

    it('should have empty fields for new income source', () => {
      render(<IncomeSourceFormDialog {...defaultProps} />);
      
      const nameInput = screen.getByPlaceholderText('incomeSourceNamePlaceholder');
      expect(nameInput).toHaveValue('');
    });
  });

  describe('interaction', () => {
    it('should call onOpenChange when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      
      render(<IncomeSourceFormDialog {...defaultProps} onOpenChange={onOpenChange} />);
      
      const cancelButton = screen.getByText('cancel');
      await user.click(cancelButton);
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should disable save button when form is invalid', () => {
      render(<IncomeSourceFormDialog {...defaultProps} />);
      
      const saveButton = screen.getByText('save');
      expect(saveButton).toBeDisabled();
    });
  });
});
