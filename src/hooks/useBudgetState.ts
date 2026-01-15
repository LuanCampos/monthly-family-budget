import { useState } from 'react';
import { Month, RecurringExpense, Subcategory, CategoryKey } from '@/types';
import { CATEGORIES } from '@/constants/categories';

export const useBudgetState = () => {
  const [months, setMonths] = useState<Month[]>([]);
  const [currentMonthId, setCurrentMonthId] = useState<string | null>(null);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  // Track whether the initial data load has completed at least once
  // to prevent flash of empty state on page reload
  const [hasInitialized, setHasInitialized] = useState(false);

  const [categoryPercentages, setCategoryPercentages] =
    useState<Record<CategoryKey, number>>(
      Object.fromEntries(
        CATEGORIES.map(c => [c.key, c.percentage])
      ) as Record<CategoryKey, number>
    );

  const currentMonth = months.find(m => m.id === currentMonthId) || null;

  return {
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
    hasInitialized,
    setHasInitialized,
    categoryPercentages,
    setCategoryPercentages,
    currentMonth,
  } as const;
};
