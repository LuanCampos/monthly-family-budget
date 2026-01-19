import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomeInput } from './IncomeInput';

// Mock contexts
vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    currencySymbol: 'R$',
  }),
}));

// Mock formatters
vi.mock('@/lib/utils/formatters', () => ({
  formatCurrencyInput: (value: number) => value.toFixed(2).replace('.', ','),
}));

describe('IncomeInput', () => {
  const defaultProps = {
    value: 1500,
    onEditClick: vi.fn(),
    disabled: false,
  };

  it('should render income value', () => {
    render(<IncomeInput {...defaultProps} />);

    expect(screen.getByText('1500,00')).toBeInTheDocument();
  });

  it('should display currency symbol', () => {
    render(<IncomeInput {...defaultProps} />);

    expect(screen.getByText('R$')).toBeInTheDocument();
  });

  it('should render edit button', () => {
    render(<IncomeInput {...defaultProps} />);

    const editButton = screen.getByRole('button');
    expect(editButton).toBeInTheDocument();
  });

  it('should call onEditClick when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEditClick = vi.fn();
    
    render(<IncomeInput {...defaultProps} onEditClick={onEditClick} />);

    const editButton = screen.getByRole('button');
    await user.click(editButton);

    expect(onEditClick).toHaveBeenCalledTimes(1);
  });

  it('should disable edit button when disabled prop is true', () => {
    render(<IncomeInput {...defaultProps} disabled={true} />);

    const editButton = screen.getByRole('button');
    expect(editButton).toBeDisabled();
  });

  it('should update display when value changes', () => {
    const { rerender } = render(<IncomeInput {...defaultProps} value={1000} />);

    expect(screen.getByText('1000,00')).toBeInTheDocument();

    rerender(<IncomeInput {...defaultProps} value={2000} />);

    expect(screen.getByText('2000,00')).toBeInTheDocument();
  });

  it('should handle zero value', () => {
    render(<IncomeInput {...defaultProps} value={0} />);

    expect(screen.getByText('0,00')).toBeInTheDocument();
  });

  it('should handle decimal values', () => {
    render(<IncomeInput {...defaultProps} value={1234.56} />);

    expect(screen.getByText('1234,56')).toBeInTheDocument();
  });
});
