import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

// Mock LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        cancel: 'Cancel',
        delete: 'Delete',
        confirm: 'Confirm',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('should display default cancel and delete labels for destructive variant', () => {
    render(<ConfirmDialog {...defaultProps} variant="destructive" />);
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should display default confirm label for non-destructive variants', () => {
    render(<ConfirmDialog {...defaultProps} variant="default" />);
    
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('should display custom labels when provided', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Yes, proceed"
        cancelLabel="No, go back"
      />
    );
    
    expect(screen.getByText('Yes, proceed')).toBeInTheDocument();
    expect(screen.getByText('No, go back')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    
    await user.click(screen.getByText('Delete'));
    
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenChange with false when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);
    
    await user.click(screen.getByText('Cancel'));
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should disable buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Delete')).toBeDisabled();
  });

  it('should render warning variant correctly', () => {
    render(<ConfirmDialog {...defaultProps} variant="warning" />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    // Confirm button should be present for warning variant
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('should render default variant correctly', () => {
    render(<ConfirmDialog {...defaultProps} variant="default" />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('should handle async onConfirm', async () => {
    const user = userEvent.setup();
    const asyncConfirm = vi.fn().mockResolvedValue(undefined);
    
    render(<ConfirmDialog {...defaultProps} onConfirm={asyncConfirm} />);
    
    await user.click(screen.getByText('Delete'));
    
    await waitFor(() => {
      expect(asyncConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
