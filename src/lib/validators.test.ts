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

  describe('security - XSS prevention in string fields', () => {
    const XSS_PAYLOADS = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '"><script>alert(1)</script>',
      "'; DROP TABLE expenses; --",
    ];

    it('should accept XSS payloads as valid strings (sanitization happens at render)', () => {
      // Validators should accept these strings - XSS prevention is at rendering layer
      XSS_PAYLOADS.forEach(payload => {
        const result = CreateExpenseInputSchema.safeParse({
          month_id: 'month-123',
          title: payload,
          category_key: 'essenciais',
          value: 100,
        });
        // The validator accepts strings - React will escape them on render
        expect(result.success).toBe(true);
      });
    });

    it('should enforce max length to prevent large payload attacks', () => {
      const veryLongString = 'a'.repeat(256);
      
      const result = CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: veryLongString,
        category_key: 'essenciais',
        value: 100,
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('numeric edge cases', () => {
    it('should reject Infinity and NaN for expense values', () => {
      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: Infinity,
      }).success).toBe(false);

      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: -Infinity,
      }).success).toBe(false);

      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: NaN,
      }).success).toBe(false);
    });

    it('should reject Infinity and NaN for income values', () => {
      expect(CreateIncomeSourceInputSchema.safeParse({
        name: 'Salary',
        value: Infinity,
      }).success).toBe(false);

      expect(CreateIncomeSourceInputSchema.safeParse({
        name: 'Salary',
        value: NaN,
      }).success).toBe(false);
    });

    it('should accept zero as valid value', () => {
      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 0,
      }).success).toBe(true);

      expect(CreateIncomeSourceInputSchema.safeParse({
        name: 'Test',
        value: 0,
      }).success).toBe(true);
    });

    it('should accept decimal values with precision', () => {
      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 99.99,
      }).success).toBe(true);

      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 0.01,
      }).success).toBe(true);
    });

    it('should handle very large but finite numbers', () => {
      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 999999999.99,
      }).success).toBe(true);
    });
  });

  describe('boundary values', () => {
    it('should validate month boundaries correctly', () => {
      // Valid boundaries
      expect(CreateMonthInputSchema.safeParse({ year: 2000, month: 1 }).success).toBe(true);
      expect(CreateMonthInputSchema.safeParse({ year: 2100, month: 12 }).success).toBe(true);
      
      // Invalid boundaries
      expect(CreateMonthInputSchema.safeParse({ year: 1999, month: 1 }).success).toBe(false);
      expect(CreateMonthInputSchema.safeParse({ year: 2101, month: 1 }).success).toBe(false);
      expect(CreateMonthInputSchema.safeParse({ year: 2025, month: 0 }).success).toBe(false);
      expect(CreateMonthInputSchema.safeParse({ year: 2025, month: 13 }).success).toBe(false);
    });

    it('should validate due_day boundaries correctly', () => {
      // Valid boundaries
      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        due_day: 1,
      }).success).toBe(true);

      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        due_day: 31,
      }).success).toBe(true);

      // Invalid boundaries
      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        due_day: 0,
      }).success).toBe(false);

      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        due_day: 32,
      }).success).toBe(false);
    });

    it('should validate installment boundaries correctly', () => {
      // Valid installments
      expect(CreateRecurringExpenseInputSchema.safeParse({
        title: 'TV',
        category_key: 'conforto',
        value: 200,
        has_installments: true,
        total_installments: 1, // Minimum
      }).success).toBe(true);

      expect(CreateRecurringExpenseInputSchema.safeParse({
        title: 'Car',
        category_key: 'conforto',
        value: 500,
        has_installments: true,
        total_installments: 120, // Maximum
      }).success).toBe(true);

      // Invalid installments
      expect(CreateRecurringExpenseInputSchema.safeParse({
        title: 'Test',
        category_key: 'conforto',
        value: 100,
        has_installments: true,
        total_installments: 0,
      }).success).toBe(false);

      expect(CreateRecurringExpenseInputSchema.safeParse({
        title: 'Test',
        category_key: 'conforto',
        value: 100,
        has_installments: true,
        total_installments: 121,
      }).success).toBe(false);
    });
  });

  describe('type coercion protection', () => {
    it('should reject string numbers for numeric fields', () => {
      expect(CreateMonthInputSchema.safeParse({ year: '2025', month: 6 }).success).toBe(false);
      expect(CreateMonthInputSchema.safeParse({ year: 2025, month: '6' }).success).toBe(false);
    });

    it('should reject numeric strings for string fields', () => {
      expect(CreateExpenseInputSchema.safeParse({
        month_id: 123, // Should be string
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
      }).success).toBe(false);
    });

    it('should reject arrays and objects for primitive fields', () => {
      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: ['Test'], // Array instead of string
        category_key: 'essenciais',
        value: 100,
      }).success).toBe(false);

      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: { text: 'Test' }, // Object instead of string
        category_key: 'essenciais',
        value: 100,
      }).success).toBe(false);
    });
  });

  describe('null and undefined handling', () => {
    it('should handle nullable optional fields correctly', () => {
      // subcategory_id is optional and nullable
      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        subcategory_id: null,
      }).success).toBe(true);

      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        subcategory_id: undefined,
      }).success).toBe(true);

      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
        // subcategory_id omitted entirely
      }).success).toBe(true);
    });

    it('should reject null for required fields', () => {
      expect(CreateExpenseInputSchema.safeParse({
        month_id: null,
        title: 'Test',
        category_key: 'essenciais',
        value: 100,
      }).success).toBe(false);

      expect(CreateExpenseInputSchema.safeParse({
        month_id: 'month-123',
        title: null,
        category_key: 'essenciais',
        value: 100,
      }).success).toBe(false);
    });
  });

  describe('category key validation', () => {
    const VALID_CATEGORIES = ['essenciais', 'conforto', 'metas', 'prazeres', 'liberdade', 'conhecimento'];
    
    it('should accept all valid category keys', () => {
      VALID_CATEGORIES.forEach(category => {
        expect(CreateExpenseInputSchema.safeParse({
          month_id: 'month-123',
          title: 'Test',
          category_key: category,
          value: 100,
        }).success).toBe(true);
      });
    });

    it('should reject similar but invalid category keys', () => {
      const INVALID_CATEGORIES = [
        'Essenciais', // Capitalized
        'ESSENCIAIS', // All caps
        'essenciais ', // Trailing space
        ' essenciais', // Leading space
        'essential', // English equivalent
        'housing', // Common budget category
        'food', // Common budget category
        '', // Empty
      ];

      INVALID_CATEGORIES.forEach(category => {
        expect(CreateExpenseInputSchema.safeParse({
          month_id: 'month-123',
          title: 'Test',
          category_key: category,
          value: 100,
        }).success).toBe(false);
      });
    });
  });
});
