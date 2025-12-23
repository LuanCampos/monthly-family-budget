import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRef } from 'react';
import { Month, Expense, CategoryKey, Subcategory, RecurringExpense } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import * as storageAdapter from '@/lib/storageAdapter';
import { useFamily } from '@/contexts/FamilyContext';
import { offlineAdapter } from '@/lib/offlineAdapter';
import { toast } from 'sonner';
import { useBudgetState } from './useBudgetState';
import { createBudgetApi } from './useBudgetApi';

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
  const {
    months,
    setMonths,
    currentMonthId,
    setCurrentMonthId,
    recurringExpenses,
    setRecurringExpenses,
    subcategories,
    setSubcategories,
    loading,
    setLoading,
    categoryPercentages,
    setCategoryPercentages,
    currentMonth,
  } = useBudgetState();

  const api = useMemo(() => createBudgetApi({
    currentFamilyId,
    setMonths,
    setRecurringExpenses,
    setSubcategories,
    categoryPercentages,
    setCategoryPercentages,
  }), [currentFamilyId, setMonths, setRecurringExpenses, setSubcategories, categoryPercentages, setCategoryPercentages]);

  // Track a pending created month id so we can reliably select it after months refresh
  const pendingCreatedMonthIdRef = useRef<string | null>(null);

  // Load months from database or offline storage
  const loadMonths = useCallback(async () => {
    if (!currentFamilyId) return;

      const monthsWithExpenses = await storageAdapter.getMonthsWithExpenses(currentFamilyId);
      setMonths(monthsWithExpenses);
  }, [currentFamilyId]);

  // Load recurring expenses
  const loadRecurringExpenses = useCallback(async () => {
    if (!currentFamilyId) return;

    const recs = await storageAdapter.getRecurringExpenses(currentFamilyId);
    setRecurringExpenses(recs);
  }, [currentFamilyId]);

  // Load subcategories
  const loadSubcategories = useCallback(async () => {
    if (!currentFamilyId) return;

    const subs = await storageAdapter.getSubcategories(currentFamilyId);
    setSubcategories(subs);
  }, [currentFamilyId]);

  // Note: loadCategoryGoals removed - limits are now loaded per-month in getMonthsWithExpenses

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
          api.loadMonths(),
          api.loadRecurringExpenses(),
          api.loadSubcategories()
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
    if (!currentFamilyId || offlineAdapter.isOfflineId(currentFamilyId) || !navigator.onLine) return;

    const channel = storageAdapter.createChannel(`budget-${currentFamilyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'month', filter: `family_id=eq.${currentFamilyId}` }, () => {
        api.loadMonths();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense' }, () => {
        api.loadMonths();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_expense', filter: `family_id=eq.${currentFamilyId}` }, () => {
        api.loadRecurringExpenses();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory', filter: `family_id=eq.${currentFamilyId}` }, () => {
        api.loadSubcategories();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_limit' }, () => {
        api.loadMonths();
      })
      .subscribe();

    return () => {
      storageAdapter.removeChannel(channel);
    };
  }, [currentFamilyId, api]);

  // Subcategory management
  const addSubcategory = async (name: string, categoryKey: CategoryKey) => {
    await api.addSubcategory(name, categoryKey);
  };

  const updateSubcategory = async (id: string, name: string) => {
    await api.updateSubcategory(id, name);
    await api.loadSubcategories();
  };

  const removeSubcategory = async (id: string) => {
    await api.removeSubcategory(id);
    await api.loadSubcategories();
    await api.loadMonths();
  };

  // Month management
  const addMonth = async (year: number, month: number) => {
    if (!currentFamilyId) return false;
    if (months.some(m => m.year === year && m.month === month)) return false;

    // Use storageAdapter which normalizes offline/online behavior
    const res = await storageAdapter.insertMonth(currentFamilyId, year, month);
    if (!res) return false;

    // Try to extract the new id from possible shapes: offline object, direct data, or { data, error }
    const created = res as any;
    let newId: string | null = null;
    if (created.id) newId = created.id;
    else if (created.data && created.data.id) newId = created.data.id;

    // Reload months from adapter to ensure state contains the created month
    const refreshed = await storageAdapter.getMonthsWithExpenses(currentFamilyId);
    // If id wasn't present in the response, find the created month by year/month
    if (!newId) {
      const found = refreshed.find(m => m.year === year && m.month === month);
      newId = found?.id ?? null;
    }

    // If we have a new id, mark it as pending and update months. An effect will select it
    if (newId) {
      pendingCreatedMonthIdRef.current = newId;
    }
    setMonths(refreshed);
    return true;
  };

  // Effect: when months refresh, if there's a pending created month, select it once present
  useEffect(() => {
    const pendingId = pendingCreatedMonthIdRef.current;
    if (pendingId && months.some(m => m.id === pendingId)) {
      setCurrentMonthId(pendingId);
      pendingCreatedMonthIdRef.current = null;
    }
  }, [months]);

  const removeMonth = async (monthId: string) => {
    await storageAdapter.deleteMonthById(currentFamilyId, monthId);

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
    await api.updateMonthIncome(currentMonthId, income);
    await api.loadMonths();
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
      id: offlineAdapter.generateOfflineId('exp'),
      family_id: currentFamilyId,
      month_id: currentMonthId,
      title,
      category_key: category,
      subcategory_id: subcategoryId || null,
      value,
      is_recurring: false,
      is_pending: false,
    };

    await api.insertExpense({ family_id: currentFamilyId, month_id: currentMonthId, title, category_key: category, subcategory_id: subcategoryId || null, value, is_recurring: false, is_pending: false });
    await api.loadMonths();
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

    await api.updateExpense(id, updateData);
    await api.loadMonths();
  };

  const confirmPayment = async (expenseId: string) => {
    await api.setExpensePending(expenseId, false);
    await api.loadMonths();
  };

  const removeExpense = async (expenseId: string) => {
    await api.deleteExpense(expenseId);
    await api.loadMonths();
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

    const insertRes = await api.insertRecurring({ 
      title, 
      category_key: category, 
      subcategory_id: subcategoryId || null, 
      value, 
      due_day: dueDay, 
      has_installments: hasInstallments, 
      total_installments: totalInstallments, 
      start_year: startYear, 
      start_month: startMonth 
    });

    // Determine created recurring id (handles offline object or Supabase response)
    let createdId: string | undefined;
    if (insertRes && typeof insertRes === 'object') {
      if ((insertRes as any).id) createdId = (insertRes as any).id; // offline adapter returned object
      else if ((insertRes as any).data && (insertRes as any).data.id) createdId = (insertRes as any).data.id; // supabase response
    }

    if (currentMonthId && currentMonth) {
      const recurringObj = {
        id: createdId || '',
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
      } as any;

      await api.applyRecurringToMonth(recurringObj, currentMonthId);
    }
    
    await api.loadRecurringExpenses();
    await api.loadMonths();
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

    await api.updateRecurring(id, updateData, updatePastExpenses);
    await api.loadRecurringExpenses();
    await api.loadMonths();
  };

  const removeRecurringExpense = async (id: string) => {
    await api.deleteRecurring(id);
    await api.loadRecurringExpenses();
  };

  const applyRecurringToCurrentMonth = async (recurringId: string): Promise<boolean> => {
    const result = await api.applyRecurringToMonth(recurringExpenses.find(r => r.id === recurringId) as any, currentMonthId as string);
    if (result) {
      await api.loadMonths();
    }
    return result;
  };

  // Update limits for current month
  const updateMonthLimits = async (newLimits: Record<CategoryKey, number>) => {
    if (!currentMonthId || !currentFamilyId) return;
    await storageAdapter.updateMonthLimits(currentFamilyId, currentMonthId, newLimits);
    await api.loadMonths();
  };

  // Note: updateGoals removed - use updateMonthLimits instead

  // Get current month's limits (falling back to defaults if not set)
  const currentMonthLimits = useMemo((): Record<CategoryKey, number> => {
    if (currentMonth?.categoryLimits) {
      return currentMonth.categoryLimits;
    }
    return Object.fromEntries(CATEGORIES.map(c => [c.key, c.percentage])) as Record<CategoryKey, number>;
  }, [currentMonth]);

  // Calculations
  const getCategorySummary = () => {
    if (!currentMonth) {
      return CATEGORIES.map(cat => ({
        ...cat,
        percentage: currentMonthLimits[cat.key],
        budget: 0,
        spent: 0,
        remaining: 0,
        usedPercentage: 0,
      }));
    }

    return CATEGORIES.map(cat => {
      const percentage = currentMonthLimits[cat.key] ?? cat.percentage;
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
              await offlineAdapter.put('subcategories', {
                id: sub.id,
                family_id: currentFamilyId,
                name: sub.name,
                category_key: sub.categoryKey
              } as any);
            }

            for (const rec of data.recurringExpenses) {
              await offlineAdapter.put('recurring_expenses', {
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
              } as any);
            }

            for (const m of data.months) {
              const monthId = `${currentFamilyId}-${m.id.split('-').slice(-2).join('-')}`;
              await offlineAdapter.put('months', {
                id: monthId,
                family_id: currentFamilyId,
                year: m.year,
                month: m.month,
                income: m.income
              } as any);

              for (const exp of m.expenses) {
                await offlineAdapter.put('expenses', {
                  id: offlineAdapter.generateOfflineId('exp'),
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
                } as any);
              }
            }

        // Note: updateGoals removed - limits are now per-month
        toast.success('Dados importados com sucesso!');

        await Promise.all([
          loadMonths(),
          loadRecurringExpenses(),
          loadSubcategories()
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
    currentMonthLimits,
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
    
    updateMonthLimits,
    getCategorySummary,
    getTotals,
    exportBudget,
    importBudget,
  };
};
