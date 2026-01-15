/**
 * Goal Adapters Index
 * 
 * Re-exports all goal-related adapter functions.
 * This maintains backwards compatibility with the previous single-file goalAdapter.
 */

// Core goal operations
export {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalBySubcategoryId,
  getGoalByCategoryKey,
} from './goalCoreAdapter';

// Entry operations
export {
  getEntries,
  createEntry,
  createManualEntry,
  updateEntry,
  deleteEntry,
  getEntryByExpense,
  getHistoricalExpenses,
  importExpense,
} from './goalEntryAdapter';

// Calculation operations
export {
  calculateMonthlySuggestion,
} from './goalCalculationAdapter';

// Types
export type { GoalPayload, GoalEntryPayload, MonthlySuggestionResult } from './types';
