import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  { id: 'sub1', name: 'Rent', categoryKey: 'housing' },
  { id: 'sub2', name: 'Groceries', categoryKey: 'food' },
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
});
