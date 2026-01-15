import * as storageAdapter from '@/lib/adapters/storageAdapter';
import { Month, CategoryKey, RecurringExpense, Subcategory } from '@/types';

interface ExpensePayload {
  month_id: string;
  title: string;
  category_key: CategoryKey;
  subcategory_id?: string | null;
  value: number;
  due_day?: number | null;
  is_recurring?: boolean;
  is_pending?: boolean;
  recurring_expense_id?: string | null;
  installment_current?: number | null;
  installment_total?: number | null;
}

interface RecurringPayload {
  title: string;
  category_key: CategoryKey;
  subcategory_id?: string | null;
  value: number;
  due_day?: number | null;
  has_installments?: boolean;
  total_installments?: number | null;
  start_year?: number | null;
  start_month?: number | null;
}

interface ExpenseUpdateData {
  title?: string;
  category_key?: CategoryKey;
  subcategory_id?: string | null;
  value?: number;
  due_day?: number | null;
  is_recurring?: boolean;
  is_pending?: boolean;
}

interface RecurringUpdateData {
  title?: string;
  category_key?: CategoryKey;
  subcategory_id?: string | null;
  value?: number;
  due_day?: number | null;
  has_installments?: boolean;
  total_installments?: number | null;
  start_year?: number | null;
  start_month?: number | null;
}

export const createBudgetApi = (opts: {
  currentFamilyId: string | null;
  setMonths: (m: Month[]) => void;
  setRecurringExpenses: (r: RecurringExpense[]) => void;
  setSubcategories: (s: Subcategory[]) => void;
}) => {
  const { currentFamilyId, setMonths, setRecurringExpenses, setSubcategories } = opts;

  // Data loading functions - delegate to storageAdapter and update state
  const loadMonths = async () => {
    if (!currentFamilyId) return;
    const months = await storageAdapter.getMonthsWithExpenses(currentFamilyId);
    setMonths(months);
  };

  const loadRecurringExpenses = async () => {
    if (!currentFamilyId) return;
    const recs = await storageAdapter.getRecurringExpenses(currentFamilyId);
    setRecurringExpenses(recs);
  };

  const loadSubcategories = async () => {
    if (!currentFamilyId) return;
    const subs = await storageAdapter.getSubcategories(currentFamilyId);
    setSubcategories(subs);
  };

  // Note: loadCategoryGoals removed - limits are now per-month and loaded with months

  // Subcategory CRUD - delegate to storageAdapter
  const addSubcategory = async (name: string, categoryKey: CategoryKey) => {
    if (!currentFamilyId) return;
    await storageAdapter.addSubcategory(currentFamilyId, name, categoryKey);
    await loadSubcategories();
  };

  const updateSubcategory = async (id: string, name: string) => {
    await storageAdapter.updateSubcategory(currentFamilyId, id, name);
    await loadSubcategories();
  };

  const removeSubcategory = async (id: string) => {
    await storageAdapter.removeSubcategory(currentFamilyId, id);
    await loadSubcategories();
  };

  return {
    loadMonths,
    loadRecurringExpenses,
    loadSubcategories,
    addSubcategory,
    updateSubcategory,
    removeSubcategory,
    
    // Month operations - delegate to storageAdapter
    insertMonth: async (year: number, month: number) => {
      if (!currentFamilyId) return null;
      return storageAdapter.insertMonth(currentFamilyId, year, month);
    },
    
    // Expense operations - delegate to storageAdapter
    insertExpense: async (payload: ExpensePayload) => {
      if (!currentFamilyId) return null;
      return storageAdapter.insertExpense(currentFamilyId, payload);
    },
    
    updateMonthIncome: async (monthId: string, income: number) => {
      return storageAdapter.updateMonthIncome(currentFamilyId, monthId, income);
    },
    
    updateExpense: async (id: string, data: ExpenseUpdateData) => {
      return storageAdapter.updateExpense(currentFamilyId, id, data);
    },
    
    setExpensePending: async (id: string, pending: boolean) => {
      return storageAdapter.setExpensePending(currentFamilyId, id, pending);
    },
    
    deleteExpense: async (id: string) => {
      return storageAdapter.deleteExpense(currentFamilyId, id);
    },
    
    // Recurring expense operations - delegate to storageAdapter
    insertRecurring: async (payload: RecurringPayload) => {
      if (!currentFamilyId) return null;
      return storageAdapter.insertRecurring(currentFamilyId, payload);
    },
    
    updateRecurring: async (id: string, data: RecurringUpdateData, updatePastExpenses?: boolean) => {
      return storageAdapter.updateRecurring(currentFamilyId, id, data, updatePastExpenses);
    },
    
    deleteRecurring: async (id: string) => {
      return storageAdapter.deleteRecurring(currentFamilyId, id);
    },
    
    applyRecurringToMonth: async (recurring: RecurringExpense, monthId: string) => {
      if (!currentFamilyId) return false;
      return storageAdapter.applyRecurringToMonth(currentFamilyId, recurring, monthId);
    },
    
    // Income sources operations
    insertIncomeSource: async (monthId: string, name: string, value: number) => {
      return storageAdapter.insertIncomeSource(currentFamilyId, monthId, name, value);
    },
    
    updateIncomeSource: async (id: string, name: string, value: number) => {
      return storageAdapter.updateIncomeSource(currentFamilyId, id, name, value);
    },
    
    deleteIncomeSource: async (id: string) => {
      return storageAdapter.deleteIncomeSource(currentFamilyId, id);
    },
    
    // Note: updateGoals removed - use updateMonthLimits in useBudget.ts instead
  } as const;
};