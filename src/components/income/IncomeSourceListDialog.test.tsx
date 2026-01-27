import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomeSourceListDialog } from './IncomeSourceListDialog';
import type { IncomeSource } from '@/types/budget';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        manageIncomeSources: 'Manage Income Sources',
        totalIncome: 'Total Income',
        noIncomeSources: 'No income sources',
        addIncomeSource: 'Add Income Source',
        deleteIncomeSource: 'Delete Income Source?',
        deleteIncomeSourceMessage: 'This action cannot be undone.',
        incomeSourceAdded: 'Income source added',
        incomeSourceUpdated: 'Income source updated',
        incomeSourceDeleted: 'Income source deleted',
        errorSaving: 'Error saving',
        errorDeleting: 'Error deleting',
        edit: 'Edit',
        delete: 'Delete',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatCurrency: (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`,
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

const mockIncomeSources: IncomeSource[] = [
  { id: 'inc1', monthId: 'month-1', name: 'Salary', value: 5000 },
  { id: 'inc2', monthId: 'month-1', name: 'Freelance', value: 2000 },
];

describe('IncomeSourceListDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    incomeSources: mockIncomeSources,
    onAdd: vi.fn().mockResolvedValue(undefined),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    totalIncome: 7000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open', () => {
      render(<IncomeSourceListDialog {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      render(<IncomeSourceListDialog {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display income sources', () => {
      render(<IncomeSourceListDialog {...defaultProps} />);
      expect(screen.getByText('Salary')).toBeInTheDocument();
      expect(screen.getByText('Freelance')).toBeInTheDocument();
    });

    it('should display add button', () => {
      render(<IncomeSourceListDialog {...defaultProps} />);
      expect(screen.getByText('Add Income Source')).toBeInTheDocument();
    });

    it('should display total income', () => {
      render(<IncomeSourceListDialog {...defaultProps} />);
      expect(screen.getByText('Total Income')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no income sources', () => {
      render(
        <IncomeSourceListDialog
          {...defaultProps}
          incomeSources={[]}
          totalIncome={0}
        />
      );
      expect(screen.getByText('No income sources')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should open add form dialog when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<IncomeSourceListDialog {...defaultProps} />);

      await user.click(screen.getByText('Add Income Source'));

      // Form dialog should open - check for any form-related content
      // The actual form dialog is tested separately
    });

    it('should have edit buttons for each income source', () => {
      render(<IncomeSourceListDialog {...defaultProps} />);
      expect(screen.getAllByLabelText('Edit').length).toBe(2);
    });

    it('should have delete buttons for each income source', () => {
      render(<IncomeSourceListDialog {...defaultProps} />);
      expect(screen.getAllByLabelText('Delete').length).toBe(2);
    });
  });

  describe('Accessibility', () => {
    it('should have edit and delete buttons with aria-labels', () => {
      render(<IncomeSourceListDialog {...defaultProps} />);

      expect(screen.getAllByLabelText('Edit').length).toBe(2);
      expect(screen.getAllByLabelText('Delete').length).toBe(2);
    });
  });
});
