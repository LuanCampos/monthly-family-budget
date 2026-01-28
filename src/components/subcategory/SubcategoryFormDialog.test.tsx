import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubcategoryFormDialog } from './SubcategoryFormDialog';
import { Subcategory } from '@/types';

// Mock scrollIntoView for Radix Select
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        addSubcategory: 'Add Subcategory',
        editSubcategory: 'Edit Subcategory',
        name: 'Name',
        subcategoryName: 'Subcategory name',
        category: 'Category',
        cancel: 'Cancel',
        save: 'Save',
        saving: 'Saving...',
        essenciais: 'Essentials',
        conforto: 'Comfort',
        metas: 'Goals',
        prazeres: 'Pleasures',
        liberdade: 'Freedom',
        conhecimento: 'Knowledge',
      };
      return translations[key] || key;
    },
  }),
}));

describe('SubcategoryFormDialog', () => {
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
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      expect(screen.getByText('Add Subcategory')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      render(<SubcategoryFormDialog {...defaultProps} open={false} />);
      
      expect(screen.queryByText('Add Subcategory')).not.toBeInTheDocument();
    });

    it('should render name input field', () => {
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Subcategory name')).toBeInTheDocument();
    });

    it('should render category select in add mode', () => {
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
    });

    it('should render cancel and save buttons', () => {
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  describe('add mode', () => {
    it('should show "Add Subcategory" title when not editing', () => {
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      expect(screen.getByText('Add Subcategory')).toBeInTheDocument();
    });

    it('should start with empty name field', () => {
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      const input = screen.getByLabelText('Name') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should use defaultCategory when provided', async () => {
      render(<SubcategoryFormDialog {...defaultProps} defaultCategory="conforto" />);
      
      // The select should show Comfort
      expect(screen.getByText('Comfort')).toBeInTheDocument();
    });

    it('should show category selector in add mode', () => {
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    const mockSubcategory: Subcategory = {
      id: 'sub-1',
      name: 'Electricity',
      categoryKey: 'essenciais',
    };

    it('should show "Edit Subcategory" title when editing', () => {
      render(<SubcategoryFormDialog {...defaultProps} subcategory={mockSubcategory} />);
      
      expect(screen.getByText('Edit Subcategory')).toBeInTheDocument();
    });

    it('should populate name field with existing value', () => {
      render(<SubcategoryFormDialog {...defaultProps} subcategory={mockSubcategory} />);
      
      const input = screen.getByLabelText('Name') as HTMLInputElement;
      expect(input.value).toBe('Electricity');
    });

    it('should hide category selector in edit mode', () => {
      render(<SubcategoryFormDialog {...defaultProps} subcategory={mockSubcategory} />);
      
      expect(screen.queryByLabelText('Category')).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should call onSave with name and category when save is clicked', async () => {
      const user = userEvent.setup();
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      await user.type(screen.getByLabelText('Name'), 'New Subcategory');
      await user.click(screen.getByText('Save'));
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('New Subcategory', 'essenciais');
    });

    it('should trim whitespace from name', async () => {
      const user = userEvent.setup();
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      await user.type(screen.getByLabelText('Name'), '  Trimmed Name  ');
      await user.click(screen.getByText('Save'));
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('Trimmed Name', 'essenciais');
    });

    it('should not submit with empty name', async () => {
      const user = userEvent.setup();
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      await user.click(screen.getByText('Save'));
      
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('should not submit with whitespace-only name', async () => {
      const user = userEvent.setup();
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      await user.type(screen.getByLabelText('Name'), '   ');
      await user.click(screen.getByText('Save'));
      
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('should close dialog after successful save', async () => {
      const user = userEvent.setup();
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      await user.type(screen.getByLabelText('Name'), 'Test');
      await user.click(screen.getByText('Save'));
      
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should submit on Enter key', async () => {
      const user = userEvent.setup();
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      const input = screen.getByLabelText('Name');
      await user.type(input, 'Keyboard Submit');
      await user.keyboard('{Enter}');
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('Keyboard Submit', 'essenciais');
    });
  });

  describe('cancel', () => {
    it('should call onOpenChange(false) when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      await user.click(screen.getByText('Cancel'));
      
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('category selection', () => {
    it('should allow changing category', async () => {
      const user = userEvent.setup();
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      // Open the select
      await user.click(screen.getByRole('combobox'));
      
      // Select Comfort
      await user.click(screen.getByText('Comfort'));
      
      // Now submit
      await user.type(screen.getByLabelText('Name'), 'Test');
      await user.click(screen.getByText('Save'));
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('Test', 'conforto');
    });
  });

  describe('saving state', () => {
    it('should disable save button while saving', async () => {
      const user = userEvent.setup();
      const slowSave = vi.fn((): Promise<void> => new Promise(resolve => setTimeout(resolve, 100)));
      render(<SubcategoryFormDialog {...defaultProps} onSave={slowSave} />);
      
      await user.type(screen.getByLabelText('Name'), 'Test');
      await user.click(screen.getByText('Save'));
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable cancel button while saving', async () => {
      const user = userEvent.setup();
      const slowSave = vi.fn((): Promise<void> => new Promise(resolve => setTimeout(resolve, 100)));
      render(<SubcategoryFormDialog {...defaultProps} onSave={slowSave} />);
      
      await user.type(screen.getByLabelText('Name'), 'Test');
      await user.click(screen.getByText('Save'));
      
      expect(screen.getByText('Cancel')).toBeDisabled();
    });
  });

  describe('form reset on open', () => {
    it('should reset form when dialog opens in add mode', async () => {
      const { rerender } = render(<SubcategoryFormDialog {...defaultProps} open={false} />);
      
      rerender(<SubcategoryFormDialog {...defaultProps} open={true} />);
      
      const input = screen.getByLabelText('Name') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('accessibility', () => {
    it('should have accessible labels', () => {
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
    });

    it('should autofocus name input', () => {
      render(<SubcategoryFormDialog {...defaultProps} />);
      
      const input = screen.getByLabelText('Name');
      expect(input).toHaveFocus();
    });
  });

  describe('edge cases', () => {
    it('should handle null subcategory', () => {
      render(<SubcategoryFormDialog {...defaultProps} subcategory={null} />);
      
      expect(screen.getByText('Add Subcategory')).toBeInTheDocument();
    });

    it('should handle async onSave that resolves', async () => {
      const user = userEvent.setup();
      const asyncSave = vi.fn().mockResolvedValue(undefined);
      render(<SubcategoryFormDialog {...defaultProps} onSave={asyncSave} />);
      
      await user.type(screen.getByLabelText('Name'), 'Async Test');
      await user.click(screen.getByText('Save'));
      
      expect(asyncSave).toHaveBeenCalled();
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should handle async onSave that rejects', async () => {
      const user = userEvent.setup();
      const asyncSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      render(<SubcategoryFormDialog {...defaultProps} onSave={asyncSave} />);
      
      await user.type(screen.getByLabelText('Name'), 'Failing Test');
      
      // Should not throw
      await expect(user.click(screen.getByText('Save'))).resolves.not.toThrow();
    });
  });
});
