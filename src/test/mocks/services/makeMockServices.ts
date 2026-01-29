/**
 * Centralized service and adapter mocks for testing
 * Use these mocks consistently across all test files
 */
import { vi } from 'vitest';

// ============================================================================
// Storage Adapter Mocks
// ============================================================================

export const mockStorageAdapter = {
  getMonths: vi.fn().mockResolvedValue([]),
  insertMonth: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'month-123', ...data })),
  updateMonth: vi.fn().mockResolvedValue({ id: 'month-123' }),
  deleteMonth: vi.fn().mockResolvedValue(undefined),
  
  getExpenses: vi.fn().mockResolvedValue([]),
  insertExpense: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'expense-123', ...data })),
  updateExpense: vi.fn().mockResolvedValue({ id: 'expense-123' }),
  deleteExpense: vi.fn().mockResolvedValue(undefined),
  
  getRecurringExpenses: vi.fn().mockResolvedValue([]),
  insertRecurringExpense: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'recurring-123', ...data })),
  updateRecurringExpense: vi.fn().mockResolvedValue({ id: 'recurring-123' }),
  deleteRecurringExpense: vi.fn().mockResolvedValue(undefined),
  
  getSubcategories: vi.fn().mockResolvedValue([]),
  insertSubcategory: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'subcategory-123', ...data })),
  updateSubcategory: vi.fn().mockResolvedValue({ id: 'subcategory-123' }),
  deleteSubcategory: vi.fn().mockResolvedValue(undefined),
  
  getCategoryLimits: vi.fn().mockResolvedValue([]),
  upsertCategoryLimits: vi.fn().mockResolvedValue([]),
  
  getIncomeSources: vi.fn().mockResolvedValue([]),
  insertIncomeSource: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'income-123', ...data })),
  updateIncomeSource: vi.fn().mockResolvedValue({ id: 'income-123' }),
  deleteIncomeSource: vi.fn().mockResolvedValue(undefined),
};


export function makeMockOfflineAdapter() {
  return {
    isOfflineId: vi.fn().mockReturnValue(false),
    generateOfflineId: vi.fn().mockReturnValue('offline-id-1'),
    getPendingChanges: vi.fn().mockResolvedValue([]),
    syncPendingChanges: vi.fn().mockResolvedValue([]),
    clearPendingChanges: vi.fn().mockResolvedValue(undefined),
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    getAllByIndex: vi.fn().mockResolvedValue([]),
    sync: {
      add: vi.fn(),
      getAll: vi.fn().mockResolvedValue([]),
      getByFamily: vi.fn().mockResolvedValue([]),
      remove: vi.fn(),
    },
  };
}

// ============================================================================
// Budget Service Mocks
// ============================================================================

export const mockBudgetService = {
  getMonths: vi.fn().mockResolvedValue([]),
  insertMonth: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'month-123', ...data })),
  updateMonth: vi.fn().mockResolvedValue({ id: 'month-123' }),
  deleteMonth: vi.fn().mockResolvedValue(undefined),
  
  getExpenses: vi.fn().mockResolvedValue([]),
  insertExpense: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'expense-123', ...data })),
  updateExpense: vi.fn().mockResolvedValue({ id: 'expense-123' }),
  deleteExpense: vi.fn().mockResolvedValue(undefined),
  
  getRecurringExpenses: vi.fn().mockResolvedValue([]),
  insertRecurringExpense: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'recurring-123', ...data })),
  updateRecurringExpense: vi.fn().mockResolvedValue({ id: 'recurring-123' }),
  deleteRecurringExpense: vi.fn().mockResolvedValue(undefined),
  
  getSubcategories: vi.fn().mockResolvedValue([]),
  insertSubcategory: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'subcategory-123', ...data })),
  updateSubcategory: vi.fn().mockResolvedValue({ id: 'subcategory-123' }),
  deleteSubcategory: vi.fn().mockResolvedValue(undefined),
  
  getCategoryLimits: vi.fn().mockResolvedValue([]),
  upsertCategoryLimits: vi.fn().mockResolvedValue([]),
  
  getIncomeSources: vi.fn().mockResolvedValue([]),
  insertIncomeSource: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'income-123', ...data })),
  updateIncomeSource: vi.fn().mockResolvedValue({ id: 'income-123' }),
  deleteIncomeSource: vi.fn().mockResolvedValue(undefined),
};

// ============================================================================
// Goal Service Mocks
// ============================================================================

export const mockGoalService = {
  getGoals: vi.fn().mockResolvedValue([]),
  insertGoal: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'goal-123', ...data })),
  updateGoal: vi.fn().mockResolvedValue({ id: 'goal-123' }),
  deleteGoal: vi.fn().mockResolvedValue(undefined),
  
  getGoalEntries: vi.fn().mockResolvedValue([]),
  insertGoalEntry: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'entry-123', ...data })),
  updateGoalEntry: vi.fn().mockResolvedValue({ id: 'entry-123' }),
  deleteGoalEntry: vi.fn().mockResolvedValue(undefined),
};

