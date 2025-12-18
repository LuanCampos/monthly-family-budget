import * as budgetService from './budgetService';
import { offlineAdapter } from './offlineAdapter';
import { Month, CategoryKey, RecurringExpense, Subcategory } from '@/types';

const getMonthLabel = (year: number, month: number) => `${month.toString().padStart(2, '0')}/${year}`;

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

export const getMonthsWithExpenses = async (familyId: string | null) => {
  if (!familyId) return [] as Month[];

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const offlineMonths = await offlineAdapter.getAllByIndex<any>('months', 'family_id', familyId);
    const monthsWithExpenses: Month[] = await Promise.all(offlineMonths.map(async (m) => {
      const expenses = await offlineAdapter.getAllByIndex<any>('expenses', 'month_id', m.id);
      return {
        id: m.id,
        label: getMonthLabel(m.year, m.month),
        year: m.year,
        month: m.month,
        income: m.income || 0,
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
          installmentInfo: e.installment_current && e.installment_total ? { current: e.installment_current, total: e.installment_total } : undefined,
        }))
      };
    }));
    return monthsWithExpenses.sort((a, b) => a.id.localeCompare(b.id));
  }

  const { data: monthsData, error } = await budgetService.getMonths(familyId);
  if (error || !monthsData) return [] as Month[];

  const monthsWithExpenses: Month[] = await Promise.all(monthsData.map(async (m: any) => {
    const { data: expenses } = await budgetService.getExpensesByMonth(m.id);
    return {
      id: m.id,
      label: getMonthLabel(m.year, m.month),
      year: m.year,
      month: m.month,
      income: m.income || 0,
      expenses: (expenses || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        category: e.category_key as CategoryKey,
        subcategoryId: e.subcategory_id,
        value: e.value,
        isRecurring: e.is_recurring,
        isPending: e.is_pending,
        dueDay: e.due_day,
        recurringExpenseId: e.recurring_expense_id,
        installmentInfo: e.installment_current && e.installment_total ? { current: e.installment_current, total: e.installment_total } : undefined
      }))
    };
  }));

  return monthsWithExpenses;
};

export const getRecurringExpenses = async (familyId: string | null) => {
  if (!familyId) return [] as RecurringExpense[];
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const data = await offlineAdapter.getAllByIndex<any>('recurring_expenses', 'family_id', familyId);
    return (data || []).map(r => ({
      id: r.id,
      title: r.title,
      category: r.category_key as CategoryKey,
      subcategoryId: r.subcategory_id,
      value: r.value,
      isRecurring: true as const,
      dueDay: r.due_day,
      hasInstallments: r.has_installments,
      totalInstallments: r.total_installments,
      startYear: r.start_year,
      startMonth: r.start_month
    }));
  }

  const { data, error } = await budgetService.getRecurringExpenses(familyId);
  if (error) { console.error('Error loading recurring expenses:', error); return [] as RecurringExpense[]; }
  return (data || []).map(r => ({
    id: r.id,
    title: r.title,
    category: r.category_key as CategoryKey,
    subcategoryId: r.subcategory_id,
    value: r.value,
    isRecurring: true as const,
    dueDay: r.due_day,
    hasInstallments: r.has_installments,
    totalInstallments: r.total_installments,
    startYear: r.start_year,
    startMonth: r.start_month
  }));
};

export const getSubcategories = async (familyId: string | null) => {
  if (!familyId) return [] as Subcategory[];
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const data = await offlineAdapter.getAllByIndex<any>('subcategories', 'family_id', familyId);
    return (data || []).map(s => ({ id: s.id, name: s.name, categoryKey: s.category_key as CategoryKey }));
  }

  const { data, error } = await budgetService.getSubcategories(familyId);
  if (error) { console.error('Error loading subcategories:', error); return [] as Subcategory[]; }
  return (data || []).map(s => ({ id: s.id, name: s.name, categoryKey: s.category_key as CategoryKey }));
};

export const getCategoryGoals = async (familyId: string | null) => {
  if (!familyId) return [];
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const data = await offlineAdapter.getAllByIndex<any>('category_goals', 'family_id', familyId);
    return data || [];
  }

  const { data, error } = await budgetService.getCategoryGoals(familyId);
  if (error) { console.error('Error loading category goals:', error); return []; }
  return data || [];
};

