import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryLegend } from './CategoryLegend';

// Mock LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
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

// Mock categories
vi.mock('@/constants/categories', () => ({
  CATEGORIES: [
    { key: 'essenciais', color: '#22c55e', percentage: 55 },
    { key: 'conforto', color: '#3b82f6', percentage: 10 },
    { key: 'metas', color: '#a855f7', percentage: 10 },
    { key: 'prazeres', color: '#f97316', percentage: 10 },
    { key: 'liberdade', color: '#eab308', percentage: 10 },
    { key: 'conhecimento', color: '#06b6d4', percentage: 5 },
  ],
}));

describe('CategoryLegend', () => {
  it('should render all category labels', () => {
    render(<CategoryLegend />);
    
    expect(screen.getByText('Essentials')).toBeInTheDocument();
    expect(screen.getByText('Comfort')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Pleasures')).toBeInTheDocument();
    expect(screen.getByText('Freedom')).toBeInTheDocument();
    expect(screen.getByText('Knowledge')).toBeInTheDocument();
  });

  it('should render color indicators for each category', () => {
    const { container } = render(<CategoryLegend />);
    
    const colorIndicators = container.querySelectorAll('.rounded-full');
    expect(colorIndicators.length).toBe(6);
  });

  it('should display categories in a grid layout', () => {
    const { container } = render(<CategoryLegend />);
    
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-2');
  });

  it('should apply correct background color to indicators', () => {
    const { container } = render(<CategoryLegend />);
    
    const colorIndicators = container.querySelectorAll('.rounded-full');
    
    // Check that at least one indicator has an inline background color style
    const hasInlineStyle = Array.from(colorIndicators).some(
      (indicator) => indicator.getAttribute('style')?.includes('background-color')
    );
    expect(hasInlineStyle).toBe(true);
  });

  it('should render category items with proper structure', () => {
    const { container } = render(<CategoryLegend />);
    
    const categoryItems = container.querySelectorAll('.flex.items-center');
    expect(categoryItems.length).toBeGreaterThanOrEqual(6);
  });
});
