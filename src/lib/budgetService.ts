import { supabase } from './supabase';

// Thin wrapper around Supabase used by useBudget. Keep functions small and
// directly mappable to existing supabase calls so this is a safe, behavior-preserving
// refactor. Tests / callers can be switched to offlineAdapter later.

export const getMonths = async (familyId: string) => {
  return supabase
    .from('month')
    .select('*')
    .eq('family_id', familyId)
    .order('year', { ascending: true })
    .order('month', { ascending: true });
};

export const getMonthById = async (monthId: string) => {
  return supabase
    .from('month')
    .select('*')
    .eq('id', monthId)
    .maybeSingle();
};

export const getExpensesByMonth = async (monthId: string) => {
  return supabase
    .from('expense')
    .select('*')
    .eq('month_id', monthId);
};

export const getRecurringExpenses = async (familyId: string) => {
  return supabase
    .from('recurring_expense')
    .select('*')
    .eq('family_id', familyId);
};

export const getSubcategories = async (familyId: string) => {
  return supabase
    .from('subcategory')
    .select('*')
    .eq('family_id', familyId);
};

// See getMonthLimits, insertMonthLimit, updateMonthLimit functions below.

export const insertSubcategory = async (familyId: string, name: string, categoryKey: string) => {
  return supabase.from('subcategory').insert({ family_id: familyId, name, category_key: categoryKey });
};

export const updateSubcategoryById = async (id: string, name: string) => {
  return supabase.from('subcategory').update({ name }).eq('id', id);
};

export const deleteSubcategoryById = async (id: string) => {
  return supabase.from('subcategory').delete().eq('id', id);
};

export const clearSubcategoryReferences = async (id: string) => {
  return supabase.from('expense').update({ subcategory_id: null }).eq('subcategory_id', id);
};

export const createChannel = (name: string) => supabase.channel(name);

export const removeChannel = (channel: any) => supabase.removeChannel(channel);

export const insertMonth = async (familyId: string, year: number, month: number) => {
  return supabase
    .from('month')
    .insert({ family_id: familyId, year, month, income: 0 })
    .select()
    .single();
};

// Month limits (category_limit table)
export const getMonthLimits = async (monthId: string) => {
  return supabase
    .from('category_limit')
    .select('*')
    .eq('month_id', monthId);
};

export const insertMonthLimit = async (payload: { month_id: string; category_key: string; percentage: number }) => {
  return supabase.from('category_limit').insert(payload);
};

export const updateMonthLimit = async (monthId: string, categoryKey: string, percentage: number) => {
  return supabase
    .from('category_limit')
    .upsert({ month_id: monthId, category_key: categoryKey, percentage }, { onConflict: 'month_id,category_key' });
};

export const copyLimitsToMonth = async (sourceMonthId: string, targetMonthId: string) => {
  const { data: sourceLimits } = await getMonthLimits(sourceMonthId);
  if (!sourceLimits || sourceLimits.length === 0) return;
  
  const inserts = sourceLimits.map((l: any) => ({
    month_id: targetMonthId,
    category_key: l.category_key,
    percentage: l.percentage
  }));
  
  return supabase.from('category_limit').insert(inserts);
};

export const insertExpense = async (expense: any) => {
  return supabase.from('expense').insert(expense).select().single();
};

export const updateExpenseById = async (id: string, data: any) => {
  return supabase.from('expense').update(data).eq('id', id);
};

export const deleteExpenseById = async (id: string) => {
  return supabase.from('expense').delete().eq('id', id);
};

export const deleteExpensesByMonth = async (monthId: string) => {
  return supabase.from('expense').delete().eq('month_id', monthId);
};

export const deleteMonthById = async (monthId: string) => {
  return supabase.from('month').delete().eq('id', monthId);
};

export const clearRecurringSubcategoryReferences = async (id: string) => {
  return supabase.from('recurring_expense').update({ subcategory_id: null }).eq('subcategory_id', id);
};

export const updateMonthIncome = async (monthId: string, income: number) => {
  return supabase.from('month').update({ income }).eq('id', monthId);
};

export const updateExpense = async (id: string, data: any) => {
  return supabase.from('expense').update(data).eq('id', id);
};

export const setExpensePending = async (id: string, pending: boolean) => {
  return supabase.from('expense').update({ is_pending: pending }).eq('id', id);
};

export const insertRecurring = async (familyId: string, payload: any) => {
  return supabase.from('recurring_expense').insert({ family_id: familyId, ...payload }).select().single();
};

export const updateRecurring = async (id: string, data: any) => {
  return supabase.from('recurring_expense').update(data).eq('id', id);
};

export const deleteRecurring = async (id: string) => {
  return supabase.from('recurring_expense').delete().eq('id', id);
};

export const updateExpensesByRecurringId = async (recurringId: string, data: any) => {
  return supabase.from('expense').update(data).eq('recurring_expense_id', recurringId);
};

