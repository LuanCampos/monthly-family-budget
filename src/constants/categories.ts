import { Category, CategoryKey } from '@/types/budget';

export const CATEGORIES: Category[] = [
  { key: 'essenciais', name: 'essenciais', percentage: 30, color: 'hsl(187, 85%, 53%)' },
  { key: 'conforto', name: 'conforto', percentage: 10, color: 'hsl(160, 84%, 39%)' },
  { key: 'metas', name: 'metas', percentage: 20, color: 'hsl(48, 96%, 53%)' },
  { key: 'prazeres', name: 'prazeres', percentage: 10, color: 'hsl(291, 64%, 42%)' },
  { key: 'liberdade', name: 'liberdade', percentage: 25, color: 'hsl(217, 91%, 60%)' },
  { key: 'conhecimento', name: 'conhecimento', percentage: 5, color: 'hsl(25, 95%, 53%)' },
];

export const DEFAULT_CATEGORY: CategoryKey = 'essenciais';

export const getCategoryByKey = (key: CategoryKey): Category => {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[0];
};

export const MONTH_NAMES = [
  'month-0', 'month-1', 'month-2', 'month-3', 'month-4', 'month-5',
  'month-6', 'month-7', 'month-8', 'month-9', 'month-10', 'month-11',
] as const;
