import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryHistoryDialog } from './EntryHistoryDialog';
import type { Goal, GoalEntry } from '@/types';

// Mock dependencies
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock('./EntryHistoryList', () => ({
  EntryHistoryList: ({ entries, onDelete, onEdit }: { entries: GoalEntry[]; onDelete: (e: GoalEntry) => void; onEdit: (e: GoalEntry) => void }) => (
    <div data-testid="entry-history-list">
      {entries.map(entry => (
        <div key={entry.id} data-testid={`entry-${entry.id}`}>
          {entry.description}
          <button onClick={() => onEdit(entry)}>Edit</button>
          <button onClick={() => onDelete(entry)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./ImportExpenseDialog', () => ({
  ImportExpenseDialog: () => <div data-testid="import-expense-dialog" />,
}));

const mockGoal: Goal = {
  id: 'goal-1',
  familyId: 'family-1',
  name: 'Test Goal',
  targetValue: 10000,
  currentValue: 500,
  targetMonth: 12,
  targetYear: 2025,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockEntries: GoalEntry[] = [
  {
    id: 'entry-1',
    goalId: 'goal-1',
    value: 100,
    description: 'First Entry',
    month: 1,
    year: 2025,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'entry-2',
    goalId: 'goal-1',
    value: 200,
    description: 'Second Entry',
    month: 2,
    year: 2025,
    createdAt: new Date().toISOString(),
  },
];

const createDefaultProps = () => ({
  open: true,
  onOpenChange: vi.fn(),
  goal: mockGoal,
  entries: mockEntries,
  onAddEntry: vi.fn(),
  onEditEntry: vi.fn(),
  onDeleteEntry: vi.fn(),
  onImportExpense: vi.fn().mockResolvedValue(undefined),
  fetchHistoricalExpenses: vi.fn().mockResolvedValue([]),
});

describe('EntryHistoryDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dialog rendering', () => {
    it('should render when open is true', () => {
      const props = createDefaultProps();
      render(<EntryHistoryDialog {...props} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show dialog title', () => {
      const props = createDefaultProps();
      render(<EntryHistoryDialog {...props} />);
      
      expect(screen.getByText('entries')).toBeInTheDocument();
    });

    it('should show goal name', () => {
      const props = createDefaultProps();
      render(<EntryHistoryDialog {...props} />);
      
      expect(screen.getByText('Test Goal')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const props = createDefaultProps();
      props.open = false;
      
      render(<EntryHistoryDialog {...props} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('entry list', () => {
    it('should render entry history list', () => {
      const props = createDefaultProps();
      render(<EntryHistoryDialog {...props} />);
      
      expect(screen.getByTestId('entry-history-list')).toBeInTheDocument();
    });

    it('should pass entries to list', () => {
      const props = createDefaultProps();
      render(<EntryHistoryDialog {...props} />);
      
      expect(screen.getByTestId('entry-entry-1')).toBeInTheDocument();
      expect(screen.getByTestId('entry-entry-2')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('should have add entry button', () => {
      const props = createDefaultProps();
      render(<EntryHistoryDialog {...props} />);
      
      expect(screen.getByRole('button', { name: /addEntry/i })).toBeInTheDocument();
    });

    it('should call onAddEntry when add button is clicked', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<EntryHistoryDialog {...props} />);
      await user.click(screen.getByRole('button', { name: /addEntry/i }));
      
      expect(props.onAddEntry).toHaveBeenCalledTimes(1);
    });

    it('should call onEditEntry when edit is triggered', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<EntryHistoryDialog {...props} />);
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);
      
      expect(props.onEditEntry).toHaveBeenCalledWith(mockEntries[0]);
    });

    it('should call onDeleteEntry when delete is triggered', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<EntryHistoryDialog {...props} />);
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      expect(props.onDeleteEntry).toHaveBeenCalledWith(mockEntries[0]);
    });
  });
});
