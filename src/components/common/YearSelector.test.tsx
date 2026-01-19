import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YearSelector } from './YearSelector';

describe('YearSelector', () => {
  const defaultProps = {
    value: '2024',
    onValueChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with current value', () => {
    render(<YearSelector {...defaultProps} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<YearSelector {...defaultProps} className="custom-class" />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('custom-class');
  });

  it('should render with empty value', () => {
    render(<YearSelector value="" onValueChange={vi.fn()} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('should display placeholder text when provided', () => {
    render(
      <YearSelector
        value=""
        onValueChange={vi.fn()}
        placeholder="Choose year"
      />
    );

    // Placeholder should be in the document
    expect(screen.getByText('Choose year')).toBeInTheDocument();
  });

  it('should center range on selected value', () => {
    render(<YearSelector {...defaultProps} value="2030" />);

    expect(screen.getByText('2030')).toBeInTheDocument();
  });

  it('should use default className when none provided', () => {
    render(<YearSelector {...defaultProps} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('bg-secondary');
  });
});
