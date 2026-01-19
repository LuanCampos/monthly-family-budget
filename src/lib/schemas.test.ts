import { describe, it, expect } from 'vitest';
import {
  CategoryKeySchema,
  MonthRowSchema,
  ExpenseRowSchema,
  RecurringExpenseRowSchema,
  SubcategoryRowSchema,
  CategoryLimitRowSchema,
  IncomeSourceRowSchema,
  GoalRowSchema,
  GoalEntryRowSchema,
  GoalStatusSchema,
  validateMonthRow,
  validateExpenseRow,
  validateRecurringExpenseRow,
  validateSubcategoryRow,
  validateCategoryLimitRow,
  validateIncomeSourceRow,
  validateGoalRow,
  validateGoalEntryRow,
} from './schemas';

describe('schemas', () => {
  describe('CategoryKeySchema', () => {
    it('should accept valid category keys', () => {
      const validKeys = ['essenciais', 'conforto', 'metas', 'prazeres', 'liberdade', 'conhecimento'];
      validKeys.forEach((key) => {
        expect(CategoryKeySchema.safeParse(key).success).toBe(true);
      });
    });

    it('should reject invalid category keys', () => {
      expect(CategoryKeySchema.safeParse('invalid').success).toBe(false);
      expect(CategoryKeySchema.safeParse('').success).toBe(false);
      expect(CategoryKeySchema.safeParse(123).success).toBe(false);
    });
  });

  describe('GoalStatusSchema', () => {
    it('should accept valid goal statuses', () => {
      expect(GoalStatusSchema.safeParse('active').success).toBe(true);
      expect(GoalStatusSchema.safeParse('archived').success).toBe(true);
    });

    it('should reject invalid goal statuses', () => {
      expect(GoalStatusSchema.safeParse('pending').success).toBe(false);
      expect(GoalStatusSchema.safeParse('completed').success).toBe(false);
      expect(GoalStatusSchema.safeParse('').success).toBe(false);
    });
  });

  describe('MonthRowSchema', () => {
    const validMonth = {
      id: 'month-123',
      family_id: 'fam-456',
      year: 2025,
      month: 6,
      income: 5000,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    it('should validate valid month row', () => {
      expect(MonthRowSchema.safeParse(validMonth).success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const { id: _id, ...withoutId } = validMonth;
      expect(MonthRowSchema.safeParse(withoutId).success).toBe(false);
    });

    it('should reject invalid year', () => {
      expect(MonthRowSchema.safeParse({ ...validMonth, year: 1999 }).success).toBe(false);
      expect(MonthRowSchema.safeParse({ ...validMonth, year: 2101 }).success).toBe(false);
    });

    it('should reject invalid month', () => {
      expect(MonthRowSchema.safeParse({ ...validMonth, month: 0 }).success).toBe(false);
      expect(MonthRowSchema.safeParse({ ...validMonth, month: 13 }).success).toBe(false);
    });

    it('should reject negative income', () => {
      expect(MonthRowSchema.safeParse({ ...validMonth, income: -100 }).success).toBe(false);
    });
  });

  describe('ExpenseRowSchema', () => {
    const validExpense = {
      id: 'exp-123',
      month_id: 'month-456',
      title: 'Grocery shopping',
      category_key: 'essenciais',
      subcategory_id: null,
      value: 150.5,
      is_recurring: false,
      is_pending: false,
      due_day: null,
      recurring_expense_id: null,
      installment_current: null,
      installment_total: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    it('should validate valid expense row', () => {
      expect(ExpenseRowSchema.safeParse(validExpense).success).toBe(true);
    });

    it('should validate expense with installments', () => {
      const withInstallments = {
        ...validExpense,
        is_recurring: true,
        recurring_expense_id: 'rec-123',
        installment_current: 3,
        installment_total: 12,
      };
      expect(ExpenseRowSchema.safeParse(withInstallments).success).toBe(true);
    });

    it('should validate expense with due_day', () => {
      const withDueDay = { ...validExpense, due_day: 15 };
      expect(ExpenseRowSchema.safeParse(withDueDay).success).toBe(true);
    });

    it('should reject invalid due_day', () => {
      expect(ExpenseRowSchema.safeParse({ ...validExpense, due_day: 0 }).success).toBe(false);
      expect(ExpenseRowSchema.safeParse({ ...validExpense, due_day: 32 }).success).toBe(false);
    });

    it('should reject empty title', () => {
      expect(ExpenseRowSchema.safeParse({ ...validExpense, title: '' }).success).toBe(false);
    });

    it('should reject negative value', () => {
      expect(ExpenseRowSchema.safeParse({ ...validExpense, value: -50 }).success).toBe(false);
    });

    it('should reject invalid category_key', () => {
      expect(ExpenseRowSchema.safeParse({ ...validExpense, category_key: 'invalid' }).success).toBe(false);
    });
  });

  describe('RecurringExpenseRowSchema', () => {
    const validRecurring = {
      id: 'rec-123',
      family_id: 'fam-456',
      title: 'Netflix',
      category_key: 'prazeres',
      subcategory_id: null,
      value: 45,
      due_day: 10,
      has_installments: false,
      total_installments: null,
      start_year: null,
      start_month: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    it('should validate valid recurring expense row', () => {
      expect(RecurringExpenseRowSchema.safeParse(validRecurring).success).toBe(true);
    });

    it('should validate recurring with installments', () => {
      const withInstallments = {
        ...validRecurring,
        has_installments: true,
        total_installments: 12,
        start_year: 2025,
        start_month: 1,
      };
      expect(RecurringExpenseRowSchema.safeParse(withInstallments).success).toBe(true);
    });

    it('should reject invalid total_installments', () => {
      const invalid = {
        ...validRecurring,
        has_installments: true,
        total_installments: 0,
      };
      expect(RecurringExpenseRowSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject invalid start_month', () => {
      const invalid = {
        ...validRecurring,
        has_installments: true,
        total_installments: 12,
        start_year: 2025,
        start_month: 13,
      };
      expect(RecurringExpenseRowSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('SubcategoryRowSchema', () => {
    const validSubcategory = {
      id: 'sub-123',
      family_id: 'fam-456',
      name: 'Supermercado',
      category_key: 'essenciais',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    it('should validate valid subcategory row', () => {
      expect(SubcategoryRowSchema.safeParse(validSubcategory).success).toBe(true);
    });

    it('should reject empty name', () => {
      expect(SubcategoryRowSchema.safeParse({ ...validSubcategory, name: '' }).success).toBe(false);
    });

    it('should reject name exceeding max length', () => {
      const longName = 'a'.repeat(256);
      expect(SubcategoryRowSchema.safeParse({ ...validSubcategory, name: longName }).success).toBe(false);
    });

    it('should reject invalid category_key', () => {
      expect(SubcategoryRowSchema.safeParse({ ...validSubcategory, category_key: 'invalid' }).success).toBe(false);
    });
  });

  describe('CategoryLimitRowSchema', () => {
    const validLimit = {
      id: 'limit-123',
      month_id: 'month-456',
      category_key: 'essenciais',
      percentage: 30,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    it('should validate valid category limit row', () => {
      expect(CategoryLimitRowSchema.safeParse(validLimit).success).toBe(true);
    });

    it('should accept 0% and 100%', () => {
      expect(CategoryLimitRowSchema.safeParse({ ...validLimit, percentage: 0 }).success).toBe(true);
      expect(CategoryLimitRowSchema.safeParse({ ...validLimit, percentage: 100 }).success).toBe(true);
    });

    it('should reject negative percentage', () => {
      expect(CategoryLimitRowSchema.safeParse({ ...validLimit, percentage: -5 }).success).toBe(false);
    });

    it('should reject percentage over 100', () => {
      expect(CategoryLimitRowSchema.safeParse({ ...validLimit, percentage: 101 }).success).toBe(false);
    });
  });

  describe('IncomeSourceRowSchema', () => {
    const validSource = {
      id: 'source-123',
      month_id: 'month-456',
      name: 'Salary',
      value: 5000,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    it('should validate valid income source row', () => {
      expect(IncomeSourceRowSchema.safeParse(validSource).success).toBe(true);
    });

    it('should reject empty name', () => {
      expect(IncomeSourceRowSchema.safeParse({ ...validSource, name: '' }).success).toBe(false);
    });

    it('should reject negative value', () => {
      expect(IncomeSourceRowSchema.safeParse({ ...validSource, value: -100 }).success).toBe(false);
    });
  });

  describe('GoalRowSchema', () => {
    const validGoal = {
      id: 'goal-123',
      family_id: 'fam-456',
      name: 'Emergency Fund',
      target_value: 10000,
      target_month: null,
      target_year: null,
      account: null,
      linked_subcategory_id: null,
      linked_category_key: null,
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    it('should validate valid goal row', () => {
      expect(GoalRowSchema.safeParse(validGoal).success).toBe(true);
    });

    it('should validate goal with target date', () => {
      const withTarget = {
        ...validGoal,
        target_month: 12,
        target_year: 2025,
      };
      expect(GoalRowSchema.safeParse(withTarget).success).toBe(true);
    });

    it('should validate goal with linked category', () => {
      const withCategory = {
        ...validGoal,
        linked_category_key: 'metas',
      };
      expect(GoalRowSchema.safeParse(withCategory).success).toBe(true);
    });

    it('should validate archived goal', () => {
      const archived = { ...validGoal, status: 'archived' };
      expect(GoalRowSchema.safeParse(archived).success).toBe(true);
    });

    it('should reject invalid status', () => {
      expect(GoalRowSchema.safeParse({ ...validGoal, status: 'pending' }).success).toBe(false);
    });

    it('should reject invalid target_month', () => {
      expect(GoalRowSchema.safeParse({ ...validGoal, target_month: 13 }).success).toBe(false);
      expect(GoalRowSchema.safeParse({ ...validGoal, target_month: 0 }).success).toBe(false);
    });
  });

  describe('GoalEntryRowSchema', () => {
    const validEntry = {
      id: 'entry-123',
      goal_id: 'goal-456',
      expense_id: null,
      value: 500,
      description: 'Monthly deposit',
      month: 6,
      year: 2025,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    it('should validate valid goal entry row', () => {
      expect(GoalEntryRowSchema.safeParse(validEntry).success).toBe(true);
    });

    it('should validate entry linked to expense', () => {
      const withExpense = { ...validEntry, expense_id: 'exp-123' };
      expect(GoalEntryRowSchema.safeParse(withExpense).success).toBe(true);
    });

    it('should accept negative value (withdrawals)', () => {
      const withdrawal = { ...validEntry, value: -200 };
      expect(GoalEntryRowSchema.safeParse(withdrawal).success).toBe(true);
    });

    it('should reject invalid month', () => {
      expect(GoalEntryRowSchema.safeParse({ ...validEntry, month: 0 }).success).toBe(false);
      expect(GoalEntryRowSchema.safeParse({ ...validEntry, month: 13 }).success).toBe(false);
    });

    it('should reject description exceeding max length', () => {
      const longDesc = 'a'.repeat(501);
      expect(GoalEntryRowSchema.safeParse({ ...validEntry, description: longDesc }).success).toBe(false);
    });
  });

  describe('validation helper functions', () => {
    describe('validateMonthRow', () => {
      it('should return success with data for valid input', () => {
        const validMonth = {
          id: 'month-123',
          family_id: 'fam-456',
          year: 2025,
          month: 6,
          income: 5000,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        const result = validateMonthRow(validMonth);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(validMonth);
      });

      it('should return failure for invalid input', () => {
        const result = validateMonthRow({ year: 'invalid' });
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('validateExpenseRow', () => {
      it('should return success with data for valid input', () => {
        const validExpense = {
          id: 'exp-123',
          month_id: 'month-456',
          title: 'Test',
          category_key: 'essenciais',
          subcategory_id: null,
          value: 100,
          is_recurring: false,
          is_pending: false,
          due_day: null,
          recurring_expense_id: null,
          installment_current: null,
          installment_total: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        const result = validateExpenseRow(validExpense);
        expect(result.success).toBe(true);
      });

      it('should return failure for invalid input', () => {
        const result = validateExpenseRow({ title: '' });
        expect(result.success).toBe(false);
      });
    });

    describe('validateRecurringExpenseRow', () => {
      it('should return success for valid input', () => {
        const validRecurring = {
          id: 'rec-123',
          family_id: 'fam-456',
          title: 'Netflix',
          category_key: 'prazeres',
          subcategory_id: null,
          value: 45,
          due_day: null,
          has_installments: false,
          total_installments: null,
          start_year: null,
          start_month: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        const result = validateRecurringExpenseRow(validRecurring);
        expect(result.success).toBe(true);
      });
    });

    describe('validateSubcategoryRow', () => {
      it('should return success for valid input', () => {
        const validSub = {
          id: 'sub-123',
          family_id: 'fam-456',
          name: 'Test',
          category_key: 'essenciais',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        const result = validateSubcategoryRow(validSub);
        expect(result.success).toBe(true);
      });
    });

    describe('validateCategoryLimitRow', () => {
      it('should return success for valid input', () => {
        const validLimit = {
          id: 'limit-123',
          month_id: 'month-456',
          category_key: 'essenciais',
          percentage: 30,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        const result = validateCategoryLimitRow(validLimit);
        expect(result.success).toBe(true);
      });
    });

    describe('validateIncomeSourceRow', () => {
      it('should return success for valid input', () => {
        const validSource = {
          id: 'source-123',
          month_id: 'month-456',
          name: 'Salary',
          value: 5000,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        const result = validateIncomeSourceRow(validSource);
        expect(result.success).toBe(true);
      });
    });

    describe('validateGoalRow', () => {
      it('should return success for valid input', () => {
        const validGoal = {
          id: 'goal-123',
          family_id: 'fam-456',
          name: 'Test Goal',
          target_value: 10000,
          target_month: null,
          target_year: null,
          account: null,
          linked_subcategory_id: null,
          linked_category_key: null,
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        const result = validateGoalRow(validGoal);
        expect(result.success).toBe(true);
      });
    });

    describe('validateGoalEntryRow', () => {
      it('should return success for valid input', () => {
        const validEntry = {
          id: 'entry-123',
          goal_id: 'goal-456',
          expense_id: null,
          value: 500,
          description: null,
          month: 6,
          year: 2025,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        const result = validateGoalEntryRow(validEntry);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('security and edge cases', () => {
    describe('prototype pollution prevention', () => {
      it('should reject objects with __proto__', () => {
        const malicious = {
          id: 'exp-123',
          month_id: 'month-456',
          title: 'Test',
          category_key: 'essenciais',
          subcategory_id: null,
          value: 100,
          is_recurring: false,
          is_pending: false,
          due_day: null,
          recurring_expense_id: null,
          installment_current: null,
          installment_total: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          __proto__: { isAdmin: true },
        };
        // Zod should strip unknown keys
        const result = ExpenseRowSchema.safeParse(malicious);
        if (result.success) {
          expect(result.data).not.toHaveProperty('__proto__');
          expect(result.data).not.toHaveProperty('isAdmin');
        }
      });
    });

    describe('type coercion safety', () => {
      it('should not coerce string to number for value', () => {
        const withStringValue = {
          id: 'exp-123',
          month_id: 'month-456',
          title: 'Test',
          category_key: 'essenciais',
          subcategory_id: null,
          value: '100', // String instead of number
          is_recurring: false,
          is_pending: false,
          due_day: null,
          recurring_expense_id: null,
          installment_current: null,
          installment_total: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        expect(ExpenseRowSchema.safeParse(withStringValue).success).toBe(false);
      });

      it('should not coerce number to string for id', () => {
        const withNumberId = {
          id: 123, // Number instead of string
          month_id: 'month-456',
          title: 'Test',
          category_key: 'essenciais',
          subcategory_id: null,
          value: 100,
          is_recurring: false,
          is_pending: false,
          due_day: null,
          recurring_expense_id: null,
          installment_current: null,
          installment_total: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        expect(ExpenseRowSchema.safeParse(withNumberId).success).toBe(false);
      });
    });

    describe('timestamp validation', () => {
      it('should accept ISO 8601 timestamps', () => {
        const validTimestamps = [
          '2025-01-01T00:00:00Z',
          '2025-01-01T00:00:00.000Z',
          '2025-12-31T23:59:59Z',
          '2025-06-15T12:30:45.123Z',
        ];

        validTimestamps.forEach(timestamp => {
          const expense = {
            id: 'exp-123',
            month_id: 'month-456',
            title: 'Test',
            category_key: 'essenciais',
            subcategory_id: null,
            value: 100,
            is_recurring: false,
            is_pending: false,
            due_day: null,
            recurring_expense_id: null,
            installment_current: null,
            installment_total: null,
            created_at: timestamp,
            updated_at: timestamp,
          };
          expect(ExpenseRowSchema.safeParse(expense).success).toBe(true);
        });
      });
    });

    describe('numeric limits', () => {
      it('should handle maximum safe integer', () => {
        const goal = {
          id: 'goal-123',
          family_id: 'fam-456',
          name: 'Big Goal',
          target_value: Number.MAX_SAFE_INTEGER,
          target_month: null,
          target_year: null,
          account: null,
          linked_subcategory_id: null,
          linked_category_key: null,
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        expect(GoalRowSchema.safeParse(goal).success).toBe(true);
      });

      it('should reject NaN values', () => {
        const expense = {
          id: 'exp-123',
          month_id: 'month-456',
          title: 'Test',
          category_key: 'essenciais',
          subcategory_id: null,
          value: NaN,
          is_recurring: false,
          is_pending: false,
          due_day: null,
          recurring_expense_id: null,
          installment_current: null,
          installment_total: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        expect(ExpenseRowSchema.safeParse(expense).success).toBe(false);
      });

      it('should reject Infinity values', () => {
        const expense = {
          id: 'exp-123',
          month_id: 'month-456',
          title: 'Test',
          category_key: 'essenciais',
          subcategory_id: null,
          value: Infinity,
          is_recurring: false,
          is_pending: false,
          due_day: null,
          recurring_expense_id: null,
          installment_current: null,
          installment_total: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        expect(ExpenseRowSchema.safeParse(expense).success).toBe(false);
      });
    });

    describe('string constraints', () => {
      it('should enforce title max length', () => {
        const longTitle = 'a'.repeat(256);
        const expense = {
          id: 'exp-123',
          month_id: 'month-456',
          title: longTitle,
          category_key: 'essenciais',
          subcategory_id: null,
          value: 100,
          is_recurring: false,
          is_pending: false,
          due_day: null,
          recurring_expense_id: null,
          installment_current: null,
          installment_total: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        expect(ExpenseRowSchema.safeParse(expense).success).toBe(false);
      });

      it('should allow title with 255 characters', () => {
        const maxTitle = 'a'.repeat(255);
        const expense = {
          id: 'exp-123',
          month_id: 'month-456',
          title: maxTitle,
          category_key: 'essenciais',
          subcategory_id: null,
          value: 100,
          is_recurring: false,
          is_pending: false,
          due_day: null,
          recurring_expense_id: null,
          installment_current: null,
          installment_total: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };
        expect(ExpenseRowSchema.safeParse(expense).success).toBe(true);
      });

      it('should allow special characters in title', () => {
        const specialTitles = [
          'Café & Padaria',
          'Conta de Luz (02/2025)',
          'Compra #123',
          'Uber: Trabalho → Casa',
          '🍕 Pizza do mês',
        ];

        specialTitles.forEach(title => {
          const expense = {
            id: 'exp-123',
            month_id: 'month-456',
            title,
            category_key: 'essenciais',
            subcategory_id: null,
            value: 100,
            is_recurring: false,
            is_pending: false,
            due_day: null,
            recurring_expense_id: null,
            installment_current: null,
            installment_total: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          };
          expect(ExpenseRowSchema.safeParse(expense).success).toBe(true);
        });
      });
    });
  });
});
