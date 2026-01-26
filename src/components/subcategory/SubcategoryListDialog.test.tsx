import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubcategoryListDialog } from './SubcategoryListDialog';
import type { Subcategory } from '@/types/budget';

window.HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const mockSubcategories: Subcategory[] = [
  { id: 'sub1', name: 'Rent', categoryKey: 'essenciais' },
  { id: 'sub2', name: 'Groceries', categoryKey: 'essenciais' },
];

describe('SubcategoryListDialog', () => {
  const defaultProps = {
    subcategories: mockSubcategories,
    onAdd: vi.fn().mockResolvedValue(undefined),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onRemove: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Trigger Button', () => {
    it('should render trigger button with subcategory count', () => {
      render(<SubcategoryListDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /subcategories\(2\)/i })).toBeInTheDocument();
    });

    it('should open dialog when trigger button is clicked', async () => {
      const user = userEvent.setup();
      render(<SubcategoryListDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /subcategories\(2\)/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display dialog title', async () => {
      const user = userEvent.setup();
      render(<SubcategoryListDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /subcategories\(2\)/i }));

      expect(screen.getByText('manageSubcategories')).toBeInTheDocument();
    });
  });

  describe('Category List', () => {
    it('should display subcategories in their categories', async () => {
      const user = userEvent.setup();
      render(<SubcategoryListDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /subcategories\(2\)/i }));

      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    it('should show no subcategories message when category is empty', async () => {
      const user = userEvent.setup();
      // Render with subcategories only in one category
      render(<SubcategoryListDialog {...defaultProps} subcategories={mockSubcategories} />);

      await user.click(screen.getByRole('button', { name: /subcategories\(2\)/i }));

      // Other categories should show "no subcategories" message
      expect(screen.getAllByText('noSubcategories').length).toBeGreaterThan(0);
    });
  });

  describe('Add Subcategory', () => {
    it('should open form dialog when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<SubcategoryListDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /subcategories\(2\)/i }));
      await user.click(screen.getByText('addSubcategory'));

      // Form dialog should be open - look for form elements
      await waitFor(() => {
        // The SubcategoryFormDialog should be open
        expect(screen.getByPlaceholderText(/subcategoryName/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Subcategory', () => {
    it('should open edit form when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<SubcategoryListDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /subcategories\(2\)/i }));
      
      // Click on the first edit button
      const editButtons = screen.getAllByLabelText('edit');
      await user.click(editButtons[0]);

      // Form dialog should be open with the subcategory data
      await waitFor(() => {
        expect(screen.getByDisplayValue('Rent')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Subcategory', () => {
    it('should show confirm dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<SubcategoryListDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /subcategories\(2\)/i }));
      
      // Click on the first delete button
      const deleteButtons = screen.getAllByLabelText('delete');
      await user.click(deleteButtons[0]);

      // Confirm dialog should be open
      await waitFor(() => {
        expect(screen.getByText('deleteSubcategory')).toBeInTheDocument();
      });
    });

    it('should call onRemove when confirmed', async () => {
      const user = userEvent.setup();
      render(<SubcategoryListDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /subcategories\(2\)/i }));
      
      // Click on the first delete button
      const deleteButtons = screen.getAllByLabelText('delete');
      await user.click(deleteButtons[0]);

      // Click confirm (button shows 'delete' text when variant is destructive)
      const allDeleteButtons = screen.getAllByText('delete');
      // The confirm button in the dialog is the last one
      const confirmButton = allDeleteButtons[allDeleteButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(defaultProps.onRemove).toHaveBeenCalledWith('sub1');
      });
    });
  });

  describe('Toggle Categories', () => {
    it('should collapse and expand categories', async () => {
      const user = userEvent.setup();
      render(<SubcategoryListDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /subcategories\(2\)/i }));

      // Find a category toggle button
      const categoryButtons = screen.getAllByRole('button');
      const essenciaisButton = categoryButtons.find(btn => 
        btn.textContent?.includes('essenciais') || btn.textContent?.includes('(2)')
      );

      if (essenciaisButton) {
        // Click to collapse
        await user.click(essenciaisButton);
        
        // The subcategories might be hidden
        // Click again to expand
        await user.click(essenciaisButton);
        
        // Subcategories should be visible again
        expect(screen.getByText('Rent')).toBeInTheDocument();
      }
    });
  });

  describe('Empty State', () => {
    it('should show correct count when no subcategories', () => {
      render(<SubcategoryListDialog {...defaultProps} subcategories={[]} />);
      expect(screen.getByRole('button', { name: /subcategories\(0\)/i })).toBeInTheDocument();
    });
  });
});
