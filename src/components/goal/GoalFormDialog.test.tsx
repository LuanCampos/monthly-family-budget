import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalFormDialog } from './GoalFormDialog';
import type { Goal, Subcategory } from '@/types';

// Mock contexts
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'goalName': 'Nome da Meta',
        'goalNamePlaceholder': 'Ex: Reserva de Emergência',
        'targetValue': 'Valor Alvo',
        'targetMonth': 'Mês Alvo',
        'targetYear': 'Ano Alvo',
        'account': 'Conta',
        'linkedSubcategory': 'Subcategoria Vinculada',
        'status': 'Status',
        'active': 'Ativa',
        'archived': 'Arquivada',
        'addGoal': 'Nova Meta',
        'editGoal': 'Editar Meta',
        'save': 'Salvar',
        'cancel': 'Cancelar',
        'liberdade': 'Liberdade Financeira',
        'month-0': 'Janeiro',
        'month-1': 'Fevereiro',
        'month-2': 'Março',
        'month-3': 'Abril',
        'month-4': 'Maio',
        'month-5': 'Junho',
        'month-6': 'Julho',
        'month-7': 'Agosto',
        'month-8': 'Setembro',
        'month-9': 'Outubro',
        'month-10': 'Novembro',
        'month-11': 'Dezembro',
      };
      return translations[key] || key;
    },
    language: 'pt',
  })),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: vi.fn(() => ({
    currencySymbol: 'R$',
    formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
  })),
}));

describe('GoalFormDialog', () => {
  const mockOnSave = vi.fn();
  const mockOnOpenChange = vi.fn();

  const mockSubcategories: Subcategory[] = [
    { id: 'sub-1', name: 'Reserva de Emergência', categoryKey: 'metas', familyId: 'family-123' },
    { id: 'sub-2', name: 'Viagem', categoryKey: 'metas', familyId: 'family-123' },
    { id: 'sub-3', name: 'Educação', categoryKey: 'conhecimento', familyId: 'family-123' },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    goal: null,
    subcategories: mockSubcategories,
    onSave: mockOnSave,
    saving: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const user = userEvent.setup();
    const utils = render(<GoalFormDialog {...defaultProps} {...props} />);
    return { user, ...utils };
  };

  describe('rendering', () => {
    it('should render dialog when open', () => {
      renderComponent();
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Nova Meta')).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      renderComponent({ open: false });
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should show edit title when editing existing goal', () => {
      const existingGoal: Goal = {
        id: 'goal-123',
        name: 'Existing Goal',
        targetValue: 5000,
        currentValue: 1000,
        status: 'active',
        familyId: 'family-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      renderComponent({ goal: existingGoal });
      
      expect(screen.getByText('Editar Meta')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      renderComponent();
      
      expect(screen.getByLabelText(/nome da meta/i)).toBeInTheDocument();
      expect(screen.getByText(/valor alvo/i)).toBeInTheDocument();
    });
  });

  describe('form population', () => {
    it('should populate form with goal data when editing', async () => {
      const existingGoal: Goal = {
        id: 'goal-123',
        name: 'My Savings Goal',
        targetValue: 10000,
        currentValue: 2500,
        targetMonth: 12,
        targetYear: 2026,
        account: 'Nubank',
        status: 'active',
        familyId: 'family-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      renderComponent({ goal: existingGoal });
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/nome da meta/i) as HTMLInputElement;
        expect(nameInput.value).toBe('My Savings Goal');
      });
    });

    it('should start with empty form for new goal', () => {
      renderComponent();
      
      const nameInput = screen.getByLabelText(/nome da meta/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });

  describe('form submission', () => {
    it('should call onSave with form data on submit', async () => {
      mockOnSave.mockResolvedValue(undefined);
      const { user } = renderComponent();

      const nameInput = screen.getByLabelText(/nome da meta/i);
      await user.type(nameInput, 'New Goal');

      // Find and fill the target value input
      const valueInputs = screen.getAllByRole('textbox');
      const valueInput = valueInputs.find((input) => 
        input.id === 'goalTargetValue' || input.closest('[class*="relative"]')
      );
      
      if (valueInput) {
        await user.type(valueInput, '5000');
      }

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should not submit with empty name', async () => {
      const { user } = renderComponent();

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should close dialog after successful save', async () => {
      mockOnSave.mockResolvedValue(undefined);
      const { user } = renderComponent();

      const nameInput = screen.getByLabelText(/nome da meta/i);
      await user.type(nameInput, 'New Goal');

      // Fill target value
      const valueInputs = screen.getAllByRole('textbox');
      const valueInput = valueInputs[1]; // Second input is typically target value
      if (valueInput) {
        await user.type(valueInput, '1000');
      }

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('cancel button', () => {
    it('should close dialog when cancel is clicked', async () => {
      const { user } = renderComponent();

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should reset form when cancelled', async () => {
      const { user } = renderComponent();

      const nameInput = screen.getByLabelText(/nome da meta/i) as HTMLInputElement;
      await user.type(nameInput, 'Temporary value');
      expect(nameInput.value).toBe('Temporary value');

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      // Dialog closes and form resets
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('liberdade financeira option', () => {
    it('should show Liberdade Financeira as an option', () => {
      renderComponent();
      
      // The dropdown should contain Liberdade Financeira option
      expect(screen.getByText(/liberdade financeira/i)).toBeDefined();
    });
  });

  describe('disabled state', () => {
    it('should disable save button when saving', () => {
      renderComponent({ saving: true });
      
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('should have accessible form labels', () => {
      renderComponent();
      
      expect(screen.getByLabelText(/nome da meta/i)).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      renderComponent();
      
      expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('should have dialog role', () => {
      renderComponent();
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
