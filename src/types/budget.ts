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
  isPending?: boolean;
  dueDay?: number;
  recurringExpenseId?: string;
  createdAt?: string;
  installmentInfo?: {
    current: number;
    total: number;
  };
}

export interface RecurringExpense {
  id: string;
  title: string;
  category: CategoryKey;
  subcategoryId?: string;
  value: number;
  isRecurring: true;
  dueDay?: number;
  hasInstallments?: boolean;
  totalInstallments?: number;
  startYear?: number;
  startMonth?: number;
}

export interface IncomeSource {
  id: string;
  monthId: string;
  name: string;
  value: number;
}

export interface Month {
  id: string;
  label: string;
  year: number;
  month: number;
  income: number;
  incomeSources: IncomeSource[];
  expenses: Expense[];
  categoryLimits?: Record<CategoryKey, number>;
}

export interface Goal {
  id: string;
  familyId: string;
  name: string;
  currentValue: number;
  targetValue: number;
  targetMonth?: number;
  targetYear?: number;
  account: string;
  linkedSubcategoryId?: string;
  linkedCategoryKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoalEntry {
  id: string;
  goalId: string;
  expenseId?: string;
  value: number;
  description?: string;
  month: number;
  year: number;
  createdAt?: string;
  updatedAt?: string;
}
