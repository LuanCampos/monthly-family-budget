import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LimitsPanel } from './LimitsPanel';
import type { CategoryKey } from '@/types/budget';

// Mock contexts
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        edit: 'Edit',
        editLimits: 'Edit Limits',
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

vi.mock('@/constants/categories', () => ({
  CATEGORIES: [
    { key: 'essenciais', color: '#FF0000', name: 'Essentials' },
    { key: 'conforto', color: '#00FF00', name: 'Comfort' },
    { key: 'metas', color: '#0000FF', name: 'Goals' },
    { key: 'prazeres', color: '#FFFF00', name: 'Pleasures' },
    { key: 'liberdade', color: '#FF00FF', name: 'Freedom' },
    { key: 'conhecimento', color: '#00FFFF', name: 'Knowledge' },
  ],
}));

describe('LimitsPanel', () => {
  const mockPercentages: Record<CategoryKey, number> = {
    essenciais: 50,
    conforto: 20,
    metas: 10,
    prazeres: 10,
    liberdade: 5,
    conhecimento: 5,
  };

  const defaultProps = {
    percentages: mockPercentages,
    onEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all categories with percentages', () => {
    render(<LimitsPanel {...defaultProps} />);

    expect(screen.getByText('Essentials')).toBeInTheDocument();
    expect(screen.getByText('Comfort')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('should render edit button', () => {
    render(<LimitsPanel {...defaultProps} />);

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('should open dialog when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<LimitsPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByText('Edit Limits')).toBeInTheDocument();
  });

  it('should display total percentage in dialog', async () => {
    const user = userEvent.setup();
    
    render(<LimitsPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should update percentage when input changes', async () => {
    const user = userEvent.setup();
    
    render(<LimitsPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    // One input per category (6 categories in mock)
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(6);

    // Clear and type new value
    await user.clear(inputs[0]);
    await user.type(inputs[0], '40');

    expect(inputs[0]).toHaveValue(40);
  });

  it('should clamp input values to 0-100 range', async () => {
    const user = userEvent.setup();
    
    render(<LimitsPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    const inputs = screen.getAllByRole('spinbutton');
    
    // Try to enter value > 100
    await user.clear(inputs[0]);
    await user.type(inputs[0], '150');

    // Should be clamped to 100
    expect(inputs[0]).toHaveValue(100);
  });

  it('should call onEdit with updated percentages when saving', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn().mockResolvedValue(undefined);
    
    render(<LimitsPanel {...defaultProps} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    // Click save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onEdit).toHaveBeenCalledWith(mockPercentages);
    });
  });

  it('should disable save button when total is not 100%', async () => {
    const user = userEvent.setup();
    
    const unbalancedPercentages: Record<CategoryKey, number> = {
      ...mockPercentages,
      essenciais: 40, // Total now 90%
    };
    
    render(<LimitsPanel percentages={unbalancedPercentages} onEdit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('should show color dots for each category', () => {
    render(<LimitsPanel {...defaultProps} />);

    // Check for colored dots
    const dots = document.querySelectorAll('.rounded-full.w-2.h-2');
    expect(dots.length).toBe(6); // 6 categories
  });

  it('should close dialog after successful save', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn().mockResolvedValue(undefined);
    
    render(<LimitsPanel {...defaultProps} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      // Dialog should close after save
      expect(screen.queryByText('Edit Limits')).not.toBeInTheDocument();
    });
  });
});
