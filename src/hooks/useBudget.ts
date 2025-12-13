import { useState, useEffect } from 'react';
import { Month, Expense, CategoryKey, CATEGORIES } from '@/types/budget';

const STORAGE_KEY = 'budget-data';
const RECURRING_KEY = 'recurring-expenses';

interface BudgetData {
  months: Month[];
  currentMonthId: string | null;
}

const generateMonthId = (year: number, month: number): string => {
  return `${year}-${month.toString().padStart(2, '0')}`;
};

const getMonthLabel = (year: number, month: number): string => {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[month - 1]}/${year}`;
};

export const useBudget = () => {
  const [months, setMonths] = useState<Month[]>([]);
  const [currentMonthId, setCurrentMonthId] = useState<string | null>(null);
  const [recurringExpenses, setRecurringExpenses] = useState<Omit<Expense, 'id'>[]>([]);

  // Load from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedRecurring = localStorage.getItem(RECURRING_KEY);
    
    if (savedData) {
      const data: BudgetData = JSON.parse(savedData);
      setMonths(data.months);
      setCurrentMonthId(data.currentMonthId);
    }
    
    if (savedRecurring) {
      setRecurringExpenses(JSON.parse(savedRecurring));
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

  const currentMonth = months.find(m => m.id === currentMonthId) || null;

  const addMonth = (year: number, month: number) => {
    const id = generateMonthId(year, month);
    
    if (months.some(m => m.id === id)) {
      return false;
    }

    // Add recurring expenses to the new month
    const newExpenses: Expense[] = recurringExpenses.map((exp, index) => ({
      ...exp,
      id: `${id}-recurring-${index}`,
      isRecurring: true,
    }));

    const newMonth: Month = {
      id,
      label: getMonthLabel(year, month),
      year,
      month,
      income: 0,
      expenses: newExpenses,
    };

    setMonths(prev => [...prev, newMonth].sort((a, b) => a.id.localeCompare(b.id)));
    setCurrentMonthId(id);
    return true;
  };

  const selectMonth = (monthId: string) => {
    setCurrentMonthId(monthId);
  };

  const updateIncome = (income: number) => {
    if (!currentMonthId) return;
    
    setMonths(prev => prev.map(m => 
      m.id === currentMonthId ? { ...m, income } : m
    ));
  };

  const addExpense = (title: string, category: CategoryKey, value: number) => {
    if (!currentMonthId) return;

    const expense: Expense = {
      id: `${currentMonthId}-${Date.now()}`,
      title,
      category,
      value,
      isRecurring: false,
    };

    setMonths(prev => prev.map(m => 
      m.id === currentMonthId 
        ? { ...m, expenses: [...m.expenses, expense] }
        : m
    ));
  };

  const removeExpense = (expenseId: string) => {
    if (!currentMonthId) return;

    setMonths(prev => prev.map(m => 
      m.id === currentMonthId 
        ? { ...m, expenses: m.expenses.filter(e => e.id !== expenseId) }
        : m
    ));
  };

  const addRecurringExpense = (title: string, category: CategoryKey, value: number) => {
    const newRecurring: Omit<Expense, 'id'> = {
      title,
      category,
      value,
      isRecurring: true,
    };

    setRecurringExpenses(prev => [...prev, newRecurring]);
  };

  const removeRecurringExpense = (index: number) => {
    setRecurringExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const updateCategoryPercentages = (percentages: Record<CategoryKey, number>) => {
    // This would update CATEGORIES, but since it's a constant, 
    // we'd need to store custom percentages separately
    // For now, we'll keep the default percentages
  };

  const getCategorySummary = () => {
    if (!currentMonth) {
      return CATEGORIES.map(cat => ({
        ...cat,
        budget: 0,
        spent: 0,
        remaining: 0,
        usedPercentage: 100,
      }));
    }

    return CATEGORIES.map(cat => {
      const budget = (currentMonth.income * cat.percentage) / 100;
      const spent = currentMonth.expenses
        .filter(e => e.category === cat.key)
        .reduce((sum, e) => sum + e.value, 0);
      const remaining = budget - spent;
      const usedPercentage = budget > 0 ? ((budget - spent) / budget) * 100 : 100;

      return {
        ...cat,
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

  return {
    months,
    currentMonth,
    currentMonthId,
    recurringExpenses,
    addMonth,
    selectMonth,
    updateIncome,
    addExpense,
    removeExpense,
    addRecurringExpense,
    removeRecurringExpense,
    getCategorySummary,
    getTotals,
  };
};
