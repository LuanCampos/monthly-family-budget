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