export const addSubcategory = async (familyId: string | null, name: string, categoryKey: CategoryKey) => {
  if (!familyId) return;
  const offlineId = offlineAdapter.generateOfflineId('sub');
  const offlineData = { id: offlineId, family_id: familyId, name, category_key: categoryKey };
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.put('subcategories', offlineData as any);
    return offlineData;
  }

  const { error } = await budgetService.insertSubcategory(familyId, name, categoryKey);
  if (error) {
    await offlineAdapter.put('subcategories', offlineData as any);
    await offlineAdapter.sync.add({ type: 'subcategory', action: 'insert', data: offlineData, familyId });
    return offlineData;
  }
  return { success: true };
};

export const updateSubcategory = async (familyId: string | null, id: string, name: string) => {
  if (!familyId) return;
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const sub = await offlineAdapter.get<any>('subcategories', id);
    if (sub) await offlineAdapter.put('subcategories', { ...sub, name } as any);
    return;
  }
  const { error } = await budgetService.updateSubcategoryById(id, name);
  return { error };
};

export const removeSubcategory = async (familyId: string | null, id: string) => {
  if (!familyId) return;
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.delete('subcategories', id);
    return;
  }
  await budgetService.clearSubcategoryReferences(id);
  await budgetService.clearRecurringSubcategoryReferences(id);
  await budgetService.deleteSubcategoryById(id);
};

export const insertMonth = async (familyId: string | null, year: number, month: number) => {
  if (!familyId) return null;
  const offlineMonthId = `${familyId}-${year.toString().padStart(2,'0')}-${month.toString().padStart(2,'0')}`;
  const offlineMonthData = { id: offlineMonthId, family_id: familyId, year, month, income: 0 };

  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    await offlineAdapter.put('months', offlineMonthData as any);
    // add recurring expenses locally
    for (const recurring of (await offlineAdapter.getAllByIndex<any>('recurring_expenses','family_id', familyId)) || []) {
      const result = shouldIncludeRecurringInMonth(recurring, year, month);
      if (result.include) {
        const expenseData = {
          id: offlineAdapter.generateOfflineId('exp'),
          family_id: familyId,
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

  const { data, error } = await budgetService.insertMonth(familyId, year, month);
  if (error || !data) {
    await offlineAdapter.put('months', offlineMonthData as any);
    await offlineAdapter.sync.add({ type: 'month', action: 'insert', data: offlineMonthData, familyId });
    return offlineMonthData;
  }

  // Add recurring expenses into the created cloud month
  for (const recurring of (await getRecurringExpenses(familyId)) || []) {
    const result = shouldIncludeRecurringInMonth(recurring as any, year, month);
    if (result.include) {
      await budgetService.insertExpense({
        family_id: familyId,
        month_id: data.id,
        title: recurring.title,
        category_key: recurring.category,
        subcategory_id: recurring.subcategoryId,
        value: recurring.value,
        is_recurring: true,
        is_pending: true,
        due_day: recurring.dueDay,
        recurring_expense_id: recurring.id,
        installment_current: result.installmentNumber,
        installment_total: recurring.totalInstallments,
      });
    }
  }

  return data;
};

export const insertExpense = async (familyId: string | null, payload: any) => {
  if (!familyId) return null;
  const offlineExpenseData = {
    id: offlineAdapter.generateOfflineId('exp'),
    family_id: familyId,
    month_id: payload.month_id,
    title: payload.title,
    category_key: payload.category_key,
    subcategory_id: payload.subcategory_id || null,
    value: payload.value,
    is_recurring: payload.is_recurring || false,
    is_pending: payload.is_pending || false,
  };
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) { await offlineAdapter.put('expenses', offlineExpenseData as any); return offlineExpenseData; }
  const res = await budgetService.insertExpense(payload);
  if (res.error) {
    await offlineAdapter.put('expenses', offlineExpenseData as any);
    await offlineAdapter.sync.add({ type: 'expense', action: 'insert', data: offlineExpenseData, familyId });
  }
  return res;
};

export const updateMonthIncome = async (familyId: string | null, monthId: string, income: number) => {
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const month = await offlineAdapter.get<any>('months', monthId);
    if (month) await offlineAdapter.put('months', { ...month, income } as any);
    return;
  }
  const res = await budgetService.updateMonthIncome(monthId, income);
  return res;
};

export const updateExpense = async (familyId: string | null, id: string, data: any) => {
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const expense = await offlineAdapter.get<any>('expenses', id);
    if (expense) await offlineAdapter.put('expenses', { ...expense, ...data } as any);
    return;
  }
  const res = await budgetService.updateExpense(id, data);
  return res;
};

export const setExpensePending = async (familyId: string | null, id: string, pending: boolean) => {
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const expense = await offlineAdapter.get<any>('expenses', id);
    if (expense) await offlineAdapter.put('expenses', { ...expense, is_pending: pending } as any);
    return;
  }
  const res = await budgetService.setExpensePending(id, pending);
  return res;
};

