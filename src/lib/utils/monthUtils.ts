/**
 * Month Utility Functions
 * 
 * Consolidated utilities for month label formatting, installment calculations,
 * and recurring expense logic.
 * 
 * Extracted from storageAdapter.ts and useBudget.ts to eliminate duplication.
 */

import { RecurringExpense } from '@/types';

/**
 * Format a month as MM/YYYY (e.g., "03/2025")
 */
export const getMonthLabel = (year: number, month: number): string => {
  return `${month.toString().padStart(2, '0')}/${year}`;
};

/**
 * Calculate which installment number we're on for a recurring expense
 * 
 * Example: expense starts in 01/2025 with 12 installments
 * - In 01/2025 → installment 1
 * - In 02/2025 → installment 2
 * - In 01/2026 → installment 13 (out of range if totalInstallments=12)
 */
export const calculateInstallmentNumber = (
  targetYear: number,
  targetMonth: number,
  startYear: number,
  startMonth: number
): number => {
  return (targetYear - startYear) * 12 + (targetMonth - startMonth) + 1;
};

/**
 * Check if a recurring expense should be included in a specific month
 * 
 * Returns whether to include the expense and, if applicable, which installment number
 * 
 * @example
 * const { include, installmentNumber } = shouldIncludeRecurringInMonth(expense, 2025, 3);
 * if (include) {
 *   // Add to month 3/2025, possibly marking as installment 2/12
 * }
 */
export const shouldIncludeRecurringInMonth = (
  recurring: RecurringExpense,
  year: number,
  month: number
): { include: boolean; installmentNumber?: number } => {
  // If no installment info, it repeats every month indefinitely
  if (!recurring.hasInstallments || !recurring.totalInstallments || !recurring.startYear || !recurring.startMonth) {
    return { include: true };
  }

  const installmentNumber = calculateInstallmentNumber(year, month, recurring.startYear, recurring.startMonth);
  
  // Installment is out of range
  if (installmentNumber < 1 || installmentNumber > recurring.totalInstallments) {
    return { include: false };
  }
  
  return { include: true, installmentNumber };
};
