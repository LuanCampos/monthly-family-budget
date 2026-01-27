import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportExpenseDialog } from './ImportExpenseDialog';
import type { Expense, CategoryKey } from '@/types';

// Mock dependencies
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({ 
    formatCurrency: (val: number) => `R$ ${val.toFixed(2)}`,
  }),
}));

const mockExpenses: Expense[] = [
  {
    id: 'expense-1',
    title: 'Gym subscription',
    category: 'metas' as CategoryKey,
    value: 100,
    isRecurring: false,
    isPending: false,
    month: 1,
    year: 2025,
    subcategoryId: 'subcat-1',
  },
  {
    id: 'expense-2',
    title: 'Gym annual fee',
    category: 'metas' as CategoryKey,
    value: 250,
    isRecurring: false,
    isPending: false,
    month: 2,
    year: 2025,
    subcategoryId: 'subcat-1',
  },
];

const createDefaultProps = () => ({
  trigger: <button data-testid="trigger-button">Open Import</button>,
  subcategoryId: 'subcat-1',
  fetchExpenses: vi.fn().mockResolvedValue(mockExpenses),
  onImport: vi.fn().mockResolvedValue(undefined),
});

describe('ImportExpenseDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trigger', () => {
    it('should render trigger element', () => {
      const props = createDefaultProps();
      render(<ImportExpenseDialog {...props} />);
      
      expect(screen.getByTestId('trigger-button')).toBeInTheDocument();
    });

    it('should open dialog when trigger is clicked', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<ImportExpenseDialog {...props} />);
      await user.click(screen.getByTestId('trigger-button'));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('dialog rendering', () => {
    it('should show dialog title', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<ImportExpenseDialog {...props} />);
      await user.click(screen.getByTestId('trigger-button'));
      
      await waitFor(() => {
        expect(screen.getByText('historicalExpenses')).toBeInTheDocument();
      });
    });

    it('should call fetchExpenses when opened', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<ImportExpenseDialog {...props} />);
      await user.click(screen.getByTestId('trigger-button'));
      
      await waitFor(() => {
        expect(props.fetchExpenses).toHaveBeenCalledWith('subcat-1');
      });
    });
  });

  describe('empty state', () => {
    it('should show empty message when no expenses', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      props.fetchExpenses = vi.fn().mockResolvedValue([]);
      
      render(<ImportExpenseDialog {...props} />);
      await user.click(screen.getByTestId('trigger-button'));
      
      await waitFor(() => {
        expect(screen.getByText('noHistoricalExpenses')).toBeInTheDocument();
      });
    });
  });

  describe('expense list', () => {
    it('should display expense titles', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<ImportExpenseDialog {...props} />);
      await user.click(screen.getByTestId('trigger-button'));
      
      await waitFor(() => {
        expect(screen.getByText('Gym subscription')).toBeInTheDocument();
        expect(screen.getByText('Gym annual fee')).toBeInTheDocument();
      });
    });

    it('should display expense values', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<ImportExpenseDialog {...props} />);
      await user.click(screen.getByTestId('trigger-button'));
      
      await waitFor(() => {
        expect(screen.getByText('R$ 100.00')).toBeInTheDocument();
        expect(screen.getByText('R$ 250.00')).toBeInTheDocument();
      });
    });

    it('should have import buttons for each expense', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<ImportExpenseDialog {...props} />);
      await user.click(screen.getByTestId('trigger-button'));
      
      await waitFor(() => {
        const importButtons = screen.getAllByRole('button', { name: /import/i });
        expect(importButtons.length).toBe(2);
      });
    });
  });

  describe('import action', () => {
    it('should call onImport when import button is clicked', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<ImportExpenseDialog {...props} />);
      await user.click(screen.getByTestId('trigger-button'));
      
      await waitFor(() => {
        expect(screen.getByText('Gym subscription')).toBeInTheDocument();
      });
      
      const importButtons = screen.getAllByRole('button', { name: /import/i });
      await user.click(importButtons[0]);
      
      await waitFor(() => {
        expect(props.onImport).toHaveBeenCalledWith('expense-1');
      });
    });

    it('should refresh expense list after import', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<ImportExpenseDialog {...props} />);
      await user.click(screen.getByTestId('trigger-button'));
      
      await waitFor(() => {
        expect(screen.getByText('Gym subscription')).toBeInTheDocument();
      });
      
      const importButtons = screen.getAllByRole('button', { name: /import/i });
      await user.click(importButtons[0]);
      
      await waitFor(() => {
        // fetchExpenses called twice: on open and after import
        expect(props.fetchExpenses).toHaveBeenCalledTimes(2);
      });
    });
  });
});