export const deleteExpense = async (familyId: string | null, id: string) => {
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) { await offlineAdapter.delete('expenses', id); return; }
  const res = await budgetService.deleteExpenseById(id);
  return res;
};

export const insertRecurring = async (familyId: string | null, payload: any) => {
  if (!familyId) return null;
  const offlineId = offlineAdapter.generateOfflineId('rec');
  const offlineRecurringData = { id: offlineId, family_id: familyId, ...payload };
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) { await offlineAdapter.put('recurring_expenses', offlineRecurringData as any); return offlineRecurringData; }
  const res = await budgetService.insertRecurring(familyId, payload);
  if (res.error || !res.data) {
    await offlineAdapter.put('recurring_expenses', offlineRecurringData as any);
    await offlineAdapter.sync.add({ type: 'recurring_expense', action: 'insert', data: offlineRecurringData, familyId });
  }
  return res;
};

export const updateRecurring = async (familyId: string | null, id: string, data: any, updatePastExpenses?: boolean) => {
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const rec = await offlineAdapter.get<any>('recurring_expenses', id);
    if (rec) await offlineAdapter.put('recurring_expenses', { ...rec, ...data } as any);
    return;
  }
  const res = await budgetService.updateRecurring(id, data);
  if (updatePastExpenses) await budgetService.updateExpensesByRecurringId(id, data);
  return res;
};

export const deleteRecurring = async (familyId: string | null, id: string) => {
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) { await offlineAdapter.delete('recurring_expenses', id); return; }
  const res = await budgetService.deleteRecurring(id);
  return res;
};

export const applyRecurringToMonth = async (familyId: string | null, recurring: RecurringExpense, monthId: string) => {
  if (!familyId) return false;
  const result = shouldIncludeRecurringInMonth(recurring as any, recurring.startYear || 0, recurring.startMonth || 0);
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const expenseData = { id: offlineAdapter.generateOfflineId('exp'), family_id: familyId, month_id: monthId, title: recurring.title, category_key: recurring.category, subcategory_id: recurring.subcategoryId || null, value: recurring.value, is_recurring: true, is_pending: true, due_day: recurring.dueDay, recurring_expense_id: recurring.id, installment_current: result.installmentNumber, installment_total: recurring.totalInstallments };
    await offlineAdapter.put('expenses', expenseData as any);
    return true;
  }
  const res = await budgetService.insertExpense({ family_id: familyId, month_id: monthId, title: recurring.title, category_key: recurring.category, subcategory_id: recurring.subcategoryId || null, value: recurring.value, is_recurring: true, is_pending: true, due_day: recurring.dueDay, recurring_expense_id: recurring.id, installment_current: result.installmentNumber, installment_total: recurring.totalInstallments });
  if (res.error) return false;
  return true;
};

export const updateGoals = async (familyId: string | null, newGoals: Record<CategoryKey, number>) => {
  if (!familyId) return;
  for (const [categoryKey, percentage] of Object.entries(newGoals)) {
    const offlineGoalData = { id: `${familyId}-${categoryKey}`, family_id: familyId, category_key: categoryKey, percentage } as any;
    if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) { await offlineAdapter.put('category_goals', offlineGoalData); continue; }
    const { data: existing, error: selectError } = await budgetService.findCategoryGoal(familyId, categoryKey);
    if (selectError) { console.error('Error checking existing goal:', selectError); continue; }
    if (existing?.id) { await budgetService.updateCategoryGoalById(existing.id, { percentage }); } else { await budgetService.insertCategoryGoal({ family_id: familyId, category_key: categoryKey, percentage }); }
  }
};

export const createChannel = (name: string) => budgetService.createChannel(name);
export const removeChannel = (channel: any) => budgetService.removeChannel(channel);

export const deleteExpensesByMonth = async (monthId: string) => {
  // If offline, remove from indexedDB; otherwise use budgetService
  if (!navigator.onLine) {
    const expenses = await offlineAdapter.getAllByIndex<any>('expenses', 'month_id', monthId);
    for (const e of expenses) await offlineAdapter.delete('expenses', e.id);
    return;
  }
  return budgetService.deleteExpensesByMonth(monthId);
};

export const deleteMonthById = async (familyId: string | null, monthId: string) => {
  if (!familyId) return;
  if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
    const expenses = await offlineAdapter.getAllByIndex<any>('expenses', 'month_id', monthId);
    for (const e of expenses) await offlineAdapter.delete('expenses', e.id);
    await offlineAdapter.delete('months', monthId);
    return;
  }
  await budgetService.deleteExpensesByMonth(monthId);
  return budgetService.deleteMonthById(monthId);
};
