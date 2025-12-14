export type CategoryKey = 
  | 'essenciais' 
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

export interface Subcategory {
  id: string;
  name: string;
  categoryKey: CategoryKey;
}

export interface Expense {
  id: string;
  title: string;
  category: CategoryKey;
  subcategoryId?: string;
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

// Re-export para manter compatibilidade com imports existentes
export { 
  CATEGORIES, 
  getCategoryByKey, 
  DEFAULT_CATEGORY,
  MONTH_NAMES 
} from '@/constants/categories';

export { 
  formatCurrency, 
  formatPercentage 
} from '@/utils/formatters';
