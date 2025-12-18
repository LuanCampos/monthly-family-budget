import { useState, useEffect, useCallback } from 'react';
import { Month, Expense, CategoryKey, Subcategory, RecurringExpense } from '@/types/budget';
import { CATEGORIES } from '@/constants/categories';
import { supabase } from '@/lib/supabase';
import { useFamily } from '@/contexts/FamilyContext';
import { offlineDB, generateOfflineId, isOfflineId, syncQueue } from '@/lib/offlineStorage';
import { toast } from 'sonner';

const generateMonthId = (year: number, month: number): string => {
  return `${year}-${month.toString().padStart(2, '0')}`;
};

const getMonthLabel = (year: number, month: number): string => {
  return `${month.toString().padStart(2, '0')}/${year}`;
};

const calculateInstallmentNumber = (
  targetYear: number,
  targetMonth: number,
  startYear: number,
  startMonth: number
): number => {
  return (targetYear - startYear) * 12 + (targetMonth - startMonth) + 1;
};

const shouldIncludeRecurringInMonth = (
  recurring: RecurringExpense,
  year: number,
  month: number
): { include: boolean; installmentNumber?: number } => {
  if (!recurring.hasInstallments || !recurring.totalInstallments || !recurring.startYear || !recurring.startMonth) {
    return { include: true };
  }

  const installmentNumber = calculateInstallmentNumber(year, month, recurring.startYear, recurring.startMonth);
  
  if (installmentNumber < 1 || installmentNumber > recurring.totalInstallments) {
    return { include: false };
  }

  return { include: true, installmentNumber };
};

