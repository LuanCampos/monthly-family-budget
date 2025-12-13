export type CategoryKey = 
  | 'custos-fixos' 
  | 'conforto' 
  | 'metas' 
  | 'prazeres' 
  | 'liberdade' 
  | 'conhecimento';

export interface Category {
  key: CategoryKey;
  name: string;
  percentage: number;
  color: string;
}

export interface Expense {
  id: string;
  title: string;
  category: CategoryKey;
  value: number;
  isRecurring: boolean;
}

export interface Month {
  id: string;
  label: string;
  year: number;
  month: number;
  income: number;
  expenses: Expense[];
}

export const CATEGORIES: Category[] = [
  { key: 'custos-fixos', name: 'Custos fixos', percentage: 30, color: 'hsl(187, 85%, 53%)' },
  { key: 'conforto', name: 'Conforto', percentage: 10, color: 'hsl(160, 84%, 39%)' },
  { key: 'metas', name: 'Metas', percentage: 20, color: 'hsl(48, 96%, 53%)' },
  { key: 'prazeres', name: 'Prazeres', percentage: 10, color: 'hsl(291, 64%, 42%)' },
  { key: 'liberdade', name: 'Liberdade financeira', percentage: 25, color: 'hsl(217, 91%, 60%)' },
  { key: 'conhecimento', name: 'Conhecimento', percentage: 5, color: 'hsl(25, 95%, 53%)' },
];

export const getCategoryByKey = (key: CategoryKey): Category => {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[0];
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};