// ============================================================================
// Family Service Mocks
// ============================================================================

export const mockFamilyService = {
  getFamilies: vi.fn().mockResolvedValue([]),
  createFamily: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'family-123', ...data })),
  updateFamily: vi.fn().mockResolvedValue({ id: 'family-123' }),
  deleteFamily: vi.fn().mockResolvedValue(undefined),

  getFamilyMembers: vi.fn().mockResolvedValue([]),
  inviteMember: vi.fn().mockResolvedValue({ id: 'invite-123' }),
  removeMember: vi.fn().mockResolvedValue(undefined),

  getInvitations: vi.fn().mockResolvedValue([]),
  acceptInvitation: vi.fn().mockResolvedValue(undefined),
  declineInvitation: vi.fn().mockResolvedValue(undefined),

  // Métodos extras usados em OnlineContext.test.tsx
  insertToTable: vi.fn(),
  insertFamily: vi.fn(),
  insertFamilyMember: vi.fn(),
  deleteMembersByFamily: vi.fn(),
  updateInTable: vi.fn(),
  deleteByIdFromTable: vi.fn(),
};

// ============================================================================
// Hook Mocks
// ============================================================================

/**
 * Default mock return value for useBudget hook
 */
export const mockUseBudgetReturn = {
  months: [],
  currentMonth: null,
  currentMonthId: null,
  recurringExpenses: [],
  subcategories: [],
  loading: false,
  hasInitialized: true,
  addMonth: vi.fn(),
  selectMonth: vi.fn(),
  addExpense: vi.fn(),
  removeExpense: vi.fn(),
  updateExpense: vi.fn(),
  confirmPayment: vi.fn(),
  addRecurringExpense: vi.fn(),
  removeRecurringExpense: vi.fn(),
  updateRecurringExpense: vi.fn(),
  applyRecurringToCurrentMonth: vi.fn(),
  addSubcategory: vi.fn(),
  updateSubcategory: vi.fn(),
  removeSubcategory: vi.fn(),
  getCategorySummary: vi.fn().mockReturnValue([]),
  getTotals: vi.fn().mockReturnValue({ totalSpent: 0, totalBudget: 0, usedPercentage: 0 }),
  removeMonth: vi.fn(),
  currentMonthLimits: {},
  updateMonthLimits: vi.fn(),
  addIncomeSource: vi.fn(),
  updateIncomeSource: vi.fn(),
  deleteIncomeSource: vi.fn(),
};

/**
 * Default mock return value for useGoals hook
 */
export const mockUseGoalsReturn = {
  goals: [],
  entriesByGoal: {},
  loading: false,
  loadGoals: vi.fn(),
  addGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
  getEntries: vi.fn().mockResolvedValue([]),
  refreshEntries: vi.fn().mockResolvedValue([]),
  addManualEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
  getHistoricalExpenses: vi.fn().mockResolvedValue([]),
  importExpense: vi.fn(),
  getMonthlySuggestion: vi.fn().mockResolvedValue(null),
};

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a fresh copy of all service mocks (useful for beforeEach)
 */
export const createFreshServiceMocks = () => ({
  storageAdapter: {
    ...mockStorageAdapter,
    getMonths: vi.fn().mockResolvedValue([]),
    insertMonth: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'month-123', ...data })),
    // ... (add other fresh mocks as needed)
  },
  offlineAdapter: {
    ...makeMockOfflineAdapter,
    isOfflineId: vi.fn().mockReturnValue(false),
  },
  budgetService: {
    ...mockBudgetService,
    getMonths: vi.fn().mockResolvedValue([]),
  },
  goalService: {
    ...mockGoalService,
    getGoals: vi.fn().mockResolvedValue([]),
  },
  familyService: {
    ...mockFamilyService,
    getFamilies: vi.fn().mockResolvedValue([]),
  },
});

/**
 * Creates a fresh copy of useBudget mock return value
 */
export const createMockUseBudget = (overrides = {}) => ({
  ...mockUseBudgetReturn,
  getCategorySummary: vi.fn().mockReturnValue([]),
  getTotals: vi.fn().mockReturnValue({ totalSpent: 0, totalBudget: 0, usedPercentage: 0 }),
  ...overrides,
});

/**
 * Creates a fresh copy of useGoals mock return value
 */
export const createMockUseGoals = (overrides = {}) => ({
  ...mockUseGoalsReturn,
  getEntries: vi.fn().mockResolvedValue([]),
  refreshEntries: vi.fn().mockResolvedValue([]),
  getHistoricalExpenses: vi.fn().mockResolvedValue([]),
  getMonthlySuggestion: vi.fn().mockResolvedValue(null),
  ...overrides,
});