export const useBudget = () => {
  const { currentFamilyId } = useFamily();
  
  const [months, setMonths] = useState<Month[]>([]);
  const [currentMonthId, setCurrentMonthId] = useState<string | null>(null);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryPercentages, setCategoryPercentages] =
    useState<Record<CategoryKey, number>>(
      Object.fromEntries(
        CATEGORIES.map(c => [c.key, c.percentage])
      ) as Record<CategoryKey, number>
    );

  const currentMonth = months.find(m => m.id === currentMonthId) || null;

  // Helper to check if we should use offline storage
  // Always check isOfflineId directly with the familyId parameter to avoid stale closures
  const shouldUseOffline = (familyId: string | null): boolean => {
    if (!familyId) return false;
    return isOfflineId(familyId) || !navigator.onLine;
  };

  // Load months from database or offline storage
  const loadMonths = useCallback(async () => {
    if (!currentFamilyId) return;

    if (shouldUseOffline(currentFamilyId)) {
      // Load from IndexedDB
      const offlineMonths = await offlineDB.getAllByIndex<any>('months', 'family_id', currentFamilyId);
      
      const monthsWithExpenses: Month[] = await Promise.all(
        offlineMonths.map(async (m) => {
          const expenses = await offlineDB.getAllByIndex<any>('expenses', 'month_id', m.id);
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
              installmentInfo: e.installment_current && e.installment_total ? {
                current: e.installment_current,
                total: e.installment_total
              } : undefined
            }))
          };
        })
      );

      setMonths(monthsWithExpenses.sort((a, b) => a.id.localeCompare(b.id)));
      return;
    }

    // Load from Supabase
    const { data: monthsData, error } = await supabase
      .from('month')
      .select('*')
      .eq('family_id', currentFamilyId)
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (error) {
      console.error('Error loading months:', error);
      return;
    }

    if (!monthsData) return;

    const monthsWithExpenses: Month[] = await Promise.all(
      monthsData.map(async (m) => {
        const { data: expenses } = await supabase
          .from('expense')
          .select('*')
          .eq('month_id', m.id);

        return {
          id: m.id,
          label: getMonthLabel(m.year, m.month),
          year: m.year,
          month: m.month,
          income: m.income || 0,
          expenses: (expenses || []).map(e => ({
          id: e.id,
          title: e.title,
          category: e.category_key as CategoryKey,
          subcategoryId: e.subcategory_id,
            value: e.value,
            isRecurring: e.is_recurring,
            isPending: e.is_pending,
            dueDay: e.due_day,
            recurringExpenseId: e.recurring_expense_id,
            installmentInfo: e.installment_current && e.installment_total ? {
              current: e.installment_current,
              total: e.installment_total
            } : undefined
          }))
        };
      })
    );

    setMonths(monthsWithExpenses);
  }, [currentFamilyId]);

  // Load recurring expenses
  const loadRecurringExpenses = useCallback(async () => {
    if (!currentFamilyId) return;

    if (shouldUseOffline(currentFamilyId)) {
      const data = await offlineDB.getAllByIndex<any>('recurring_expenses', 'family_id', currentFamilyId);
      setRecurringExpenses(data.map(r => ({
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
      })));
      return;
    }

    const { data, error } = await supabase
      .from('recurring_expense')
      .select('*')
      .eq('family_id', currentFamilyId);

    if (error) {
      console.error('Error loading recurring expenses:', error);
      return;
    }

    setRecurringExpenses((data || []).map(r => ({
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
    })));
  }, [currentFamilyId]);

  // Load subcategories
  const loadSubcategories = useCallback(async () => {
    if (!currentFamilyId) return;

    if (shouldUseOffline(currentFamilyId)) {
      const data = await offlineDB.getAllByIndex<any>('subcategories', 'family_id', currentFamilyId);
      setSubcategories(data.map(s => ({
        id: s.id,
        name: s.name,
        categoryKey: s.category_key as CategoryKey
      })));
      return;
    }

    const { data, error } = await supabase
      .from('subcategory')
      .select('*')
      .eq('family_id', currentFamilyId);

    if (error) {
      console.error('Error loading subcategories:', error);
      return;
    }

    setSubcategories((data || []).map(s => ({
      id: s.id,
      name: s.name,
      categoryKey: s.category_key as CategoryKey
    })));
  }, [currentFamilyId]);

  // Load category goals
  const loadCategoryGoals = useCallback(async () => {
    if (!currentFamilyId) return;

    if (shouldUseOffline(currentFamilyId)) {
      const data = await offlineDB.getAllByIndex<any>('category_goals', 'family_id', currentFamilyId);
      if (data && data.length > 0) {
        const goals: Record<CategoryKey, number> = { ...categoryPercentages };
        data.forEach(g => {
          goals[g.category_key as CategoryKey] = g.percentage;
        });
        setCategoryPercentages(goals);
      }
      return;
    }

    const { data, error } = await supabase
      .from('category_goal')
      .select('*')
      .eq('family_id', currentFamilyId);

    if (error) {
      console.error('Error loading category goals:', error);
      return;
    }

    if (data && data.length > 0) {
      const goals: Record<CategoryKey, number> = { ...categoryPercentages };
      data.forEach(g => {
        goals[g.category_key as CategoryKey] = g.percentage;
      });
      setCategoryPercentages(goals);
    }
  }, [currentFamilyId]);

  // Initial data load - reset state and reload when family changes
  useEffect(() => {
    const loadData = async () => {
      // Reset all state when family changes or is cleared
      setMonths([]);
      setRecurringExpenses([]);
      setSubcategories([]);
      setCurrentMonthId(null);
      setCategoryPercentages(
        Object.fromEntries(CATEGORIES.map(c => [c.key, c.percentage])) as Record<CategoryKey, number>
      );

      if (!currentFamilyId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([
          loadMonths(),
          loadRecurringExpenses(),
          loadSubcategories(),
          loadCategoryGoals()
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados do orçamento:', error);
        toast.error('Erro ao carregar dados desta família. Tente recarregar a página.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentFamilyId]);

  // Auto-select the most recent month after months are loaded
  useEffect(() => {
    if (months.length > 0 && !currentMonthId) {
      // Select the most recent month (last in the sorted array)
      const mostRecent = months[months.length - 1];
      setCurrentMonthId(mostRecent.id);
    }
  }, [months, currentMonthId]);

  // Set up realtime subscriptions (only for cloud families)
  useEffect(() => {
    if (!currentFamilyId || isOfflineId(currentFamilyId) || !navigator.onLine) return;

    const channel = supabase
      .channel(`budget-${currentFamilyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'month', filter: `family_id=eq.${currentFamilyId}` }, () => {
        loadMonths();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense' }, () => {
        loadMonths();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_expense', filter: `family_id=eq.${currentFamilyId}` }, () => {
        loadRecurringExpenses();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory', filter: `family_id=eq.${currentFamilyId}` }, () => {
        loadSubcategories();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_goal', filter: `family_id=eq.${currentFamilyId}` }, () => {
        loadCategoryGoals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentFamilyId, loadMonths, loadRecurringExpenses, loadSubcategories, loadCategoryGoals]);

  // Subcategory management
  const addSubcategory = async (name: string, categoryKey: CategoryKey) => {
    if (!currentFamilyId) return;

    // For offline DB we need a local id, but for cloud inserts we must NOT send custom IDs (table uses UUID)
    const offlineId = generateOfflineId('sub');
    const offlineData = {
      id: offlineId,
      family_id: currentFamilyId,
      name,
      category_key: categoryKey,
    };

    if (shouldUseOffline(currentFamilyId)) {
      await offlineDB.put('subcategories', offlineData);
      await loadSubcategories();
      return;
    }

    const { error } = await supabase.from('subcategory').insert({
      family_id: currentFamilyId,
      name,
      category_key: categoryKey,
    });

    if (error) {
      // Fallback to offline
      await offlineDB.put('subcategories', offlineData);
      await syncQueue.add({ type: 'subcategory', action: 'insert', data: offlineData, familyId: currentFamilyId });
      toast.warning('Salvo localmente. Sincronizará quando online.');
    }

    await loadSubcategories();
  };

  const updateSubcategory = async (id: string, name: string) => {
    if (shouldUseOffline(currentFamilyId)) {
      const sub = await offlineDB.get<any>('subcategories', id);
      if (sub) {
        await offlineDB.put('subcategories', { ...sub, name });
        await loadSubcategories();
      }
      return;
    }

    const { error } = await supabase.from('subcategory').update({ name }).eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar subcategoria');
    }
    await loadSubcategories();
  };

  const removeSubcategory = async (id: string) => {
    if (shouldUseOffline(currentFamilyId)) {
      await offlineDB.delete('subcategories', id);
      await loadSubcategories();
      await loadMonths();
      return;
    }

    await supabase.from('expense').update({ subcategory_id: null }).eq('subcategory_id', id);
    await supabase.from('recurring_expense').update({ subcategory_id: null }).eq('subcategory_id', id);
    await supabase.from('subcategory').delete().eq('id', id);
    await loadSubcategories();
    await loadMonths();
  };

  // Month management
  const addMonth = async (year: number, month: number) => {
    if (!currentFamilyId) return false;

    // Keep deterministic IDs only for offline storage. Cloud tables use UUIDs.
    const offlineMonthId = `${currentFamilyId}-${generateMonthId(year, month)}`;

    if (months.some(m => m.year === year && m.month === month)) {
      return false;
    }

    const offlineMonthData = {
      id: offlineMonthId,
      family_id: currentFamilyId,
      year,
      month,
      income: 0,
    };

    if (shouldUseOffline(currentFamilyId)) {
      await offlineDB.put('months', offlineMonthData);

      // Add recurring expenses
      for (const recurring of recurringExpenses) {
        const result = shouldIncludeRecurringInMonth(recurring, year, month);
        if (result.include) {
          const expenseData = {
            id: generateOfflineId('exp'),
            family_id: currentFamilyId,
            month_id: offlineMonthId,
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
          };
          await offlineDB.put('expenses', expenseData);
        }
      }

      setCurrentMonthId(offlineMonthId);
      await loadMonths();
      return true;
    }

    const { data: createdMonth, error } = await supabase
      .from('month')
      .insert({
        family_id: currentFamilyId,
        year,
        month,
        income: 0,
      })
      .select()
      .single();

    if (error || !createdMonth) {
      // Fallback to offline
      await offlineDB.put('months', offlineMonthData);
      await syncQueue.add({ type: 'month', action: 'insert', data: offlineMonthData, familyId: currentFamilyId });
      toast.warning('Salvo localmente.');

      setCurrentMonthId(offlineMonthId);
      await loadMonths();
      return true;
    }

    // Add recurring expenses into the created cloud month
    for (const recurring of recurringExpenses) {
      const result = shouldIncludeRecurringInMonth(recurring, year, month);
      if (result.include) {
        await supabase.from('expense').insert({
          family_id: currentFamilyId,
          month_id: createdMonth.id,
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

    setCurrentMonthId(createdMonth.id);
    await loadMonths();
    return true;
  };

  const removeMonth = async (monthId: string) => {
    if (shouldUseOffline(currentFamilyId)) {
      const expenses = await offlineDB.getAllByIndex<any>('expenses', 'month_id', monthId);
      for (const exp of expenses) await offlineDB.delete('expenses', exp.id);
      await offlineDB.delete('months', monthId);
    } else {
      await supabase.from('expense').delete().eq('month_id', monthId);
      await supabase.from('month').delete().eq('id', monthId);
    }

    if (currentMonthId === monthId) {
      const remaining = months.filter(m => m.id !== monthId);
      setCurrentMonthId(remaining.length ? remaining[remaining.length - 1].id : null);
    }
    await loadMonths();
  };

  const selectMonth = (monthId: string) => {
    setCurrentMonthId(monthId);
  };

  const updateIncome = async (income: number) => {
    if (!currentMonthId) return;

    if (shouldUseOffline(currentFamilyId)) {
      const month = await offlineDB.get<any>('months', currentMonthId);
      if (month) {
        await offlineDB.put('months', { ...month, income });
        await loadMonths();
      }
      return;
    }

    const { error } = await supabase.from('month').update({ income }).eq('id', currentMonthId);
    if (error) {
      toast.error('Erro ao atualizar renda');
    }
    await loadMonths();
  };

  // Expenses
  const addExpense = async (
    title: string,
    category: CategoryKey,
    subcategoryId: string | undefined,
    value: number
  ) => {
    if (!currentMonthId) return;

    const offlineExpenseData = {
      id: generateOfflineId('exp'),
      family_id: currentFamilyId,
      month_id: currentMonthId,
      title,
      category_key: category,
      subcategory_id: subcategoryId || null,
      value,
      is_recurring: false,
      is_pending: false,
    };

    if (shouldUseOffline(currentFamilyId)) {
      await offlineDB.put('expenses', offlineExpenseData);
      await loadMonths();
      return;
    }

    // Cloud insert: do not send custom id (UUID in DB)
    const { error } = await supabase.from('expense').insert({
      family_id: currentFamilyId,
      month_id: currentMonthId,
      title,
      category_key: category,
      subcategory_id: subcategoryId || null,
      value,
      is_recurring: false,
      is_pending: false,
    });

    if (error) {
      await offlineDB.put('expenses', offlineExpenseData);
      await syncQueue.add({ type: 'expense', action: 'insert', data: offlineExpenseData, familyId: currentFamilyId || '' });
      toast.warning('Salvo localmente.');
    }

    await loadMonths();
  };

  const updateExpense = async (
    id: string,
    title: string,
    category: CategoryKey,
    subcategoryId: string | undefined,
    value: number,
    isPending?: boolean
  ) => {
    const updateData = {
      title,
      category_key: category,
      subcategory_id: subcategoryId || null,
      value,
      is_pending: isPending ?? false
    };

    if (shouldUseOffline(currentFamilyId)) {
      const expense = await offlineDB.get<any>('expenses', id);
      if (expense) {
        await offlineDB.put('expenses', { ...expense, ...updateData });
        await loadMonths();
      }
      return;
    }

    const { error } = await supabase.from('expense').update(updateData).eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar despesa');
    }
    await loadMonths();
  };

  const confirmPayment = async (expenseId: string) => {
    if (shouldUseOffline(currentFamilyId)) {
      const expense = await offlineDB.get<any>('expenses', expenseId);
      if (expense) {
        await offlineDB.put('expenses', { ...expense, is_pending: false });
        await loadMonths();
      }
      return;
    }

    const { error } = await supabase.from('expense').update({ is_pending: false }).eq('id', expenseId);
    if (error) {
      toast.error('Erro ao confirmar pagamento');
    }
    await loadMonths();
  };

  const removeExpense = async (expenseId: string) => {
    if (shouldUseOffline(currentFamilyId)) {
      await offlineDB.delete('expenses', expenseId);
      await loadMonths();
      return;
    }

    const { error } = await supabase.from('expense').delete().eq('id', expenseId);
    if (error) {
      toast.error('Erro ao remover despesa');
    }
    await loadMonths();
  };

  // Recurring expenses
  const addRecurringExpense = async (
    title: string,
    category: CategoryKey,
    subcategoryId: string | undefined,
    value: number,
    dueDay?: number,
    hasInstallments?: boolean,
    totalInstallments?: number,
    startYear?: number,
    startMonth?: number
  ) => {
    if (!currentFamilyId) return;

    const offlineId = generateOfflineId('rec');
    const offlineRecurringData = {
      id: offlineId,
      family_id: currentFamilyId,
      title,
      category_key: category,
      subcategory_id: subcategoryId || null,
      value,
      due_day: dueDay,
      has_installments: hasInstallments,
      total_installments: totalInstallments,
      start_year: startYear,
      start_month: startMonth,
    };

    if (shouldUseOffline(currentFamilyId)) {
      await offlineDB.put('recurring_expenses', offlineRecurringData);

      // Add to current month if applicable
      if (currentMonthId && currentMonth) {
        const recurring: RecurringExpense = {
          id: offlineId,
          title,
          category,
          subcategoryId,
          value,
          isRecurring: true,
          dueDay,
          hasInstallments,
          totalInstallments,
          startYear,
          startMonth,
        };

        const result = shouldIncludeRecurringInMonth(recurring, currentMonth.year, currentMonth.month);
        if (result.include) {
          const expenseData = {
            id: generateOfflineId('exp'),
            family_id: currentFamilyId,
            month_id: currentMonthId,
            title,
            category_key: category,
            subcategory_id: subcategoryId || null,
            value,
            is_recurring: true,
            is_pending: true,
            due_day: dueDay,
            recurring_expense_id: offlineId,
            installment_current: result.installmentNumber,
            installment_total: totalInstallments,
          };
          await offlineDB.put('expenses', expenseData);
        }
      }

      await loadRecurringExpenses();
      await loadMonths();
      return;
    }

    // Cloud insert: do not send custom id (UUID in DB)
    const { data: newRecurring, error } = await supabase
      .from('recurring_expense')
      .insert({
        family_id: currentFamilyId,
        title,
        category_key: category,
        subcategory_id: subcategoryId || null,
        value,
        due_day: dueDay,
        has_installments: hasInstallments,
        total_installments: totalInstallments,
        start_year: startYear,
        start_month: startMonth,
      })
      .select()
      .single();

    if (error || !newRecurring) {
      await offlineDB.put('recurring_expenses', offlineRecurringData);
      await syncQueue.add({ type: 'recurring_expense', action: 'insert', data: offlineRecurringData, familyId: currentFamilyId });
      toast.warning('Salvo localmente.');
      await loadRecurringExpenses();
      return;
    }

    // Add to current month
    if (currentMonthId && currentMonth) {
      const recurring: RecurringExpense = {
        id: newRecurring.id,
        title,
        category,
        subcategoryId,
        value,
        isRecurring: true,
        dueDay,
        hasInstallments,
        totalInstallments,
        startYear,
        startMonth
      };

      const result = shouldIncludeRecurringInMonth(recurring, currentMonth.year, currentMonth.month);
      if (result.include) {
        await supabase.from('expense').insert({
          family_id: currentFamilyId,
          month_id: currentMonthId,
          title,
          category_key: category,
          subcategory_id: subcategoryId || null,
          value,
          is_recurring: true,
          is_pending: true,
          due_day: dueDay,
          recurring_expense_id: newRecurring.id,
          installment_current: result.installmentNumber,
          installment_total: totalInstallments
        });
      }
    }

    await loadRecurringExpenses();
    await loadMonths();
  };

  const updateRecurringExpense = async (
    id: string,
    title: string,
    category: CategoryKey,
    subcategoryId: string | undefined,
    value: number,
    dueDay?: number,
    hasInstallments?: boolean,
    totalInstallments?: number,
    startYear?: number,
    startMonth?: number,
    updatePastExpenses?: boolean
  ) => {
    const updateData = {
      title,
      category_key: category,
      subcategory_id: subcategoryId || null,
      value,
      due_day: dueDay,
      has_installments: hasInstallments,
      total_installments: totalInstallments,
      start_year: startYear,
      start_month: startMonth
    };

    if (shouldUseOffline(currentFamilyId)) {
      const rec = await offlineDB.get<any>('recurring_expenses', id);
      if (rec) {
        await offlineDB.put('recurring_expenses', { ...rec, ...updateData });
        await loadRecurringExpenses();
      }
      return;
    }

    const { error } = await supabase.from('recurring_expense').update(updateData).eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar despesa recorrente');
      return;
    }

    if (updatePastExpenses) {
      await supabase
        .from('expense')
        .update({
          title,
          category_key: category,
          subcategory_id: subcategoryId || null,
          value,
          due_day: dueDay
        })
        .eq('recurring_expense_id', id);
    }

    await loadRecurringExpenses();
    await loadMonths();
  };

  const removeRecurringExpense = async (id: string) => {
    if (shouldUseOffline(currentFamilyId)) {
      await offlineDB.delete('recurring_expenses', id);
      await loadRecurringExpenses();
      return;
    }

    const { error } = await supabase.from('recurring_expense').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover despesa recorrente');
    }
    await loadRecurringExpenses();
  };

  const applyRecurringToCurrentMonth = async (recurringId: string): Promise<boolean> => {
    if (!currentMonthId || !currentMonth) return false;

    const alreadyExists = currentMonth.expenses.some(e => e.recurringExpenseId === recurringId);
    if (alreadyExists) return false;

    const recurring = recurringExpenses.find(r => r.id === recurringId);
    if (!recurring) return false;

    const result = shouldIncludeRecurringInMonth(recurring, currentMonth.year, currentMonth.month);
    if (!result.include) return false;

    const offlineExpenseData = {
      id: generateOfflineId('exp'),
      family_id: currentFamilyId,
      month_id: currentMonthId,
      title: recurring.title,
      category_key: recurring.category,
      subcategory_id: recurring.subcategoryId || null,
      value: recurring.value,
      is_recurring: true,
      is_pending: true,
      due_day: recurring.dueDay,
      recurring_expense_id: recurringId,
      installment_current: result.installmentNumber,
      installment_total: recurring.totalInstallments,
    };

    if (shouldUseOffline(currentFamilyId)) {
      await offlineDB.put('expenses', offlineExpenseData);
      await loadMonths();
      return true;
    }

    // Cloud insert: do not send custom id (UUID in DB)
    const { error } = await supabase.from('expense').insert({
      family_id: currentFamilyId,
      month_id: currentMonthId,
      title: recurring.title,
      category_key: recurring.category,
      subcategory_id: recurring.subcategoryId || null,
      value: recurring.value,
      is_recurring: true,
      is_pending: true,
      due_day: recurring.dueDay,
      recurring_expense_id: recurringId,
      installment_current: result.installmentNumber,
      installment_total: recurring.totalInstallments,
    });

    if (error) {
      toast.error('Erro ao aplicar despesa recorrente');
      return false;
    }

    await loadMonths();
    return true;
  };

  // Goals
  const updateGoals = async (newGoals: Record<CategoryKey, number>) => {
    if (!currentFamilyId) return;

    setCategoryPercentages(newGoals);

    for (const [categoryKey, percentage] of Object.entries(newGoals)) {
      const offlineGoalData = {
        id: `${currentFamilyId}-${categoryKey}`,
        family_id: currentFamilyId,
        category_key: categoryKey,
        percentage,
      };

      if (shouldUseOffline(currentFamilyId)) {
        await offlineDB.put('category_goals', offlineGoalData);
        continue;
      }

      // Cloud: category_goal.id is UUID; do not send custom id.
      // Also avoid relying on a unique constraint that may not exist.
      const { data: existing, error: selectError } = await supabase
        .from('category_goal')
        .select('id')
        .eq('family_id', currentFamilyId)
        .eq('category_key', categoryKey)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing goal:', selectError);
        continue;
      }

      if (existing?.id) {
        const { error } = await supabase
          .from('category_goal')
          .update({ percentage })
          .eq('id', existing.id);
        if (error) console.error('Error updating goal:', error);
      } else {
        const { error } = await supabase
          .from('category_goal')
          .insert({
            family_id: currentFamilyId,
            category_key: categoryKey,
            percentage,
          });
        if (error) console.error('Error inserting goal:', error);
      }
    }
  };

  // Calculations
  const getCategorySummary = () => {
    if (!currentMonth) {
      return CATEGORIES.map(cat => ({
        ...cat,
        percentage: categoryPercentages[cat.key],
        budget: 0,
        spent: 0,
        remaining: 0,
        usedPercentage: 0,
      }));
    }

    return CATEGORIES.map(cat => {
      const percentage = categoryPercentages[cat.key] ?? cat.percentage;
      const budget = (currentMonth.income * percentage) / 100;

      const spent = currentMonth.expenses
        .filter(e => e.category === cat.key)
        .reduce((sum, e) => sum + e.value, 0);

      const remaining = budget - spent;
      const usedPercentage = spent === 0 ? 0 : budget > 0 ? (spent / budget) * 100 : 0;

      return {
        ...cat,
        percentage,
        budget,
        spent,
        remaining,
        usedPercentage: Math.max(0, usedPercentage),
      };
    });
  };

  const getTotals = () => {
    if (!currentMonth) {
      return { totalSpent: 0, totalBudget: 0, usedPercentage: 0 };
    }

    const totalSpent = currentMonth.expenses.reduce((sum, e) => sum + e.value, 0);
    const totalBudget = currentMonth.income;
    const usedPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return { totalSpent, totalBudget, usedPercentage };
  };

  // Import / Export
  const exportBudget = () => {
    const data = {
      version: 3,
      exportedAt: new Date().toISOString(),
      months,
      recurringExpenses,
      categoryPercentages,
      subcategories,
      currentMonthId,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orcamento-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBudget = async (file: File) => {
    if (!currentFamilyId) return;

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);

        if (!Array.isArray(data.months) || !Array.isArray(data.recurringExpenses) || !data.categoryPercentages) {
          throw new Error('Invalid file structure');
        }

        // Import to offline storage (works for both online and offline families)
        for (const sub of data.subcategories || []) {
          await offlineDB.put('subcategories', {
            id: sub.id,
            family_id: currentFamilyId,
            name: sub.name,
            category_key: sub.categoryKey
          });
        }

        for (const rec of data.recurringExpenses) {
          await offlineDB.put('recurring_expenses', {
            id: rec.id,
            family_id: currentFamilyId,
            title: rec.title,
            category_key: rec.category,
            subcategory_id: rec.subcategoryId || null,
            value: rec.value,
            due_day: rec.dueDay,
            has_installments: rec.hasInstallments,
            total_installments: rec.totalInstallments,
            start_year: rec.startYear,
            start_month: rec.startMonth
          });
        }

        for (const m of data.months) {
          const monthId = `${currentFamilyId}-${m.id.split('-').slice(-2).join('-')}`;
          await offlineDB.put('months', {
            id: monthId,
            family_id: currentFamilyId,
            year: m.year,
            month: m.month,
            income: m.income
          });

          for (const exp of m.expenses) {
            await offlineDB.put('expenses', {
              id: generateOfflineId('exp'),
              month_id: monthId,
              title: exp.title,
              category_key: exp.category,
              subcategory_id: exp.subcategoryId || null,
              value: exp.value,
              is_recurring: exp.isRecurring,
              is_pending: exp.isPending,
              due_day: exp.dueDay,
              recurring_expense_id: exp.recurringExpenseId || null,
              installment_current: exp.installmentInfo?.current,
              installment_total: exp.installmentInfo?.total
            });
          }
        }

        await updateGoals(data.categoryPercentages);
        toast.success('Dados importados com sucesso!');

        await Promise.all([
          loadMonths(),
          loadRecurringExpenses(),
          loadSubcategories(),
          loadCategoryGoals()
        ]);
      } catch (e) {
        console.error(e);
        toast.error('Arquivo inválido ou corrompido');
      }
    };

    reader.readAsText(file);
  };

  return {
    months,
    currentMonth,
    currentMonthId,
    recurringExpenses,
    categoryPercentages,
    subcategories,
    loading,
    addMonth,
    removeMonth,
    selectMonth,
    updateIncome,
    addExpense,
    updateExpense,
    removeExpense,
    confirmPayment,
    addRecurringExpense,
    updateRecurringExpense,
    removeRecurringExpense,
    applyRecurringToCurrentMonth,
    addSubcategory,
    updateSubcategory,
    removeSubcategory,
    updateGoals,
    getCategorySummary,
    getTotals,
    exportBudget,
    importBudget,
  };
};
