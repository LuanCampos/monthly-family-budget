import { TranslationKey } from './pt';

export const en: Record<TranslationKey, string> = {
  // App
  appTitle: 'Home Budget',
  appSubtitle: 'Managing our family budget based on our goals.',
  
  // Navigation & Actions
  import: 'Import',
  export: 'Export',
  save: 'Save',
  cancel: 'Cancel',
  add: 'Add',
  edit: 'Edit',
  remove: 'Remove',
  confirm: 'Confirm',
  back: 'Back',
  close: 'Close',
  delete: 'Delete',
  
  // Month Selector
  selectMonth: 'Select a month',
  noMonthSelected: 'No month selected',
  addMonth: 'Add Month',
  deleteMonth: 'Delete month',
  deleteMonthConfirm: 'Are you sure you want to delete the month',
  deleteMonthWarning: 'This action cannot be undone.',
  deleteCurrentMonth: 'Delete current month',
  deleteCurrentMonthDescription: 'Delete the current month and all its expenses. This action cannot be undone.',
  
  // Income
  monthlyIncome: 'Monthly income',
  
  // Categories
  categories: 'Categories',
  expenses: 'Expenses',
  summary: 'Summary',
  goals: 'Goals',
  
  // Category Names (capitalized)
  'essenciais': 'Essentials',
  'conforto': 'Comfort',
  'metas': 'Goals',
  'prazeres': 'Pleasures',
  'liberdade': 'Financial Freedom',
  'conhecimento': 'Knowledge',
  
  // Summary Table
  budget: 'Budget',
  amountSpent: 'Amount Spent',
  shouldSpend: 'Should Spend',
  used: 'Used',
  totalSpent: 'Total spent',
  totalRemaining: 'Remaining',
  
  // Expense List
  monthExpenses: 'Monthly expenses',
  noExpenses: 'No expenses recorded',
  addExpense: 'Add Expense',
  newExpense: 'New Expense',
  editExpense: 'Edit Expense',
  expenseTitle: 'Title',
  expenseValue: 'Value',
  expenseCategory: 'Category',
  expenseSubcategory: 'Subcategory',
  saveChanges: 'Save changes',
  
  // Recurring Expenses
  recurringExpenses: 'Recurring Expenses',
  addRecurringExpense: 'Add Recurring',
  newRecurringExpense: 'New Recurring Expense',
  editRecurringExpense: 'Edit Recurring Expense',
  recurringExpensesDescription: 'These expenses are automatically added to each new month.',
  noRecurringExpenses: 'No recurring expenses registered',
  dueDay: 'Due day',
  day: 'Day',
  hasInstallments: 'Fixed term',
  totalInstallments: 'Number of installments',
  startMonth: 'Start month',
  startYear: 'Start year',
  installment: 'Installment',
  installments: 'Installments',
  installmentOf: 'of',
  applyToCurrentMonth: 'Apply to current month',
  alreadyInCurrentMonth: 'Already in this month',

  // Pending Payment
  pendingPayment: 'Pending Payment',
  confirmPayment: 'Confirm payment',
  confirmPaymentMessage: 'Do you want to confirm the payment of this expense?',
  dueOn: 'Due on',
  
  // Subcategories
  subcategories: 'Subcategories',
  manageSubcategories: 'Manage Subcategories',
  addSubcategory: 'Add subcategory',
  editSubcategory: 'Edit subcategory',
  subcategoryName: 'Subcategory name',
  noSubcategories: 'No subcategories',
  noSubcategoryExpenses: 'No subcategory with expenses',
  notSpecified: 'Not specified',

  // Goals
  editGoals: 'Edit Goals',
  percentage: 'Percentage',
  total: 'Total',
  
  // Filters
  all: 'All',
  recurring: 'Recurring',
  pending: 'Pending',
  
  // Sorting
  sortBy: 'Sort by',
  sortCategory: 'Category',
  sortValue: 'Value',
  sortDueDate: 'Due Date',
  
  // Empty States
  emptyStateTitle: 'Start by adding a month to manage your budget.',
  emptyStateSubtitle: 'Click the + button next to the month selector.',
  
  // Update Options
  updateRecurringTitle: 'Apply changes',
  updateRecurringDescription: 'Do you want to apply changes only to future expenses or also update expenses already created in previous months?',
  updateFutureOnly: 'Only Future',
  updateAll: 'Update All',
  
  // Settings
  settings: 'Settings',
  language: 'Language',
  theme: 'Theme',
  backup: 'Backup',
  backupDescription: 'Export your data to backup or import an existing backup.',
  importBackup: 'Import Backup',
  exportBackup: 'Export Backup',
  importError: 'Invalid or corrupted file',
  
  // Languages
  portuguese: 'Português',
  english: 'English',
  
  // Themes
  themeDark: 'Dark',
  themeLight: 'Light',
  themeNord: 'Nord',
  themeDracula: 'Dracula',
  themeSolarized: 'Solarized',
  themeGruvbox: 'Gruvbox',
  themeCatppuccin: 'Catppuccin',
  
  // Currency
  currency: 'Currency',
  
  // Annual View
  annualView: 'Annual View',
  annualViewTitle: 'Expenses by Category',
  
  // Months
  'month-0': 'January',
  'month-1': 'February',
  'month-2': 'March',
  'month-3': 'April',
  'month-4': 'May',
  'month-5': 'June',
  'month-6': 'July',
  'month-7': 'August',
  'month-8': 'September',
  'month-9': 'October',
  'month-10': 'November',
  'month-11': 'December',
};
