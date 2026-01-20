import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryFormDialog } from './EntryFormDialog';
import type { Goal, GoalEntry } from '@/types';

// Mock dependencies
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({ currencySymbol: 'R$' }),
}));

vi.mock('@/lib/utils/formatters', () => ({
  parseCurrencyInput: vi.fn((val: string) => parseFloat(val.replace(',', '.')) || 0),
  sanitizeCurrencyInput: vi.fn((val: string) => val),
}));

vi.mock('@/components/common', () => ({
  YearSelector: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select data-testid="year-selector" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="2025">2025</option>
      <option value="2026">2026</option>
    </select>
  ),
}));

const mockGoal: Goal = {
  id: 'goal-1',
  name: 'Test Goal',
  target_value: 10000,
  current_value: 500,
  target_date: '2025-12-31',
  family_id: 'family-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockEntry: GoalEntry = {
  id: 'entry-1',
  goal_id: 'goal-1',
  value: 100,
  description: 'Test Entry',
  month: 3,
  year: 2025,
  created_at: new Date().toISOString(),
};

const createDefaultProps = () => ({
  open: true,
  onOpenChange: vi.fn(),
  goal: mockGoal,
  entry: null as GoalEntry | null,
  onSave: vi.fn().mockResolvedValue(undefined),
  saving: false,
  defaultMonth: 1,
  defaultYear: 2025,
});

describe('EntryFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dialog rendering', () => {
    it('should render when open with goal', () => {
      const props = createDefaultProps();
      render(<EntryFormDialog {...props} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show add entry title when no entry provided', () => {
      const props = createDefaultProps();
      render(<EntryFormDialog {...props} />);
      
      expect(screen.getByText('addEntry')).toBeInTheDocument();
    });

    it('should show edit entry title when entry provided', () => {
      const props = createDefaultProps();
      props.entry = mockEntry;
      
      render(<EntryFormDialog {...props} />);
      
      expect(screen.getByText('editEntry')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const props = createDefaultProps();
      props.open = false;
      
      render(<EntryFormDialog {...props} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('should render value input', () => {
      const props = createDefaultProps();
      render(<EntryFormDialog {...props} />);
      
      expect(screen.getByLabelText(/entryValue/i)).toBeInTheDocument();
    });

    it('should render description input', () => {
      const props = createDefaultProps();
      render(<EntryFormDialog {...props} />);
      
      expect(screen.getByLabelText(/entryDescription/i)).toBeInTheDocument();
    });

    it('should show currency symbol', () => {
      const props = createDefaultProps();
      render(<EntryFormDialog {...props} />);
      
      expect(screen.getByText('R$')).toBeInTheDocument();
    });

    it('should populate fields when editing', () => {
      const props = createDefaultProps();
      props.entry = mockEntry;
      
      render(<EntryFormDialog {...props} />);
      
      expect(screen.getByDisplayValue('100,00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Entry')).toBeInTheDocument();
    });
  });

  describe('form actions', () => {
    it('should have save button', () => {
      const props = createDefaultProps();
      render(<EntryFormDialog {...props} />);
      
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should have cancel button', () => {
      const props = createDefaultProps();
      render(<EntryFormDialog {...props} />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onOpenChange(false) when cancel is clicked', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<EntryFormDialog {...props} />);
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(props.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('form submission', () => {
    it('should call onSave with form data when submitted', async () => {
      const user = userEvent.setup();
      const props = createDefaultProps();
      
      render(<EntryFormDialog {...props} />);
      
      await user.type(screen.getByLabelText(/entryValue/i), '500');
      await user.type(screen.getByLabelText(/entryDescription/i), 'New deposit');
      await user.click(screen.getByRole('button', { name: /save/i }));
      
      await waitFor(() => {
        expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({
          description: 'New deposit',
        }));
      });
    });
  });
});
