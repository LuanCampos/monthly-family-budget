import { describe, it, expect } from 'vitest';
import {
  getMonthLabel,
  calculateInstallmentNumber,
  shouldIncludeRecurringInMonth,
} from './monthUtils';
import { RecurringExpense } from '@/types';

describe('monthUtils', () => {
  describe('getMonthLabel', () => {
    it('should format month and year correctly', () => {
      expect(getMonthLabel(2025, 1)).toBe('01/2025');
      expect(getMonthLabel(2025, 12)).toBe('12/2025');
      expect(getMonthLabel(2024, 3)).toBe('03/2024');
    });

    it('should pad single digit months', () => {
      expect(getMonthLabel(2025, 1)).toBe('01/2025');
      expect(getMonthLabel(2025, 9)).toBe('09/2025');
    });
  });

  describe('calculateInstallmentNumber', () => {
    it('should return 1 for the start month', () => {
      expect(calculateInstallmentNumber(2025, 1, 2025, 1)).toBe(1);
    });

    it('should calculate installment number correctly', () => {
      // Starting from 01/2025
      expect(calculateInstallmentNumber(2025, 2, 2025, 1)).toBe(2);
      expect(calculateInstallmentNumber(2025, 3, 2025, 1)).toBe(3);
      expect(calculateInstallmentNumber(2025, 12, 2025, 1)).toBe(12);
    });

    it('should handle year transitions', () => {
      // Starting from 10/2024
      expect(calculateInstallmentNumber(2025, 1, 2024, 10)).toBe(4);
      expect(calculateInstallmentNumber(2025, 10, 2024, 10)).toBe(13);
    });

    it('should return negative for months before start', () => {
      expect(calculateInstallmentNumber(2024, 12, 2025, 1)).toBe(0);
      expect(calculateInstallmentNumber(2024, 6, 2025, 1)).toBe(-6);
    });
  });

  describe('shouldIncludeRecurringInMonth', () => {
    it('should include recurring expense without installments in any month', () => {
      const recurring: RecurringExpense = {
        id: '1',
        familyId: 'fam1',
        title: 'Netflix',
        categoryKey: 'entertainment',
        value: 45,
        hasInstallments: false,
      };

      expect(shouldIncludeRecurringInMonth(recurring, 2025, 1)).toEqual({ include: true });
      expect(shouldIncludeRecurringInMonth(recurring, 2030, 12)).toEqual({ include: true });
    });

    it('should include expense within installment range', () => {
      const recurring: RecurringExpense = {
        id: '2',
        familyId: 'fam1',
        title: 'TV 12x',
        categoryKey: 'shopping',
        value: 200,
        hasInstallments: true,
        totalInstallments: 12,
        startYear: 2025,
        startMonth: 1,
      };

      // First installment
      expect(shouldIncludeRecurringInMonth(recurring, 2025, 1)).toEqual({
        include: true,
        installmentNumber: 1,
      });

      // Middle installment
      expect(shouldIncludeRecurringInMonth(recurring, 2025, 6)).toEqual({
        include: true,
        installmentNumber: 6,
      });

      // Last installment
      expect(shouldIncludeRecurringInMonth(recurring, 2025, 12)).toEqual({
        include: true,
        installmentNumber: 12,
      });
    });

    it('should exclude expense outside installment range', () => {
      const recurring: RecurringExpense = {
        id: '3',
        familyId: 'fam1',
        title: 'Celular 10x',
        categoryKey: 'shopping',
        value: 300,
        hasInstallments: true,
        totalInstallments: 10,
        startYear: 2025,
        startMonth: 3,
      };

      // Before start
      expect(shouldIncludeRecurringInMonth(recurring, 2025, 1)).toEqual({ include: false });
      expect(shouldIncludeRecurringInMonth(recurring, 2025, 2)).toEqual({ include: false });

      // After end (10 installments from March = ends in December)
      expect(shouldIncludeRecurringInMonth(recurring, 2026, 1)).toEqual({ include: false });
      expect(shouldIncludeRecurringInMonth(recurring, 2026, 2)).toEqual({ include: false });
    });

    it('should handle year-spanning installments correctly', () => {
      const recurring: RecurringExpense = {
        id: '4',
        familyId: 'fam1',
        title: 'Curso 24x',
        categoryKey: 'education',
        value: 500,
        hasInstallments: true,
        totalInstallments: 24,
        startYear: 2024,
        startMonth: 10,
      };

      // First installment (Oct 2024)
      expect(shouldIncludeRecurringInMonth(recurring, 2024, 10)).toEqual({
        include: true,
        installmentNumber: 1,
      });

      // Installment in next year (Jan 2025 = installment 4)
      expect(shouldIncludeRecurringInMonth(recurring, 2025, 1)).toEqual({
        include: true,
        installmentNumber: 4,
      });

      // Last installment (Sep 2026 = installment 24)
      expect(shouldIncludeRecurringInMonth(recurring, 2026, 9)).toEqual({
        include: true,
        installmentNumber: 24,
      });

      // After end
      expect(shouldIncludeRecurringInMonth(recurring, 2026, 10)).toEqual({ include: false });
    });
  });
});
