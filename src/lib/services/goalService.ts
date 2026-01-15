import { supabase } from '../supabase';
import type { GoalRow, GoalEntryRow } from '@/types/database';
import { logger } from '../logger';
import { CreateGoalInputSchema, UpdateGoalInputSchema, CreateGoalEntryInputSchema, CreateManualGoalEntryInputSchema, UpdateGoalEntryInputSchema } from '../validators';

export const getGoals = async (familyId: string) => {
  return supabase
    .from('goal')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });
};

export const getGoalById = async (id: string) => {
  return supabase
    .from('goal')
    .select('*')
    .eq('id', id)
    .maybeSingle();
};

export const getGoalBySubcategoryId = async (subcategoryId: string) => {
  return supabase
    .from('goal')
    .select('*')
    .eq('linked_subcategory_id', subcategoryId)
    .eq('status', 'active')
    .maybeSingle();
};

export const getGoalByCategoryKey = async (categoryKey: string) => {
  return supabase
    .from('goal')
    .select('*')
    .eq('linked_category_key', categoryKey)
    .eq('status', 'active')
    .maybeSingle();
};

export const createGoal = async (data: Partial<GoalRow>) => {
  const validation = CreateGoalInputSchema.safeParse(data);
  if (!validation.success) {
    logger.warn('goalService.createGoal.validationFailed', { error: validation.error.message });
    return { data: null, error: new Error('Invalid input: ' + validation.error.message) };
  }
  return supabase
    .from('goal')
    .insert(validation.data)
    .select()
    .single();
};

export const updateGoal = async (id: string, data: Partial<GoalRow>) => {
  const validation = UpdateGoalInputSchema.safeParse(data);
  if (!validation.success) {
    logger.warn('goalService.updateGoal.validationFailed', { error: validation.error.message });
    return { data: null, error: new Error('Invalid input: ' + validation.error.message) };
  }
  return supabase
    .from('goal')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();
};

export const deleteGoal = async (id: string) => {
  if (!id || typeof id !== 'string' || id.length < 10) {
    return { data: null, error: new Error('Invalid ID') };
  }
  return supabase
    .from('goal')
    .delete()
    .eq('id', id);
};

export const getEntries = async (goalId: string) => {
  return supabase
    .from('goal_entry')
    .select('*')
    .eq('goal_id', goalId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('created_at', { ascending: false });
};

export const getEntryById = async (id: string) => {
  return supabase
    .from('goal_entry')
    .select('*')
    .eq('id', id)
    .maybeSingle();
};

export const getEntryByExpense = async (expenseId: string) => {
  return supabase
    .from('goal_entry')
    .select('*')
    .eq('expense_id', expenseId)
    .maybeSingle();
};

export const createEntry = async (data: Partial<GoalEntryRow>) => {
  const validation = CreateGoalEntryInputSchema.safeParse(data);
  if (!validation.success) {
    logger.warn('goalService.createEntry.validationFailed', { error: validation.error.message });
    return { data: null, error: new Error('Invalid input: ' + validation.error.message) };
  }
  return supabase
    .from('goal_entry')
    .insert(validation.data)
    .select()
    .single();
};

export const createManualEntry = async (data: Partial<GoalEntryRow>) => {
  const validation = CreateManualGoalEntryInputSchema.safeParse(data);
  if (!validation.success) {
    logger.warn('goalService.createManualEntry.validationFailed', { error: validation.error.message });
    return { data: null, error: new Error('Invalid input: ' + validation.error.message) };
  }
  return supabase
    .from('goal_entry')
    .insert(validation.data)
    .select()
    .single();
};

export const updateEntry = async (id: string, data: Partial<GoalEntryRow>) => {
  const validation = UpdateGoalEntryInputSchema.safeParse(data);
  if (!validation.success) {
    logger.warn('goalService.updateEntry.validationFailed', { error: validation.error.message });
    return { data: null, error: new Error('Invalid input: ' + validation.error.message) };
  }
  return supabase
    .from('goal_entry')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();
};

export const deleteEntry = async (id: string) => {
  if (!id || typeof id !== 'string' || id.length < 10) {
    return { data: null, error: new Error('Invalid ID') };
  }
  return supabase
    .from('goal_entry')
    .delete()
    .eq('id', id);
};

export const getHistoricalExpenses = async (subcategoryId: string) => {
  // Get all expenses for this subcategory with month details via JOIN
  const { data: expenses, error: expensesError } = await supabase
    .from('expense')
    .select('*, month!inner(year, month)')
    .eq('subcategory_id', subcategoryId)
    .order('created_at', { ascending: false });

  if (expensesError) {
    return { data: null, error: expensesError };
  }

  if (!expenses || expenses.length === 0) {
    return { data: [], error: null };
  }

  // Get all expense IDs that have been imported
  const { data: entries, error: entriesError } = await supabase
    .from('goal_entry')
    .select('expense_id')
    .not('expense_id', 'is', null);

  if (entriesError) {
    return { data: null, error: entriesError };
  }

  // Create a set of imported expense IDs for efficient lookup
  const importedExpenseIds = new Set((entries || []).map(e => e.expense_id).filter(Boolean));

  // Filter out already imported expenses
  const availableExpenses = expenses.filter(expense => !importedExpenseIds.has(expense.id));

  return { data: availableExpenses, error: null };
};

export const importExpenseAsEntry = async (goalId: string, expenseId: string) => {
  return supabase.rpc('import_expense_as_goal_entry', { goal_id: goalId, expense_id: expenseId });
};

export const calculateMonthlySuggestion = async (goalId: string) => {
  return supabase.rpc('calculate_monthly_contribution_suggestion', { goal_id: goalId });
};

export const getEntriesByGoalIds = async (goalIds: string[]) => {
  if (goalIds.length === 0) {
    return { data: [], error: null };
  }

  return supabase
    .from('goal_entry')
    .select('*')
    .in('goal_id', goalIds)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('created_at', { ascending: false });
};
