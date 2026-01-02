import * as budgetService from '../services/budgetService';
import { offlineAdapter } from './offlineAdapter';
import * as monthAdapter from './monthAdapter';
import * as expenseAdapter from './expenseAdapter';
import * as recurringAdapter from './recurringAdapter';
import * as subcategoryAdapter from './subcategoryAdapter';
import { Month, CategoryKey, RecurringExpense, Subcategory } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { getMonthLabel, shouldIncludeRecurringInMonth } from '../utils/monthUtils';
import { 
  mapIncomeSource, 
  mapExpense, 
  mapRecurringExpense, 
  mapSubcategory, 
  mapIncomeSources, 
  mapExpenses, 
  mapRecurringExpenses, 
  mapSubcategories 
} from '../mappers';

// Re-export adapter functions (except insertMonth which has a wrapper)
export { 
  getIncomeSourcesByMonth,
  insertIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
  updateMonthIncome,
  updateMonthLimits,
  deleteMonth
} from './monthAdapter';

export {
  insertExpense,
  updateExpense,
  setExpensePending,
  deleteExpense
} from './expenseAdapter';

export {
  getRecurringExpenses,
  insertRecurring,
  updateRecurring,
  deleteRecurring,
  applyRecurringToMonth
} from './recurringAdapter';

export {
  getSubcategories,
  insertSubcategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  removeSubcategory
} from './subcategoryAdapter';

const getDefaultLimits = (): Record<CategoryKey, number> => {
  return Object.fromEntries(CATEGORIES.map(c => [c.key, c.percentage])) as Record<CategoryKey, number>;
};

export const getMonthsWithExpenses = async (familyId: string | null) => {
  if (!familyId) return [] as Month[];

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const offlineMonths = await offlineAdapter.getAllByIndex<any>('months', 'family_id', familyId);
    const monthsWithExpenses: Month[] = await Promise.all(offlineMonths.map(async (m) => {
      const expenses = await offlineAdapter.getAllByIndex<any>('expenses', 'month_id', m.id);
      const limits = await offlineAdapter.getAllByIndex<any>('category_limits', 'month_id', m.id);
      const incomeSources = await offlineAdapter.getAllByIndex<any>('income_sources', 'month_id', m.id);
      const categoryLimits: Record<CategoryKey, number> = { ...getDefaultLimits() };
      limits.forEach((l: any) => { categoryLimits[l.category_key as CategoryKey] = l.percentage; });
      
      // Calculate income from sources
      const calculatedIncome = incomeSources.reduce((sum: number, source: any) => sum + (source.value || 0), 0);
      
      return {
        id: m.id,
        label: getMonthLabel(m.year, m.month),
        year: m.year,
        month: m.month,
        income: calculatedIncome || m.income || 0,
        incomeSources: incomeSources.map((s: any) => ({
          id: s.id,
          monthId: s.month_id,
          name: s.name,
          value: s.value,
        })),
        categoryLimits,
        expenses: expenses.map((e: any) => ({
          id: e.id,
          title: e.title,
          category: e.category_key as CategoryKey,
          subcategoryId: e.subcategory_id,
          value: e.value,
          isRecurring: e.is_recurring,
          isPending: e.is_pending,
          dueDay: e.due_day,
          recurringExpenseId: e.recurring_expense_id,
          createdAt:
            typeof e.created_at === 'string'
              ? e.created_at
              : (typeof e.createdAt === 'string' ? e.createdAt : undefined),
          installmentInfo: e.installment_current && e.installment_total ? { current: e.installment_current, total: e.installment_total } : undefined,
        }))
      };
    }));
    return monthsWithExpenses.sort((a, b) => a.id.localeCompare(b.id));
  }

  const { data: monthsData, error } = await budgetService.getMonths(familyId);
  if (error || !monthsData) return [] as Month[];

  const monthsWithExpenses: Month[] = await Promise.all(monthsData.map(async (m: any) => {
    const [{ data: expenses }, { data: limits }, { data: incomeSources }] = await Promise.all([
      budgetService.getExpensesByMonth(m.id),
      budgetService.getMonthLimits(m.id),
      budgetService.getIncomeSourcesByMonth(m.id)
    ]);
    const categoryLimits: Record<CategoryKey, number> = { ...getDefaultLimits() };
    (limits || []).forEach((l: any) => { categoryLimits[l.category_key as CategoryKey] = l.percentage; });
    
    // Calculate income from sources
    const calculatedIncome = (incomeSources || []).reduce((sum: number, source: any) => sum + (source.value || 0), 0);
    
    return {
      id: m.id,
      label: getMonthLabel(m.year, m.month),
      year: m.year,
      month: m.month,
      income: calculatedIncome || m.income || 0,
        incomeSources: mapIncomeSources(incomeSources || []),
      categoryLimits,
        expenses: (expenses || []).map(mapExpense)
    };
  }));

  return monthsWithExpenses;
};

export const createChannel = (name: string) => budgetService.createChannel(name);
export const removeChannel = (channel: any) => budgetService.removeChannel(channel);

// Wrapper for insertMonth to provide required callbacks
export const insertMonth = async (
  familyId: string | null,
  year: number,
  month: number
) => {
  if (!familyId) return null;
  return monthAdapter.insertMonth(familyId, year, month, getMonthsWithExpenses, recurringAdapter.getRecurringExpenses);
};

// Backward compatibility alias
export const deleteMonthById = monthAdapter.deleteMonth;
