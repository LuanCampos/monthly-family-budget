import { describe, it, expect } from 'vitest';
import {
  CreateMonthInputSchema,
  CreateExpenseInputSchema,
  CreateSubcategoryInputSchema,
  CreateIncomeSourceInputSchema,
  CreateRecurringExpenseInputSchema,
  CreateGoalInputSchema,
  validateInput,
} from './validators';

describe('validators', () => {
  describe('CreateMonthInputSchema', () => {
    it('should validate valid month input', () => {
      const valid = { year: 2025, month: 1 };
      expect(CreateMonthInputSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject invalid year', () => {
      expect(CreateMonthInputSchema.safeParse({ year: 1999, month: 1 }).success).toBe(false);
      expect(CreateMonthInputSchema.safeParse({ year: 2101, month: 1 }).success).toBe(false);
    });

    it('should reject invalid month', () => {
      expect(CreateMonthInputSchema.safeParse({ year: 2025, month: 0 }).success).toBe(false);
      expect(CreateMonthInputSchema.safeParse({ year: 2025, month: 13 }).success).toBe(false);
    });
  });

  describe('CreateExpenseInputSchema', () => {
    it('should validate valid expense input', () => {
      const valid = {
        month_id: 'month-123',
        title: 'Grocery shopping',
        category_key: 'essenciais',
        value: 150.50,
      };
      expect(CreateExpenseInputSchema.safeParse(valid).success).toBe(true);
    });

    it('should validate expense with optional fields', () => {
      const valid = {
        month_id: 'month-123',
        title: 'Netflix',
        category_key: 'prazeres',
        value: 45,
        is_recurring: true,
        is_pending: false,
        due_day: 15,
        subcategory_id: 'sub-123',
      };
      expect(CreateExpenseInputSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject empty title', () => {
      const invalid = {
        month_id: 'month-123',
        title: '',
        category_key: 'essenciais',
        value: 100,
      };
      expect(CreateExpenseInputSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject negative value', () => {
      const invalid = {
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: -50,
      };
      expect(CreateExpenseInputSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject invalid category_key', () => {
      const invalid = {
        month_id: 'month-123',
        title: 'Test',
        category_key: 'invalid_category',
        value: 100,
      };
      expect(CreateExpenseInputSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject invalid due_day', () => {
      const invalid = {
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        due_day: 32,
      };
      expect(CreateExpenseInputSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('CreateSubcategoryInputSchema', () => {
    it('should validate valid subcategory input', () => {
      const valid = { name: 'Supermercado', category_key: 'essenciais' };
      expect(CreateSubcategoryInputSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalid = { name: '', category_key: 'essenciais' };
      expect(CreateSubcategoryInputSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject invalid category_key', () => {
      const invalid = { name: 'Test', category_key: 'invalid' };
      expect(CreateSubcategoryInputSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('CreateIncomeSourceInputSchema', () => {
    it('should validate valid income source input', () => {
      const valid = { name: 'Salary', value: 5000 };
      expect(CreateIncomeSourceInputSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalid = { name: '', value: 5000 };
      expect(CreateIncomeSourceInputSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject negative value', () => {
      const invalid = { name: 'Salary', value: -100 };
      expect(CreateIncomeSourceInputSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('CreateRecurringExpenseInputSchema', () => {
    it('should validate valid recurring expense without installments', () => {
      const valid = {
        title: 'Netflix',
        category_key: 'prazeres',
        value: 45,
      };
      expect(CreateRecurringExpenseInputSchema.safeParse(valid).success).toBe(true);
    });

    it('should validate valid recurring expense with installments', () => {
      const valid = {
        title: 'TV 12x',
        category_key: 'conforto',
        value: 200,
        has_installments: true,
        total_installments: 12,
        start_year: 2025,
        start_month: 1,
        due_day: 10,
      };
      expect(CreateRecurringExpenseInputSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject invalid installment count', () => {
      const invalid = {
        title: 'Test',
        category_key: 'conforto',
        value: 100,
        has_installments: true,
        total_installments: 0,
      };
      expect(CreateRecurringExpenseInputSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('CreateGoalInputSchema', () => {
    it('should validate valid goal input', () => {
      const valid = {
        family_id: 'fam-123',
        name: 'Emergency Fund',
        target_value: 10000,
      };
      expect(CreateGoalInputSchema.safeParse(valid).success).toBe(true);
    });

    it('should validate goal with target date', () => {
      const valid = {
        family_id: 'fam-123',
        name: 'Vacation',
        target_value: 5000,
        target_month: 12,
        target_year: 2025,
      };
      expect(CreateGoalInputSchema.safeParse(valid).success).toBe(true);
    });

    it('should validate goal with linked category', () => {
      const valid = {
        family_id: 'fam-123',
        name: 'Car Savings',
        target_value: 30000,
        linked_category_key: 'transport',
        account: 'Savings Account',
      };
      expect(CreateGoalInputSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('validateInput helper', () => {
    it('should return success with data for valid input', () => {
      const result = validateInput(CreateMonthInputSchema, { year: 2025, month: 6 });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ year: 2025, month: 6 });
    });

    it('should return failure with error for invalid input', () => {
      const result = validateInput(CreateMonthInputSchema, { year: 'invalid', month: 6 });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
