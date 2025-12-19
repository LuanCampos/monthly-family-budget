import { CATEGORIES } from '@/constants/categories';
import * as storageAdapter from '@/lib/storageAdapter';
import * as budgetService from '@/lib/budgetService';
import { offlineAdapter } from '@/lib/offlineAdapter';
import { Month, CategoryKey, RecurringExpense, Subcategory } from '@/types';
import { toast } from 'sonner';

const getMonthLabel = (year: number, month: number): string => `${month.toString().padStart(2, '0')}/${year}`;

const calculateInstallmentNumber = (
  targetYear: number,
  targetMonth: number,
  startYear: number,
  startMonth: number
): number => (targetYear - startYear) * 12 + (targetMonth - startMonth) + 1;

const shouldIncludeRecurringInMonth = (
  recurring: RecurringExpense,
  year: number,
  month: number
): { include: boolean; installmentNumber?: number } => {
  if (!recurring.hasInstallments || !recurring.totalInstallments || !recurring.startYear || !recurring.startMonth) {
    return { include: true };
  }

  const installmentNumber = calculateInstallmentNumber(year, month, recurring.startYear, recurring.startMonth);
  if (installmentNumber < 1 || installmentNumber > recurring.totalInstallments) return { include: false };
  return { include: true, installmentNumber };
};

