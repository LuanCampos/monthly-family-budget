import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBudgetState } from './useBudgetState';

// Mock categories
vi.mock('@/constants/categories', () => ({
  CATEGORIES: [
    { key: 'essenciais', color: '#22c55e', percentage: 55 },
    { key: 'conforto', color: '#3b82f6', percentage: 10 },
    { key: 'metas', color: '#a855f7', percentage: 10 },
    { key: 'prazeres', color: '#f97316', percentage: 10 },
    { key: 'liberdade', color: '#eab308', percentage: 10 },
    { key: 'conhecimento', color: '#06b6d4', percentage: 5 },
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
      { id: 'month-1', year: 2025, month: 1, income: 5000, expenses: [] },
      { id: 'month-2', year: 2025, month: 2, income: 5500, expenses: [] },
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
      { id: 'month-1', year: 2025, month: 1, income: 5000, expenses: [] },
      { id: 'month-2', year: 2025, month: 2, income: 5500, expenses: [] },
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
      { id: 'month-1', year: 2025, month: 1, income: 5000, expenses: [] },
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
      { id: 'rec-1', title: 'Netflix', value: 45 },
      { id: 'rec-2', title: 'Spotify', value: 20 },
    ];

    act(() => {
      result.current.setRecurringExpenses(mockRecurring as never);
    });

    expect(result.current.recurringExpenses).toEqual(mockRecurring);
  });

  it('should update subcategories via setSubcategories', () => {
    const { result } = renderHook(() => useBudgetState());

    const mockSubcategories = [
      { id: 'sub-1', name: 'Groceries', categoryKey: 'essenciais' },
      { id: 'sub-2', name: 'Entertainment', categoryKey: 'prazeres' },
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
