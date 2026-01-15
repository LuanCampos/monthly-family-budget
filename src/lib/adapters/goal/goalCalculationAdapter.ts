/**
 * Goal Calculation Adapter
 * 
 * Functions for calculating goal-related metrics like monthly suggestions
 * Handles both online (Supabase) and offline (IndexedDB) flows
 */

import * as goalService from '../../services/goalService';
import { offlineAdapter } from '../offlineAdapter';
import { logger } from '../../logger';
import type { GoalStatus } from '@/types';
import type { GoalRow, GoalEntryRow } from '@/types/database';
import type { MonthlySuggestionResult } from './types';

/**
 * Calculate how much was contributed this month and how much is still needed
 */
const calculateCurrentMonthProgress = (entries: GoalEntryRow[]): { contributed: number; remaining: number } => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const currentMonthEntries = entries.filter(
    (entry) => entry.month === currentMonth && entry.year === currentYear
  );
  const contributed = currentMonthEntries.reduce((sum, entry) => sum + Number(entry.value || 0), 0);

  return { contributed, remaining: 0 }; // remaining will be calculated based on suggested monthly
};

/**
 * Calculate monthly contribution suggestion with intelligent logic
 * Takes into account how much was already contributed this month
 */
const calculateMonthlyPlan = (
  totalRemaining: number,
  monthsRemainingRaw: number,
  monthlyContributed: number
): {
  recommendedMonthly: number;
  monthlyRemaining: number;
} => {
  // Always consider at least the current month
  const monthsRemaining = Math.max(1, monthsRemainingRaw);

  // Average at the start of the month (includes what is already logged)
  const startOfMonthAverage = (totalRemaining + monthlyContributed) / monthsRemaining;

  // Already met or exceeded this month's average
  if (monthlyContributed >= startOfMonthAverage) {
    const monthsAfterThis = Math.max(1, monthsRemaining - 1);
    // Average after removing the current month (overachieved)
    const afterMonthAverage = totalRemaining / monthsAfterThis;

    return {
      recommendedMonthly: afterMonthAverage,
      monthlyRemaining: 0,
    };
  }

  // Still need to log this month
  const monthlyRemaining = Math.max(0, startOfMonthAverage - monthlyContributed);
  return {
    recommendedMonthly: startOfMonthAverage,
    monthlyRemaining,
  };
};

/**
 * Calculate monthly contribution suggestion based on target date
 */
export const calculateMonthlySuggestion = async (goalId: string): Promise<MonthlySuggestionResult | null> => {
  if (!navigator.onLine) {
    // Offline calculation (intelligent)
    const goal = await offlineAdapter.get<GoalRow>('goals', goalId);
    if (!goal) return null;

    const status: GoalStatus = (goal.status as GoalStatus | undefined) ?? 'active';
    if (status !== 'active') return null;

    // Calculate current value dynamically from entries
    const entries = await offlineAdapter.getAllByIndex<GoalEntryRow>('goal_entries', 'goal_id', goalId) || [];
    const currentValue = entries.reduce((sum, entry) => sum + Number(entry.value || 0), 0);
    
    const remaining = Number(goal.target_value || 0) - currentValue;
    
    if (!goal.target_month || !goal.target_year) {
      return {
        remainingValue: remaining,
        monthsRemaining: null,
        suggestedMonthly: null,
        monthlyContributed: null,
        monthlyRemaining: null,
      };
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed

    // Calculate months difference
    const diffMonths = Math.max(0, (goal.target_year - currentYear) * 12 + (goal.target_month - currentMonth));

    // Calculate current month progress
    const { contributed: monthlyContributed } = calculateCurrentMonthProgress(entries);

    // Calculate intelligent suggested monthly amount
    const { recommendedMonthly, monthlyRemaining } = calculateMonthlyPlan(remaining, diffMonths, monthlyContributed);

    return {
      remainingValue: remaining,
      monthsRemaining: diffMonths,
      suggestedMonthly: recommendedMonthly,
      monthlyContributed: monthlyContributed > 0 ? monthlyContributed : 0,
      monthlyRemaining: monthlyRemaining > 0 ? monthlyRemaining : 0,
    };
  }

  const goalResult = await goalService.getGoalById(goalId);
  if (goalResult.error || !goalResult.data) {
    logger.warn('goal.suggestion.goal_not_found', { goalId, error: goalResult.error?.message });
    return null;
  }

  const goalData = goalResult.data;
  const status: GoalStatus = (goalData.status as GoalStatus | undefined) ?? 'active';
  if (status !== 'active') return null;

  const { data, error } = await goalService.calculateMonthlySuggestion(goalId);
  if (error || !data || !Array.isArray(data) || data.length === 0) {
    logger.warn('goal.suggestion.failed', { goalId, error: error?.message });
    return null;
  }

  const result = data[0];

  // Base values from backend
  const totalRemaining = Number(result.remaining_value || 0);
  const monthsRemaining = result.months_remaining !== null ? Number(result.months_remaining) : null;
  let suggestedMonthly: number | null = result.suggested_monthly !== null ? Number(result.suggested_monthly) : null;

  // For online mode, also calculate monthly progress and adjust suggestion intelligently
  let monthlyContributed = 0;
  let monthlyRemaining = 0;

  const entries = await goalService.getEntries(goalId);
  if (!entries.error) {
    const { contributed } = calculateCurrentMonthProgress(entries.data || []);
    monthlyContributed = contributed;

    if (monthsRemaining !== null) {
      const { recommendedMonthly, monthlyRemaining: remainingThisMonth } = calculateMonthlyPlan(
        totalRemaining,
        monthsRemaining,
        monthlyContributed
      );
      suggestedMonthly = recommendedMonthly;
      monthlyRemaining = remainingThisMonth;
    }
  }

  return {
    remainingValue: totalRemaining,
    monthsRemaining,
    suggestedMonthly,
    monthlyContributed: monthlyContributed > 0 ? monthlyContributed : 0,
    monthlyRemaining: monthlyRemaining > 0 ? monthlyRemaining : 0,
  };
};
