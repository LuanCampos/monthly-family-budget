/**
 * Goal Adapter Types
 * 
 * Shared types used across goal adapters
 */

import type { GoalStatus } from '@/types';

export interface GoalPayload {
  name: string;
  targetValue: number;
  targetMonth?: number;
  targetYear?: number;
  account?: string;
  linkedSubcategoryId?: string;
  linkedCategoryKey?: string;
  status?: GoalStatus;
}

export interface GoalEntryPayload {
  goalId: string;
  expenseId?: string;
  value: number;
  description?: string;
  month: number;
  year: number;
}

export interface MonthlySuggestionResult {
  remainingValue: number;
  monthsRemaining: number | null;
  suggestedMonthly: number | null;
  monthlyContributed: number | null;
  monthlyRemaining: number | null;
}