export const createBudgetApi = (opts: {
  currentFamilyId: string | null;
  shouldUseOffline: (familyId: string | null) => boolean;
  setMonths: (m: Month[]) => void;
  setRecurringExpenses: (r: RecurringExpense[]) => void;
  setSubcategories: (s: Subcategory[]) => void;
  categoryPercentages: Record<CategoryKey, number>;
  setCategoryPercentages: (g: Record<CategoryKey, number>) => void;
  loadMonthsRef: () => Promise<void>;
}) => {
  const { currentFamilyId, shouldUseOffline, setMonths, setRecurringExpenses, setSubcategories, categoryPercentages, setCategoryPercentages, loadMonthsRef } = opts;

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

  const loadCategoryGoals = async () => {
    if (!currentFamilyId) return;
    const goals = await storageAdapter.getCategoryGoals(currentFamilyId);
    if (goals && goals.length > 0) {
      const gp: Record<CategoryKey, number> = { ...categoryPercentages };
      goals.forEach((g: any) => { gp[g.category_key as CategoryKey] = g.percentage; });
      setCategoryPercentages(gp);
    }
  };

  // Subcategory CRUD
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
    loadCategoryGoals,
    addSubcategory,
    updateSubcategory,
    removeSubcategory,
    insertMonth: async (year: number, month: number) => {
      if (!currentFamilyId) return null;
      const offlineMonthId = `${currentFamilyId}-${year.toString().padStart(2,'0')}-${month.toString().padStart(2,'0')}`;
      const offlineMonthData = { id: offlineMonthId, family_id: currentFamilyId, year, month, income: 0 };
      if (shouldUseOffline(currentFamilyId)) {
        await offlineAdapter.put('months', offlineMonthData as any);
        // add recurring expenses locally
        for (const recurring of (await offlineAdapter.getAllByIndex<any>('recurring_expenses','family_id', currentFamilyId)) || []) {
          const result = shouldIncludeRecurringInMonth(recurring, year, month);
          if (result.include) {
            const expenseData = {
              id: offlineAdapter.generateOfflineId('exp'),
              family_id: currentFamilyId,
              month_id: offlineMonthId,
              title: recurring.title,
              category_key: recurring.category_key,
              subcategory_id: recurring.subcategory_id,
              value: recurring.value,
              is_recurring: true,
              is_pending: true,
              due_day: recurring.due_day,
              recurring_expense_id: recurring.id,
              installment_current: result.installmentNumber,
              installment_total: recurring.total_installments,
            };
            await offlineAdapter.put('expenses', expenseData as any);
          }
        }
        return offlineMonthData;
      }
      const { data, error } = await budgetService.insertMonth(currentFamilyId, year, month);
      return { data, error };
    },
    insertExpense: async (payload: any) => {
      if (!currentFamilyId) return null;
      const offlineExpenseData = {
        id: offlineAdapter.generateOfflineId('exp'),
        family_id: currentFamilyId,
        month_id: payload.month_id,
        title: payload.title,
        category_key: payload.category_key,
        subcategory_id: payload.subcategory_id || null,
        value: payload.value,
        is_recurring: payload.is_recurring || false,
        is_pending: payload.is_pending || false,
      };
      if (shouldUseOffline(currentFamilyId)) { await offlineAdapter.put('expenses', offlineExpenseData as any); return offlineExpenseData; }
      const res = await budgetService.insertExpense(payload);
      if (res.error) {
        await offlineAdapter.put('expenses', offlineExpenseData as any);
        await offlineAdapter.sync.add({ type: 'expense', action: 'insert', data: offlineExpenseData, familyId: currentFamilyId });
      }
      return res;
    },
    updateMonthIncome: async (monthId: string, income: number) => {
      if (shouldUseOffline(currentFamilyId)) {
        const month = await offlineAdapter.get<any>('months', monthId);
        if (month) { await offlineAdapter.put('months', { ...month, income } as any); }
        return;
      }
      const res = await budgetService.updateMonthIncome(monthId, income);
      if (res.error) toast.error('Erro ao atualizar renda');
      return res;
    },
    updateExpense: async (id: string, data: any) => {
      if (shouldUseOffline(currentFamilyId)) {
        const expense = await offlineAdapter.get<any>('expenses', id);
        if (expense) await offlineAdapter.put('expenses', { ...expense, ...data } as any);
        return;
      }
      const res = await budgetService.updateExpense(id, data);
      if (res.error) toast.error('Erro ao atualizar despesa');
      return res;
    },
    setExpensePending: async (id: string, pending: boolean) => {
      if (shouldUseOffline(currentFamilyId)) {
        const expense = await offlineAdapter.get<any>('expenses', id);
        if (expense) await offlineAdapter.put('expenses', { ...expense, is_pending: pending } as any);
        return;
      }
      const res = await budgetService.setExpensePending(id, pending);
      if (res.error) toast.error('Erro ao confirmar pagamento');
      return res;
    },
    deleteExpense: async (id: string) => {
      if (shouldUseOffline(currentFamilyId)) { await offlineAdapter.delete('expenses', id); return; }
      const res = await budgetService.deleteExpenseById(id);
      if (res.error) toast.error('Erro ao remover despesa');
      return res;
    },
    insertRecurring: async (payload: any) => {
      if (!currentFamilyId) return null;
      const offlineId = offlineAdapter.generateOfflineId('rec');
      const offlineRecurringData = { id: offlineId, family_id: currentFamilyId, ...payload };
      if (shouldUseOffline(currentFamilyId)) { await offlineAdapter.put('recurring_expenses', offlineRecurringData as any); return offlineRecurringData; }
      const res = await budgetService.insertRecurring(currentFamilyId, payload);
      if (res.error || !res.data) {
        await offlineAdapter.put('recurring_expenses', offlineRecurringData as any);
        await offlineAdapter.sync.add({ type: 'recurring_expense', action: 'insert', data: offlineRecurringData, familyId: currentFamilyId });
      }
      return res;
    },
    updateRecurring: async (id: string, data: any, updatePastExpenses?: boolean) => {
      if (shouldUseOffline(currentFamilyId)) {
        const rec = await offlineAdapter.get<any>('recurring_expenses', id);
        if (rec) await offlineAdapter.put('recurring_expenses', { ...rec, ...data } as any);
        return;
      }
      const res = await budgetService.updateRecurring(id, data);
      if (res.error) toast.error('Erro ao atualizar despesa recorrente');
      if (updatePastExpenses) await budgetService.updateExpensesByRecurringId(id, data);
      return res;
    },
    deleteRecurring: async (id: string) => {
      if (shouldUseOffline(currentFamilyId)) { await offlineAdapter.delete('recurring_expenses', id); return; }
      const res = await budgetService.deleteRecurring(id);
      if (res.error) toast.error('Erro ao remover despesa recorrente');
      return res;
    },
    applyRecurringToMonth: async (recurring: RecurringExpense, monthId: string) => {
      const result = shouldIncludeRecurringInMonth(recurring, recurring.startYear || 0, recurring.startMonth || 0);
      if (shouldUseOffline(currentFamilyId)) {
        const expenseData = { id: offlineAdapter.generateOfflineId('exp'), family_id: currentFamilyId, month_id: monthId, title: recurring.title, category_key: recurring.category, subcategory_id: recurring.subcategoryId || null, value: recurring.value, is_recurring: true, is_pending: true, due_day: recurring.dueDay, recurring_expense_id: recurring.id, installment_current: result.installmentNumber, installment_total: recurring.totalInstallments };
        await offlineAdapter.put('expenses', expenseData as any);
        return true;
      }
      const res = await budgetService.insertExpense({ family_id: currentFamilyId, month_id: monthId, title: recurring.title, category_key: recurring.category, subcategory_id: recurring.subcategoryId || null, value: recurring.value, is_recurring: true, is_pending: true, due_day: recurring.dueDay, recurring_expense_id: recurring.id, installment_current: result.installmentNumber, installment_total: recurring.totalInstallments });
      if (res.error) { toast.error('Erro ao aplicar despesa recorrente'); return false; }
      return true;
    },
    updateGoals: async (newGoals: Record<CategoryKey, number>) => {
      for (const [categoryKey, percentage] of Object.entries(newGoals)) {
        const offlineGoalData = { id: `${currentFamilyId}-${categoryKey}`, family_id: currentFamilyId, category_key: categoryKey, percentage };
        if (shouldUseOffline(currentFamilyId)) { await offlineAdapter.put('category_goals', offlineGoalData as any); continue; }
        const { data: existing, error: selectError } = await budgetService.findCategoryGoal(currentFamilyId, categoryKey);
        if (selectError) { console.error('Error checking existing goal:', selectError); continue; }
        if (existing?.id) { await budgetService.updateCategoryGoalById(existing.id, { percentage }); } else { await budgetService.insertCategoryGoal({ family_id: currentFamilyId, category_key: categoryKey, percentage }); }
      }
    }
  } as const;
};
