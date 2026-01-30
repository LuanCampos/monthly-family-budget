import { describe, it, expect } from 'vitest';
import {
  mapIncomeSource,
  mapExpense,
  mapRecurringExpense,
  mapSubcategory,
  mapMonthRow,
  mapExpenses,
  mapRecurringExpenses,
  mapSubcategories,
  mapIncomeSources,
  mapGoal,
  mapGoalEntry,
  mapGoals,
  mapGoalEntries,
} from './mappers';
import type { 
  IncomeSourceRow, 
  ExpenseRow, 
  RecurringExpenseRow, 
  SubcategoryRow, 
  MonthRow,
  GoalRow,
  GoalEntryRow,
} from '@/types/database';

describe('mappers', () => {
  describe('mapIncomeSource', () => {
    it('should map income source row to application type', () => {
      const source: IncomeSourceRow = {
        id: 'source-123',
        month_id: 'month-456',
        name: 'Salary',
        value: 5000,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = mapIncomeSource(source);

      expect(result).toEqual({
        id: 'source-123',
        monthId: 'month-456',
        name: 'Salary',
        value: 5000,
      });
    });
  });

  describe('mapExpense', () => {
    const baseExpense: ExpenseRow = {
      id: 'exp-123',
      month_id: 'month-456',
      family_id: 'family-123',
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
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    };

    it('should map basic expense row to application type', () => {
      const result = mapExpense(baseExpense);

      expect(result.id).toBe('exp-123');
      expect(result.title).toBe('Grocery shopping');
      expect(result.category).toBe('essenciais');
      expect(result.value).toBe(150.5);
      expect(result.isRecurring).toBe(false);
      expect(result.isPending).toBe(false);
      expect(result.subcategoryId).toBeUndefined();
      expect(result.dueDay).toBeUndefined();
      expect(result.recurringExpenseId).toBeUndefined();
      expect(result.installmentInfo).toBeUndefined();
    });

    it('should map expense with month JOIN data', () => {
      const expenseWithMonth = {
        ...baseExpense,
        month: { year: 2025, month: 3 },
      };

      const result = mapExpense(expenseWithMonth);

      expect(result.year).toBe(2025);
      expect(result.month).toBe(3);
    });

    it('should parse month_id for offline mode', () => {
      const offlineExpense: ExpenseRow = {
        ...baseExpense,
        month_id: 'fam-123-2025-06',
      };

      const result = mapExpense(offlineExpense);

      expect(result.year).toBe(2025);
      expect(result.month).toBe(6);
    });

    it('should fallback to created_at for month/year', () => {
      const expenseWithInvalidMonthId: ExpenseRow = {
        ...baseExpense,
        month_id: 'invalid-id',
        created_at: '2025-07-20T00:00:00Z',
      };

      const result = mapExpense(expenseWithInvalidMonthId);

      expect(result.year).toBe(2025);
      expect(result.month).toBe(7);
    });

    it('should map expense with installment info', () => {
      const expenseWithInstallments: ExpenseRow = {
        ...baseExpense,
        is_recurring: true,
        recurring_expense_id: 'rec-123',
        installment_current: 3,
        installment_total: 12,
      };

      const result = mapExpense(expenseWithInstallments);

      expect(result.isRecurring).toBe(true);
      expect(result.recurringExpenseId).toBe('rec-123');
      expect(result.installmentInfo).toEqual({ current: 3, total: 12 });
    });

    it('should map expense with subcategory and due day', () => {
      const expenseWithDetails: ExpenseRow = {
        ...baseExpense,
        subcategory_id: 'sub-123',
        is_pending: true,
        due_day: 15,
      };

      const result = mapExpense(expenseWithDetails);

      expect(result.subcategoryId).toBe('sub-123');
      expect(result.isPending).toBe(true);
      expect(result.dueDay).toBe(15);
    });
  });

  describe('mapRecurringExpense', () => {
    const baseRecurring: RecurringExpenseRow = {
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

    it('should map basic recurring expense to application type', () => {
      const result = mapRecurringExpense(baseRecurring);

      expect(result).toEqual({
        id: 'rec-123',
        title: 'Netflix',
        category: 'prazeres',
        subcategoryId: undefined,
        value: 45,
        isRecurring: true,
        dueDay: 10,
        hasInstallments: false,
        totalInstallments: undefined,
        startYear: undefined,
        startMonth: undefined,
      });
    });

    it('should map recurring expense with installments', () => {
      const recurringWithInstallments: RecurringExpenseRow = {
        ...baseRecurring,
        has_installments: true,
        total_installments: 12,
        start_year: 2025,
        start_month: 1,
      };

      const result = mapRecurringExpense(recurringWithInstallments);

      expect(result.hasInstallments).toBe(true);
      expect(result.totalInstallments).toBe(12);
      expect(result.startYear).toBe(2025);
      expect(result.startMonth).toBe(1);
    });

    it('should map recurring expense with subcategory', () => {
      const recurringWithSub: RecurringExpenseRow = {
        ...baseRecurring,
        subcategory_id: 'sub-123',
      };

      const result = mapRecurringExpense(recurringWithSub);

      expect(result.subcategoryId).toBe('sub-123');
    });
  });

  describe('mapSubcategory', () => {
    it('should map subcategory row to application type', () => {
      const subcategory: SubcategoryRow = {
        id: 'sub-123',
        family_id: 'fam-456',
        name: 'Supermercado',
        category_key: 'essenciais',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = mapSubcategory(subcategory);

      expect(result).toEqual({
        id: 'sub-123',
        name: 'Supermercado',
        categoryKey: 'essenciais',
      });
    });
  });

  describe('mapMonthRow', () => {
    it('should map month row to partial month type', () => {
      const month: MonthRow = {
        id: 'month-123',
        family_id: 'fam-456',
        year: 2025,
        month: 6,
        income: 5000,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = mapMonthRow(month);

      expect(result).toEqual({
        id: 'month-123',
        year: 2025,
        month: 6,
        income: 5000,
        label: '06/2025',
      });
    });

    it('should pad single-digit month in label', () => {
      const month: MonthRow = {
        id: 'month-123',
        family_id: 'fam-456',
        year: 2025,
        month: 1,
        income: 5000,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = mapMonthRow(month);

      expect(result.label).toBe('01/2025');
    });
  });

  describe('mapGoal', () => {
    const baseGoal: GoalRow = {
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

    it('should map basic goal to application type', () => {
      const result = mapGoal(baseGoal);

      expect(result.id).toBe('goal-123');
      expect(result.familyId).toBe('fam-456');
      expect(result.name).toBe('Emergency Fund');
      expect(result.targetValue).toBe(10000);
      expect(result.status).toBe('active');
      expect(result.targetMonth).toBeUndefined();
      expect(result.targetYear).toBeUndefined();
      expect(result.account).toBe('');
      expect(result.linkedSubcategoryId).toBeUndefined();
      expect(result.linkedCategoryKey).toBeUndefined();
    });

    it('should map goal with target date', () => {
      const goalWithTarget: GoalRow = {
        ...baseGoal,
        target_month: 12,
        target_year: 2025,
      };

      const result = mapGoal(goalWithTarget);

      expect(result.targetMonth).toBe(12);
      expect(result.targetYear).toBe(2025);
    });

    it('should map goal with linked category and account', () => {
      const goalWithLinks: GoalRow = {
        ...baseGoal,
        account: 'Savings Account',
        linked_subcategory_id: 'sub-123',
        linked_category_key: 'metas',
      };

      const result = mapGoal(goalWithLinks);

      expect(result.account).toBe('Savings Account');
      expect(result.linkedSubcategoryId).toBe('sub-123');
      expect(result.linkedCategoryKey).toBe('metas');
    });

    it('should handle archived status', () => {
      const archivedGoal: GoalRow = {
        ...baseGoal,
        status: 'archived',
      };

      const result = mapGoal(archivedGoal);

      expect(result.status).toBe('archived');
    });

    it('should convert target_value to number', () => {
      // Database might return numeric as string in some cases
      const goalWithStringValue = {
        ...baseGoal,
        target_value: '15000' as unknown as number,
      };

      const result = mapGoal(goalWithStringValue);

      expect(result.targetValue).toBe(15000);
      expect(typeof result.targetValue).toBe('number');
    });
  });

  describe('mapGoalEntry', () => {
    const baseEntry: GoalEntryRow = {
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

    it('should map basic goal entry to application type', () => {
      const result = mapGoalEntry(baseEntry);

      expect(result.id).toBe('entry-123');
      expect(result.goalId).toBe('goal-456');
      expect(result.value).toBe(500);
      expect(result.description).toBe('Monthly deposit');
      expect(result.month).toBe(6);
      expect(result.year).toBe(2025);
      expect(result.expenseId).toBeUndefined();
    });

    it('should map entry linked to expense', () => {
      const entryWithExpense: GoalEntryRow = {
        ...baseEntry,
        expense_id: 'exp-123',
      };

      const result = mapGoalEntry(entryWithExpense);

      expect(result.expenseId).toBe('exp-123');
    });

    it('should handle null description', () => {
      const entryNoDesc: GoalEntryRow = {
        ...baseEntry,
        description: null,
      };

      const result = mapGoalEntry(entryNoDesc);

      expect(result.description).toBeUndefined();
    });

    it('should convert value to number', () => {
      // Database might return numeric as string
      const entryWithStringValue = {
        ...baseEntry,
        value: '750' as unknown as number,
      };

      const result = mapGoalEntry(entryWithStringValue);

      expect(result.value).toBe(750);
      expect(typeof result.value).toBe('number');
    });
  });

  describe('batch mapping functions', () => {
    describe('mapExpenses', () => {
      it('should map array of expenses', () => {
        const expenses: ExpenseRow[] = [
          {
            id: 'exp-1',
            month_id: 'month-1',
            family_id: 'family-123',
            title: 'Expense 1',
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
          },
          {
            id: 'exp-2',
            month_id: 'month-1',
            family_id: 'family-123',
            title: 'Expense 2',
            category_key: 'prazeres',
            subcategory_id: null,
            value: 200,
            is_recurring: false,
            is_pending: false,
            due_day: null,
            recurring_expense_id: null,
            installment_current: null,
            installment_total: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ];

        const result = mapExpenses(expenses);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('exp-1');
        expect(result[1].id).toBe('exp-2');
      });

      it('should return empty array for empty input', () => {
        expect(mapExpenses([])).toEqual([]);
      });
    });

    describe('mapRecurringExpenses', () => {
      it('should map array of recurring expenses', () => {
        const recurring: RecurringExpenseRow[] = [
          {
            id: 'rec-1',
            family_id: 'fam-1',
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
          },
        ];

        const result = mapRecurringExpenses(recurring);

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Netflix');
      });
    });

    describe('mapSubcategories', () => {
      it('should map array of subcategories', () => {
        const subcategories: SubcategoryRow[] = [
          {
            id: 'sub-1',
            family_id: 'fam-1',
            name: 'Supermercado',
            category_key: 'essenciais',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          {
            id: 'sub-2',
            family_id: 'fam-1',
            name: 'Restaurante',
            category_key: 'prazeres',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ];

        const result = mapSubcategories(subcategories);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Supermercado');
        expect(result[1].name).toBe('Restaurante');
      });
    });

    describe('mapIncomeSources', () => {
      it('should map array of income sources', () => {
        const sources: IncomeSourceRow[] = [
          {
            id: 'source-1',
            month_id: 'month-1',
            name: 'Salary',
            value: 5000,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          {
            id: 'source-2',
            month_id: 'month-1',
            name: 'Freelance',
            value: 2000,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ];

        const result = mapIncomeSources(sources);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Salary');
        expect(result[1].value).toBe(2000);
      });
    });

    describe('mapGoals', () => {
      it('should map array of goals', () => {
        const goals: GoalRow[] = [
          {
            id: 'goal-1',
            family_id: 'fam-1',
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
          },
          {
            id: 'goal-2',
            family_id: 'fam-1',
            name: 'Vacation',
            target_value: 5000,
            target_month: 12,
            target_year: 2025,
            account: null,
            linked_subcategory_id: null,
            linked_category_key: null,
            status: 'active',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ];

        const result = mapGoals(goals);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Emergency Fund');
        expect(result[1].targetMonth).toBe(12);
      });
    });

    describe('mapGoalEntries', () => {
      it('should map array of goal entries', () => {
        const entries: GoalEntryRow[] = [
          {
            id: 'entry-1',
            goal_id: 'goal-1',
            expense_id: null,
            value: 500,
            description: 'Deposit 1',
            month: 1,
            year: 2025,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          {
            id: 'entry-2',
            goal_id: 'goal-1',
            expense_id: 'exp-1',
            value: 300,
            description: null,
            month: 2,
            year: 2025,
            created_at: '2025-02-01T00:00:00Z',
            updated_at: '2025-02-01T00:00:00Z',
          },
        ];

        const result = mapGoalEntries(entries);

        expect(result).toHaveLength(2);
        expect(result[0].description).toBe('Deposit 1');
        expect(result[1].expenseId).toBe('exp-1');
      });
    });
  });
});
