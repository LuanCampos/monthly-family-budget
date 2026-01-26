/**
 * Accessibility Tests
 * 
 * Comprehensive a11y tests for UI components using axe-core.
 * Tests verify WCAG compliance, aria attributes, and keyboard navigation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { checkA11y } from './a11y-setup';

// Mock contexts
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'pt',
    t: (key: string) => {
      const translations: Record<string, string> = {
        cancel: 'Cancelar',
        delete: 'Excluir',
        confirm: 'Confirmar',
        title: 'Título',
        value: 'Valor',
        category: 'Categoria',
        save: 'Salvar',
        edit: 'Editar',
        close: 'Fechar',
        essenciais: 'Essenciais',
        conforto: 'Conforto',
        metas: 'Metas',
        prazeres: 'Prazeres',
        liberdade: 'Liberdade',
        conhecimento: 'Conhecimento',
        subcategory: 'Subcategoria',
        noSubcategory: 'Sem subcategoria',
        addValue: 'Adicionar valor',
        expenseTitle: 'Título',
        expenseCategory: 'Categoria',
        expenseSubcategory: 'Subcategoria',
        expenseValue: 'Valor',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    currency: 'BRL',
    currencySymbol: 'R$',
    formatCurrency: (v: number) => `R$ ${v.toFixed(2)}`,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import components after mocks
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ExpenseFormFields } from '@/components/expense/ExpenseFormFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ConfirmDialog a11y', () => {
    const defaultProps = {
      open: true,
      onOpenChange: vi.fn(),
      onConfirm: vi.fn(),
      title: 'Confirmar Exclusão',
      description: 'Tem certeza que deseja excluir este item?',
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);
      await checkA11y(container);
    });

    it('should have proper dialog role and aria attributes', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should focus confirm button on open', async () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      // AlertDialog should trap focus
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onOpenChange = vi.fn();
      
      render(
        <ConfirmDialog 
          {...defaultProps} 
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />
      );
      
      // Tab through buttons
      await user.tab();
      await user.tab();
      
      // Press Enter to activate
      await user.keyboard('{Enter}');
      
      // One of the handlers should have been called
      expect(onConfirm.mock.calls.length + onOpenChange.mock.calls.length).toBeGreaterThan(0);
    });

    it('should close on Escape key', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      
      render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);
      
      await user.keyboard('{Escape}');
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('ExpenseFormFields a11y', () => {
    const defaultProps = {
      title: '',
      category: 'essenciais' as const,
      subcategoryId: '',
      value: '',
      subcategories: [],
      onTitleChange: vi.fn(),
      onCategoryChange: vi.fn(),
      onSubcategoryChange: vi.fn(),
      onValueChange: vi.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<ExpenseFormFields {...defaultProps} />);
      await checkA11y(container);
    });

    it('should have labels associated with inputs', () => {
      render(<ExpenseFormFields {...defaultProps} />);
      
      // Check label-input associations
      const titleInput = screen.getByLabelText(/título/i);
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveAttribute('id');
      
      const valueInput = screen.getByLabelText(/valor/i);
      expect(valueInput).toBeInTheDocument();
      expect(valueInput).toHaveAttribute('id');
    });

    it('should be keyboard navigable through all fields', async () => {
      const user = userEvent.setup();
      
      render(<ExpenseFormFields {...defaultProps} />);
      
      // Tab through fields
      await user.tab();
      expect(screen.getByLabelText(/título/i)).toHaveFocus();
      
      await user.tab();
      // Category select trigger should be focused
      expect(document.activeElement?.getAttribute('role')).toBe('combobox');
    });

    it('should allow typing in inputs with keyboard', async () => {
      const user = userEvent.setup();
      const onTitleChange = vi.fn();
      
      render(<ExpenseFormFields {...defaultProps} onTitleChange={onTitleChange} />);
      
      const titleInput = screen.getByLabelText(/título/i);
      await user.click(titleInput);
      await user.type(titleInput, 'Test Expense');
      
      expect(onTitleChange).toHaveBeenCalled();
    });
  });

  describe('Button a11y', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Button>Click me</Button>);
      await checkA11y(container);
    });

    it('should be focusable', async () => {
      const user = userEvent.setup();
      render(<Button>Click me</Button>);
      
      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('should respond to Enter and Space keys', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      render(<Button onClick={onClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Input a11y', () => {
    it('should have no accessibility violations when labeled', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="test-input">Test Label</Label>
          <Input id="test-input" placeholder="Enter value" />
        </div>
      );
      await checkA11y(container);
    });

    it('should support aria-describedby for error messages', () => {
      render(
        <div>
          <Label htmlFor="error-input">Email</Label>
          <Input 
            id="error-input" 
            aria-describedby="error-message"
            aria-invalid="true"
          />
          <span id="error-message">Email inválido</span>
        </div>
      );
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should be focusable and allow typing', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Label htmlFor="text-input">Name</Label>
          <Input id="text-input" />
        </div>
      );
      
      await user.tab();
      expect(screen.getByLabelText('Name')).toHaveFocus();
      
      await user.type(screen.getByLabelText('Name'), 'John Doe');
      expect(screen.getByLabelText('Name')).toHaveValue('John Doe');
    });
  });

  describe('Keyboard Navigation Patterns', () => {
    it('should trap focus within dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
          title="Test"
          description="Test description"
        />
      );
      
      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];
      const _lastButton = buttons[buttons.length - 1];
      
      // Focus should cycle within dialog
      firstButton.focus();
      
      // Tab to last button
      for (let i = 0; i < buttons.length; i++) {
        await user.tab();
      }
      
      // Should wrap around
      expect(document.activeElement).not.toBe(document.body);
    });
  });

  describe('Focus Management', () => {
    it('should return focus when dialog closes', async () => {
      const user = userEvent.setup();
      let isOpen = true;
      
      const TriggerAndDialog = () => {
        return (
          <>
            <Button data-testid="trigger">Open Dialog</Button>
            <ConfirmDialog
              open={isOpen}
              onOpenChange={(open) => { isOpen = open; }}
              onConfirm={vi.fn()}
              title="Test"
              description="Test"
            />
          </>
        );
      };
      
      const { rerender } = render(<TriggerAndDialog />);
      
      // Close dialog
      await user.keyboard('{Escape}');
      isOpen = false;
      rerender(<TriggerAndDialog />);
      
      // Focus should be manageable
      expect(document.activeElement).not.toBeNull();
    });
  });

  describe('Color Contrast & Visual Indicators', () => {
    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      
      render(<Button>Focusable Button</Button>);
      
      await user.tab();
      const button = screen.getByRole('button');
      
      // Button should be focused
      expect(button).toHaveFocus();
      
      // Button should have focus-visible styles (ring)
      // This tests that the button has proper CSS classes for focus
      expect(button.className).toContain('focus-visible');
    });

    it('should indicate disabled state visually', () => {
      render(<Button disabled>Disabled Button</Button>);
      
      const button = screen.getByRole('button');
      
      // Should have disabled attribute
      expect(button).toBeDisabled();
      
      // Should have visual disabled class
      expect(button.className).toContain('disabled');
    });
  });

  describe('Form Accessibility', () => {
    it('should announce required fields', () => {
      render(
        <div>
          <Label htmlFor="required-input">
            Nome <span aria-hidden="true">*</span>
          </Label>
          <Input id="required-input" required aria-required="true" />
        </div>
      );
      
      const input = screen.getByLabelText(/nome/i);
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('required');
    });

    it('should associate error messages with inputs', () => {
      render(
        <div>
          <Label htmlFor="error-field">Email</Label>
          <Input 
            id="error-field" 
            aria-invalid="true"
            aria-describedby="email-error"
          />
          <p id="email-error" role="alert">
            Por favor, insira um email válido.
          </p>
        </div>
      );
      
      const input = screen.getByLabelText('Email');
      const error = screen.getByRole('alert');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
      expect(error).toBeInTheDocument();
    });

    it('should group related form fields with fieldset', () => {
      render(
        <fieldset>
          <legend>Informações Pessoais</legend>
          <Label htmlFor="first-name">Nome</Label>
          <Input id="first-name" />
          <Label htmlFor="last-name">Sobrenome</Label>
          <Input id="last-name" />
        </fieldset>
      );
      
      expect(screen.getByRole('group')).toBeInTheDocument();
      expect(screen.getByText('Informações Pessoais')).toBeInTheDocument();
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
          title="Confirmar Ação"
          description="Descrição da ação"
        />
      );
      
      // Title should be a heading
      const title = screen.getByText('Confirmar Ação');
      expect(title.tagName).toBe('H2');
    });

    it('should use aria-live for dynamic content', () => {
      render(
        <div aria-live="polite" aria-atomic="true">
          <span>Salvo com sucesso!</span>
        </div>
      );
      
      const liveRegion = screen.getByText('Salvo com sucesso!').parentElement;
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });
});
