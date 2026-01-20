import { supabase } from '../supabase';
import type { CategoryLimitRow, ExpenseRow, RecurringExpenseRow, SupabaseChannel } from '@/types/database';
import { 
  CreateSubcategoryInputSchema, 
  CreateExpenseInputSchema, 
  CreateRecurringExpenseInputSchema,
  CreateIncomeSourceInputSchema,
  CreateMonthInputSchema
} from '../validators';
import { logger } from '../logger';

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

export const getExpenseById = async (id: string) => {
  return supabase
    .from('expense')
    .select('*')
    .eq('id', id)
    .maybeSingle();
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
  const validation = CreateSubcategoryInputSchema.safeParse({ name, category_key: categoryKey });
  if (!validation.success) {
    logger.warn('budgetService.insertSubcategory.validationFailed', { error: validation.error.message });
    return { data: null, error: new Error('Invalid input: ' + validation.error.message) };
  }
  return supabase.from('subcategory').insert({ family_id: familyId, name: validation.data.name, category_key: validation.data.category_key });
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

export const removeChannel = (channel: SupabaseChannel): void => { supabase.removeChannel(channel); };

export const insertMonth = async (familyId: string, year: number, month: number) => {
  const validation = CreateMonthInputSchema.safeParse({ year, month });
  if (!validation.success) {
    logger.warn('budgetService.insertMonth.validationFailed', { error: validation.error.message });
    return { data: null, error: new Error('Invalid input: ' + validation.error.message) };
  }
  return supabase
    .from('month')
    .insert({ family_id: familyId, year: validation.data.year, month: validation.data.month, income: 0 })
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

export const insertMonthLimit = async (payload: Partial<CategoryLimitRow>) => {
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
  
  const inserts = sourceLimits.map((l: CategoryLimitRow) => ({
    month_id: targetMonthId,
    category_key: l.category_key,
    percentage: l.percentage
  }));
  
  return supabase.from('category_limit').insert(inserts);
};

export const insertExpense = async (expense: Partial<ExpenseRow>) => {
  const validation = CreateExpenseInputSchema.safeParse(expense);
  if (!validation.success) {
    logger.warn('budgetService.insertExpense.validationFailed', { error: validation.error.message });
    return { data: null, error: new Error('Invalid input: ' + validation.error.message) };
  }
  return supabase.from('expense').insert(expense).select().single();
};

export const updateExpenseById = async (id: string, data: Partial<ExpenseRow>) => {
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
  return supabase.from('month').update({ income }).eq('id', monthId).select().single();
};

export const updateExpense = async (id: string, data: Partial<ExpenseRow>) => {
  return supabase.from('expense').update(data).eq('id', id).select().single();
};

export const setExpensePending = async (id: string, pending: boolean) => {
  return supabase.from('expense').update({ is_pending: pending }).eq('id', id).select().single();
};

export const insertRecurring = async (familyId: string, payload: Partial<RecurringExpenseRow>) => {
  const validation = CreateRecurringExpenseInputSchema.safeParse(payload);
  if (!validation.success) {
    logger.warn('budgetService.insertRecurring.validationFailed', { error: validation.error.message });
    return { data: null, error: new Error('Invalid input: ' + validation.error.message) };
  }
  return supabase.from('recurring_expense').insert({ family_id: familyId, ...payload }).select().single();
};

export const updateRecurring = async (id: string, data: Partial<RecurringExpenseRow>) => {
  return supabase.from('recurring_expense').update(data).eq('id', id);
};

export const deleteRecurring = async (id: string) => {
  return supabase.from('recurring_expense').delete().eq('id', id);
};

export const updateExpensesByRecurringId = async (recurringId: string, data: Partial<ExpenseRow>) => {
  return supabase.from('expense').update(data).eq('recurring_expense_id', recurringId);
};

// Income sources
export const getIncomeSourcesByMonth = async (monthId: string) => {
  return supabase
    .from('income_source')
    .select('*')
    .eq('month_id', monthId)
    .order('created_at', { ascending: true });
};

export const insertIncomeSource = async (monthId: string, name: string, value: number) => {
  const validation = CreateIncomeSourceInputSchema.safeParse({ name, value });
  if (!validation.success) {
    logger.warn('budgetService.insertIncomeSource.validationFailed', { error: validation.error.message });
    return { data: null, error: new Error('Invalid input: ' + validation.error.message) };
  }
  return supabase
    .from('income_source')
    .insert({ month_id: monthId, name: validation.data.name, value: validation.data.value })
    .select()
    .single();
};

export const updateIncomeSourceById = async (id: string, name: string, value: number) => {
  return supabase
    .from('income_source')
    .update({ name, value })
    .eq('id', id)
    .select()
    .single();
};

export const deleteIncomeSourceById = async (id: string) => {
  return supabase.from('income_source').delete().eq('id', id);
};

