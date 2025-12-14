import { Category, CategoryKey } from '@/types/budget';

export const CATEGORIES: Category[] = [
  { key: 'essenciais', name: 'Essenciais', percentage: 30, color: 'hsl(187, 85%, 53%)' },
  { key: 'conforto', name: 'Conforto', percentage: 10, color: 'hsl(160, 84%, 39%)' },
  { key: 'metas', name: 'Metas', percentage: 20, color: 'hsl(48, 96%, 53%)' },
  { key: 'prazeres', name: 'Prazeres', percentage: 10, color: 'hsl(291, 64%, 42%)' },
  { key: 'liberdade', name: 'Liberdade financeira', percentage: 25, color: 'hsl(217, 91%, 60%)' },
  { key: 'conhecimento', name: 'Conhecimento', percentage: 5, color: 'hsl(25, 95%, 53%)' },
];

export const DEFAULT_CATEGORY: CategoryKey = 'essenciais';

export const getCategoryByKey = (key: CategoryKey): Category => {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[0];
};

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;
