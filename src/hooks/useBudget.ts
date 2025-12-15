import { useState, useEffect } from 'react';
import { Month, Expense, CategoryKey, Subcategory, RecurringExpense } from '@/types/budget';
import { CATEGORIES } from '@/constants/categories';

const STORAGE_KEY = 'budget-data';
const RECURRING_KEY = 'recurring-expenses';
const GOALS_KEY = 'budget-goals';
const SUBCATEGORIES_KEY = 'budget-subcategories';

interface BudgetData {
  months: Month[];
  currentMonthId: string | null;
}

const generateMonthId = (year: number, month: number): string => {
  return `${year}-${month.toString().padStart(2, '0')}`;
};

const getMonthLabel = (year: number, month: number): string => {
  return `${month.toString().padStart(2, '0')}/${year}`;
};

// Calculate which installment number this month represents
const calculateInstallmentNumber = (
  targetYear: number,
  targetMonth: number,
  startYear: number,
  startMonth: number
): number => {
  return (targetYear - startYear) * 12 + (targetMonth - startMonth) + 1;
};

// Check if a recurring expense should appear in a given month
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
  const [months, setMonths] = useState<Month[]>([]);
  const [currentMonthId, setCurrentMonthId] = useState<string | null>(null);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [categoryPercentages, setCategoryPercentages] =
    useState<Record<CategoryKey, number>>(
      Object.fromEntries(
        CATEGORIES.map(c => [c.key, c.percentage])
      ) as Record<CategoryKey, number>
    );

  // Load from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedRecurring = localStorage.getItem(RECURRING_KEY);
    const savedGoals = localStorage.getItem(GOALS_KEY);
    const savedSubcategories = localStorage.getItem(SUBCATEGORIES_KEY);

    if (savedData) {
      const data: BudgetData = JSON.parse(savedData);
      setMonths(data.months);
      setCurrentMonthId(data.currentMonthId);
    }

    if (savedRecurring) {
      const parsed = JSON.parse(savedRecurring);
      // Migrate old format to new format with id
      const migrated = parsed.map((exp: RecurringExpense | Omit<RecurringExpense, 'id'>, index: number) => ({
        ...exp,
        id: (exp as RecurringExpense).id || `recurring-${Date.now()}-${index}`,
      }));
      setRecurringExpenses(migrated);
    }

    if (savedGoals) {
      setCategoryPercentages(JSON.parse(savedGoals));
    }

    if (savedSubcategories) {
      setSubcategories(JSON.parse(savedSubcategories));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const data: BudgetData = { months, currentMonthId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [months, currentMonthId]);

  useEffect(() => {
    localStorage.setItem(RECURRING_KEY, JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  useEffect(() => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(categoryPercentages));
  }, [categoryPercentages]);

  useEffect(() => {
    localStorage.setItem(SUBCATEGORIES_KEY, JSON.stringify(subcategories));
  }, [subcategories]);

  const currentMonth = months.find(m => m.id === currentMonthId) || null;

  // Subcategory management
  const addSubcategory = (name: string, categoryKey: CategoryKey) => {
    const newSubcategory: Subcategory = {
      id: `sub-${Date.now()}`,
      name,
      categoryKey,
    };
    setSubcategories(prev => [...prev, newSubcategory]);
  };

  const updateSubcategory = (id: string, name: string) => {
    setSubcategories(prev =>
      prev.map(s => (s.id === id ? { ...s, name } : s))
    );
  };

  const removeSubcategory = (id: string) => {
    setSubcategories(prev => prev.filter(s => s.id !== id));
    
    // Remove subcategory from expenses
    setMonths(prev =>
      prev.map(m => ({
        ...m,
        expenses: m.expenses.map(e =>
          e.subcategoryId === id ? { ...e, subcategoryId: undefined } : e
        ),
      }))
    );

    // Remove from recurring expenses
    setRecurringExpenses(prev =>
      prev.map(e =>
        e.subcategoryId === id ? { ...e, subcategoryId: undefined } : e
      )
    );
  };

  // Month management
  const addMonth = (year: number, month: number) => {
    const id = generateMonthId(year, month);

    if (months.some(m => m.id === id)) {
      return false;
    }

    const newExpenses: Expense[] = recurringExpenses
      .map((exp) => {
        const result = shouldIncludeRecurringInMonth(exp, year, month);
        if (!result.include) return null;

        const expenseTitle = result.installmentNumber && exp.totalInstallments
          ? `${exp.title} (Parcela ${result.installmentNumber}/${exp.totalInstallments})`
          : exp.title;

        return {
          id: `${id}-recurring-${exp.id}`,
          title: expenseTitle,
          category: exp.category,
          subcategoryId: exp.subcategoryId,
          value: exp.value,
          isRecurring: true,
          isPending: true,
          dueDay: exp.dueDay,
          recurringExpenseId: exp.id,
          installmentInfo: result.installmentNumber ? {
            current: result.installmentNumber,
            total: exp.totalInstallments!,
          } : undefined,
        } as Expense;
      })
      .filter((exp): exp is Expense => exp !== null);

    const newMonth: Month = {
      id,
      label: getMonthLabel(year, month),
      year,
      month,
      income: 0,
      expenses: newExpenses,
    };

    setMonths(prev =>
      [...prev, newMonth].sort((a, b) => a.id.localeCompare(b.id))
    );
    setCurrentMonthId(id);
    return true;
  };

  const removeMonth = (monthId: string) => {
    setMonths(prev => {
      const filtered = prev.filter(m => m.id !== monthId);

      if (currentMonthId === monthId) {
        setCurrentMonthId(
          filtered.length ? filtered[filtered.length - 1].id : null
        );
      }

      return filtered;
    });
  };

  const selectMonth = (monthId: string) => {
    setCurrentMonthId(monthId);
  };

  const updateIncome = (income: number) => {
    if (!currentMonthId) return;

    setMonths(prev =>
      prev.map(m =>
        m.id === currentMonthId ? { ...m, income } : m
      )
    );
  };

  // Expenses
  const addExpense = (
    title: string,
    category: CategoryKey,
    subcategoryId: string | undefined,
    value: number
  ) => {
    if (!currentMonthId) return;

    const expense: Expense = {
      id: `${currentMonthId}-${Date.now()}`,
      title,
      category,
      subcategoryId,
      value,
      isRecurring: false,
    };

    setMonths(prev =>
      prev.map(m =>
        m.id === currentMonthId
          ? { ...m, expenses: [...m.expenses, expense] }
          : m
      )
    );
  };

  const updateExpense = (
    id: string,
    title: string,
    category: CategoryKey,
    subcategoryId: string | undefined,
    value: number,
    isPending?: boolean
  ) => {
    if (!currentMonthId) return;

    setMonths(prev =>
      prev.map(m => {
        if (m.id !== currentMonthId) return m;

        return {
          ...m,
          expenses: m.expenses.map(e =>
            e.id === id
              ? { ...e, title, category, subcategoryId, value, isPending }
              : e
          ),
        };
      })
    );
  };

  const confirmPayment = (expenseId: string) => {
    if (!currentMonthId) return;

    setMonths(prev =>
      prev.map(m => {
        if (m.id !== currentMonthId) return m;

        return {
          ...m,
          expenses: m.expenses.map(e =>
            e.id === expenseId ? { ...e, isPending: false } : e
          ),
        };
      })
    );
  };

  const removeExpense = (expenseId: string) => {
    if (!currentMonthId) return;

    setMonths(prev =>
      prev.map(m =>
        m.id === currentMonthId
          ? { ...m, expenses: m.expenses.filter(e => e.id !== expenseId) }
          : m
      )
    );
  };

  // Recurring expenses
  const addRecurringExpense = (
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
    const recurringId = `recurring-${Date.now()}`;
    
    const newRecurring: RecurringExpense = {
      id: recurringId,
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

    setRecurringExpenses(prev => [...prev, newRecurring]);

    if (currentMonthId) {
      const currentMonthData = months.find(m => m.id === currentMonthId);
      if (currentMonthData) {
        const result = shouldIncludeRecurringInMonth(newRecurring, currentMonthData.year, currentMonthData.month);
        
        if (result.include) {
          const expenseTitle = result.installmentNumber && totalInstallments
            ? `${title} (Parcela ${result.installmentNumber}/${totalInstallments})`
            : title;

          const expense: Expense = {
            id: `${currentMonthId}-recurring-${recurringId}`,
            title: expenseTitle,
            category,
            subcategoryId,
            value,
            isRecurring: true,
            isPending: true,
            dueDay,
            recurringExpenseId: recurringId,
            installmentInfo: result.installmentNumber ? {
              current: result.installmentNumber,
              total: totalInstallments!,
            } : undefined,
          };

          setMonths(prev =>
            prev.map(m =>
              m.id === currentMonthId
                ? { ...m, expenses: [...m.expenses, expense] }
                : m
            )
          );
        }
      }
    }
  };

  const updateRecurringExpense = (
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
    setRecurringExpenses(prev =>
      prev.map((exp) =>
        exp.id === id 
          ? { 
              ...exp, 
              title, 
              category, 
              subcategoryId, 
              value, 
              dueDay,
              hasInstallments,
              totalInstallments,
              startYear,
              startMonth,
            } 
          : exp
      )
    );

    // Update all existing expenses linked to this recurring expense (past and future)
    setMonths(prev =>
      prev.map(m => ({
        ...m,
        expenses: m.expenses.map(e => {
          if (e.recurringExpenseId !== id) return e;

          // Always update if updatePastExpenses is true, regardless of month
          if (!updatePastExpenses) return e;

          // Recalculate installment info if needed
          let newTitle = title;
          let installmentInfo = e.installmentInfo;

          if (hasInstallments && totalInstallments && startYear && startMonth) {
            const installmentNumber = calculateInstallmentNumber(m.year, m.month, startYear, startMonth);
            if (installmentNumber >= 1 && installmentNumber <= totalInstallments) {
              newTitle = `${title} (Parcela ${installmentNumber}/${totalInstallments})`;
              installmentInfo = { current: installmentNumber, total: totalInstallments };
            }
          } else if (!hasInstallments && e.installmentInfo) {
            // Remove installment info if no longer has installments
            installmentInfo = undefined;
          }

          return {
            ...e,
            title: newTitle,
            category,
            subcategoryId,
            value,
            dueDay,
            installmentInfo,
          };
        }),
      }))
    );
  };

  const removeRecurringExpense = (id: string) => {
    setRecurringExpenses(prev => prev.filter((exp) => exp.id !== id));
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
      const usedPercentage =
        spent === 0 ? 0 : budget > 0 ? (spent / budget) * 100 : 0;

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

    const totalSpent = currentMonth.expenses.reduce(
      (sum, e) => sum + e.value,
      0
    );
    const totalBudget = currentMonth.income;
    const usedPercentage =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

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

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orcamento-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBudget = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);

        if (
          !Array.isArray(data.months) ||
          !Array.isArray(data.recurringExpenses) ||
          !data.categoryPercentages
        ) {
          throw new Error('Invalid file structure');
        }

        // Migrate recurring expenses to new format with id
        const migratedRecurring = data.recurringExpenses.map((exp: RecurringExpense | Omit<RecurringExpense, 'id'>, index: number) => ({
          ...exp,
          id: (exp as RecurringExpense).id || `recurring-imported-${Date.now()}-${index}`,
        }));

        setMonths(data.months);
        setRecurringExpenses(migratedRecurring);
        setCategoryPercentages(data.categoryPercentages);
        setSubcategories(data.subcategories || []);
        setCurrentMonthId(data.currentMonthId ?? null);
      } catch {
        alert('Arquivo inválido ou corrompido');
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
    addSubcategory,
    updateSubcategory,
    removeSubcategory,
    updateGoals: setCategoryPercentages,
    getCategorySummary,
    getTotals,
    exportBudget,
    importBudget,
  };
};
