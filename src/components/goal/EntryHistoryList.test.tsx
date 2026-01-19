import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryHistoryList } from './EntryHistoryList';
import type { GoalEntry } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        noEntries: 'No entries',
        automaticEntry: 'Automatic',
        manualEntry: 'Manual',
        noDescription: 'No description',
        edit: 'Edit',
        delete: 'Delete',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatCurrency: (value: number) => `$${value.toFixed(2)}`,
  }),
}));

const mockManualEntry: GoalEntry = {
  id: 'entry-1',
  goalId: 'goal-1',
  value: 100,
  description: 'Monthly contribution',
  month: 1,
  year: 2025,
  createdAt: '2025-01-15T00:00:00Z',
};

const mockAutomaticEntry: GoalEntry = {
  id: 'entry-2',
  goalId: 'goal-1',
  value: 50,
  description: 'From expense',
  month: 2,
  year: 2025,
  expenseId: 'expense-1',
  createdAt: '2025-02-15T00:00:00Z',
};

const mockEntryNoDescription: GoalEntry = {
  id: 'entry-3',
  goalId: 'goal-1',
  value: 75,
  description: '',
  month: 3,
  year: 2025,
  createdAt: '2025-03-15T00:00:00Z',
};

describe('EntryHistoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no entries', () => {
    render(<EntryHistoryList entries={[]} />);
    
    expect(screen.getByText('No entries')).toBeInTheDocument();
  });

  it('should render manual entry with value and description', () => {
    render(<EntryHistoryList entries={[mockManualEntry]} />);
    
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('Monthly contribution')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText('01/2025')).toBeInTheDocument();
  });

  it('should render automatic entry with badge', () => {
    render(<EntryHistoryList entries={[mockAutomaticEntry]} />);
    
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('Automatic')).toBeInTheDocument();
  });

  it('should show "No description" for entries without description', () => {
    render(<EntryHistoryList entries={[mockEntryNoDescription]} />);
    
    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('should render multiple entries', () => {
    render(
      <EntryHistoryList 
        entries={[mockManualEntry, mockAutomaticEntry, mockEntryNoDescription]} 
      />
    );
    
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$75.00')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked for manual entry', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    
    render(
      <EntryHistoryList 
        entries={[mockManualEntry]} 
        onEdit={onEdit}
      />
    );
    
    const editButton = screen.getByRole('button', { name: 'Edit' });
    await user.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockManualEntry);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    
    render(
      <EntryHistoryList 
        entries={[mockManualEntry]} 
        onDelete={onDelete}
      />
    );
    
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledWith(mockManualEntry);
  });

  it('should not show edit button for automatic entries', () => {
    const onEdit = vi.fn();
    
    render(
      <EntryHistoryList 
        entries={[mockAutomaticEntry]} 
        onEdit={onEdit}
      />
    );
    
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('should show delete button for automatic entries', () => {
    const onDelete = vi.fn();
    
    render(
      <EntryHistoryList 
        entries={[mockAutomaticEntry]} 
        onDelete={onDelete}
      />
    );
    
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('should not show action buttons when no handlers provided', () => {
    render(<EntryHistoryList entries={[mockManualEntry]} />);
    
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('should format date with padded month', () => {
    const singleDigitMonthEntry: GoalEntry = {
      ...mockManualEntry,
      month: 3,
    };
    
    render(<EntryHistoryList entries={[singleDigitMonthEntry]} />);
    
    expect(screen.getByText('03/2025')).toBeInTheDocument();
  });

  it('should format date with double digit month', () => {
    const doubleDigitMonthEntry: GoalEntry = {
      ...mockManualEntry,
      month: 12,
    };
    
    render(<EntryHistoryList entries={[doubleDigitMonthEntry]} />);
    
    expect(screen.getByText('12/2025')).toBeInTheDocument();
  });
});
