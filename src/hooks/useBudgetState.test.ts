import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBudgetState } from './useBudgetState';

import { makeMockMonth } from '@/test/mocks/domain/makeMockMonth';
import { makeMockRecurringExpense } from '@/test/mocks/domain/makeMockRecurringExpense';
import { makeMockSubcategory } from '@/test/mocks/domain/makeMockSubcategory';

// O factory do vi.mock precisa ser inline para evitar ReferenceError
vi.mock('@/constants/categories', () => ({
  CATEGORIES: [
    { key: 'essenciais', name: 'Essenciais', percentage: 55, color: 'hsl(187, 85%, 53%)' },
    { key: 'conforto', name: 'Conforto', percentage: 10, color: 'hsl(160, 84%, 39%)' },
    { key: 'metas', name: 'Metas', percentage: 10, color: 'hsl(48, 96%, 53%)' },
    { key: 'prazeres', name: 'Prazeres', percentage: 10, color: 'hsl(291, 64%, 42%)' },
    { key: 'liberdade', name: 'Liberdade', percentage: 10, color: 'hsl(217, 91%, 60%)' },
    { key: 'conhecimento', name: 'Conhecimento', percentage: 5, color: 'hsl(25, 95%, 53%)' },
  ],
}));

describe('useBudgetState', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useBudgetState());

    expect(result.current.months).toEqual([]);
    expect(result.current.currentMonthId).toBeNull();
    expect(result.current.recurringExpenses).toEqual([]);
    expect(result.current.subcategories).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.hasInitialized).toBe(false);
    expect(result.current.currentMonth).toBeNull();
  });

  it('should initialize categoryPercentages from CATEGORIES', () => {
    const { result } = renderHook(() => useBudgetState());

    expect(result.current.categoryPercentages).toEqual({
      essenciais: 55,
      conforto: 10,
      metas: 10,
      prazeres: 10,
      liberdade: 10,
      conhecimento: 5,
    });
  });

  it('should update months via setMonths', () => {
    const { result } = renderHook(() => useBudgetState());

    const mockMonths = [
      makeMockMonth({ id: 'month-1', year: 2025, month: 1, income: 5000, expenses: [] }),
      makeMockMonth({ id: 'month-2', year: 2025, month: 2, income: 5500, expenses: [] }),
    ];

    act(() => {
      result.current.setMonths(mockMonths as never);
    });

    expect(result.current.months).toEqual(mockMonths);
  });

  it('should update currentMonthId via setCurrentMonthId', () => {
    const { result } = renderHook(() => useBudgetState());

    act(() => {
      result.current.setCurrentMonthId('month-123');
    });

    expect(result.current.currentMonthId).toBe('month-123');
  });

  it('should compute currentMonth from months and currentMonthId', () => {
    const { result } = renderHook(() => useBudgetState());

    const mockMonths = [
      makeMockMonth({ id: 'month-1', year: 2025, month: 1, income: 5000, expenses: [] }),
      makeMockMonth({ id: 'month-2', year: 2025, month: 2, income: 5500, expenses: [] }),
    ];

    act(() => {
      result.current.setMonths(mockMonths as never);
      result.current.setCurrentMonthId('month-2');
    });

    expect(result.current.currentMonth).toEqual(mockMonths[1]);
  });

  it('should return null for currentMonth if currentMonthId not found', () => {
    const { result } = renderHook(() => useBudgetState());

    const mockMonths = [
      makeMockMonth({ id: 'month-1', year: 2025, month: 1, income: 5000, expenses: [] }),
    ];

    act(() => {
      result.current.setMonths(mockMonths as never);
      result.current.setCurrentMonthId('non-existent');
    });

    expect(result.current.currentMonth).toBeNull();
  });

  it('should update recurringExpenses via setRecurringExpenses', () => {
    const { result } = renderHook(() => useBudgetState());

    const mockRecurring = [
      makeMockRecurringExpense({ id: 'rec-1', title: 'Netflix', value: 45 }),
      makeMockRecurringExpense({ id: 'rec-2', title: 'Spotify', value: 20 }),
    ];

    act(() => {
      result.current.setRecurringExpenses(mockRecurring as never);
    });

    expect(result.current.recurringExpenses).toEqual(mockRecurring);
  });

  it('should update subcategories via setSubcategories', () => {
    const { result } = renderHook(() => useBudgetState());

    const mockSubcategories = [
      makeMockSubcategory({ id: 'sub-1', name: 'Groceries', categoryKey: 'essenciais' }),
      makeMockSubcategory({ id: 'sub-2', name: 'Entertainment', categoryKey: 'prazeres' }),
    ];

    act(() => {
      result.current.setSubcategories(mockSubcategories as never);
    });

    expect(result.current.subcategories).toEqual(mockSubcategories);
  });

  it('should update loading state via setLoading', () => {
    const { result } = renderHook(() => useBudgetState());

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.loading).toBe(false);
  });

  it('should update hasInitialized via setHasInitialized', () => {
    const { result } = renderHook(() => useBudgetState());

    expect(result.current.hasInitialized).toBe(false);

    act(() => {
      result.current.setHasInitialized(true);
    });

    expect(result.current.hasInitialized).toBe(true);
  });

  it('should update categoryPercentages via setCategoryPercentages', () => {
    const { result } = renderHook(() => useBudgetState());

    const newPercentages = {
      essenciais: 60,
      conforto: 8,
      metas: 12,
      prazeres: 8,
      liberdade: 8,
      conhecimento: 4,
    };

    act(() => {
      result.current.setCategoryPercentages(newPercentages as never);
    });

    expect(result.current.categoryPercentages).toEqual(newPercentages);
  });
});
