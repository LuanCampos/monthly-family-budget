import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonthSelector } from './MonthSelector';
import type { Month } from '@/types/budget';

// Mock contexts
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
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
        'createFirstMonth': 'Criar Primeiro Mês',
        'addMonth': 'Adicionar Mês',
        'selectMonth': 'Selecionar Mês',
        'year': 'Ano',
        'month': 'Mês',
        'add': 'Adicionar',
        'cancel': 'Cancelar',
      };
      return translations[key] || key;
    },
    language: 'pt',
  })),
}));

describe('MonthSelector', () => {
  const mockOnSelectMonth = vi.fn();
  const mockOnAddMonth = vi.fn();

  const mockMonths: Month[] = [
    {
      id: 'month-1',
      year: 2026,
      month: 1,
      income: 5000,
      expenses: [],
      limits: {},
      createdAt: new Date().toISOString(),
    },
    {
      id: 'month-2',
      year: 2026,
      month: 2,
      income: 5000,
      expenses: [],
      limits: {},
      createdAt: new Date().toISOString(),
    },
    {
      id: 'month-3',
      year: 2025,
      month: 12,
      income: 4500,
      expenses: [],
      limits: {},
      createdAt: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    months: mockMonths,
    currentMonth: mockMonths[0],
    onSelectMonth: mockOnSelectMonth,
    onAddMonth: mockOnAddMonth,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAddMonth.mockResolvedValue(true);
  });

  const renderComponent = (props = {}) => {
    const user = userEvent.setup();
    const utils = render(<MonthSelector {...defaultProps} {...props} />);
    return { user, ...utils };
  };

  describe('rendering', () => {
    it('should render current month in button', () => {
      renderComponent();
      
      // Should show January 2026 in abbreviated form
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render create button when showCreateButton is true', () => {
      renderComponent({ showCreateButton: true, months: [], currentMonth: null });
      
      expect(screen.getByText('Criar Primeiro Mês')).toBeInTheDocument();
    });

    it('should render dropdown trigger when months exist', () => {
      renderComponent();
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('dropdown menu', () => {
    it('should open dropdown when clicked', async () => {
      const { user } = renderComponent();

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        // Dropdown content should be visible
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should show all months in dropdown', async () => {
      const { user } = renderComponent();

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        // Should show all month options as menu items
        const menuItems = screen.getAllByRole('menuitem');
        // 3 months + 1 "add month" option
        expect(menuItems.length).toBeGreaterThanOrEqual(3);
        
        // Check specific months are present
        expect(screen.getAllByText(/janeiro 2026/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/fevereiro 2026/i)).toBeInTheDocument();
        expect(screen.getByText(/dezembro 2025/i)).toBeInTheDocument();
      });
    });

    it('should call onSelectMonth when month is selected', async () => {
      const { user } = renderComponent();

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      const febOption = screen.getByText(/fevereiro 2026/i);
      await user.click(febOption);

      expect(mockOnSelectMonth).toHaveBeenCalledWith('month-2');
    });
  });

  describe('add month dialog', () => {
    it('should show add month option in dropdown', async () => {
      const { user } = renderComponent();

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/adicionar mês/i)).toBeInTheDocument();
      });
    });

    it('should open dialog when create button is clicked', async () => {
      const { user } = renderComponent({ showCreateButton: true, months: [], currentMonth: null });

      const createButton = screen.getByText('Criar Primeiro Mês');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should call onAddMonth when adding new month', async () => {
      const { user } = renderComponent({ showCreateButton: true, months: [], currentMonth: null });

      const createButton = screen.getByText('Criar Primeiro Mês');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /adicionar/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockOnAddMonth).toHaveBeenCalled();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty months array', () => {
      renderComponent({ months: [], currentMonth: null, showCreateButton: true });
      
      expect(screen.getByText('Criar Primeiro Mês')).toBeInTheDocument();
    });

    it('should handle null currentMonth with months', () => {
      // Should not crash
      expect(() => {
        renderComponent({ currentMonth: null });
      }).not.toThrow();
    });
  });

  describe('month formatting', () => {
    it('should display abbreviated month format in trigger', () => {
      renderComponent();
      
      const trigger = screen.getByRole('button');
      // Should contain abbreviated format like "Jan/26"
      expect(trigger.textContent).toMatch(/jan/i);
    });
  });

  describe('accessibility', () => {
    it('should have accessible dropdown menu', async () => {
      const { user } = renderComponent();

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
        // Menu items should be accessible
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThan(0);
      });
    });
  });
});
