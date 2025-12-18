import { TranslationKey } from './pt';

export const en: Record<TranslationKey, string> = {
  // App
  appTitle: 'Family Budget',
  appSubtitle: 'Managing our family budget based on our goals.',
  
  // Online/Offline
  online: 'Online',
  offline: 'Offline',
  pendingChanges: 'pending changes',
  syncToCloud: 'Sync to cloud',
  offlineFamily: 'Offline Family',
  continueOffline: 'Continue Offline',
  continueOfflineDescription: 'Use the app without an account. Your data will only be saved on this device.',
  offlineMode: 'Using offline mode',
  or: 'or',
  
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
  selectMonthAndYear: 'Select the month and year to add',
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
  emptyStateSubtitle: 'Create your first month to start tracking your expenses.',
  createFirstMonth: 'Create first month',
  
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
  
  // Auth
  login: 'Login',
  signup: 'Sign up',
  logout: 'Logout',
  email: 'Email',
  password: 'Password',
  emailPlaceholder: 'your@email.com',
  passwordPlaceholder: '••••••••',
  authDescription: 'Login or create your account',
  error: 'Error',
  success: 'Success',
  fillAllFields: 'Please fill all fields',
  invalidCredentials: 'Invalid email or password',
  loginSuccess: 'Login successful!',
  signupSuccess: 'Account created! Check your email to confirm.',
  passwordTooShort: 'Password must be at least 6 characters',
  emailAlreadyRegistered: 'This email is already registered',
  loading: 'Loading...',
  
  // Auth Extended
  forgotPassword: 'Forgot password?',
  forgotPasswordDescription: 'Enter your email to receive a reset link',
  sendResetLink: 'Send reset link',
  backToLogin: 'Back to login',
  resetEmailSent: 'Reset email sent! Check your inbox.',
  enterEmailForReset: 'Enter your email to reset password',
  
  // Account Settings
  accountSettings: 'Account Settings',
  accountSettingsDescription: 'Manage your profile and security',
  profile: 'Profile',
  displayName: 'Display name',
  displayNamePlaceholder: 'Your name',
  displayNameRequired: 'Display name is required',
  profileUpdated: 'Profile updated successfully!',
  emailCannotBeChanged: 'Email cannot be changed',
  currentPassword: 'Current password',
  currentPasswordPlaceholder: 'Enter your current password',
  currentPasswordIncorrect: 'Current password is incorrect',
  newPassword: 'New password',
  newPasswordPlaceholder: 'Enter new password',
  confirmPassword: 'Confirm password',
  confirmPasswordPlaceholder: 'Confirm new password',
  passwordsDoNotMatch: 'Passwords do not match',
  passwordUpdated: 'Password updated successfully!',
  updatePassword: 'Update password',
  
  // Settings Panel Extended
  account: 'Account',
  preferences: 'Preferences',
  dataManagement: 'Data Management',
  clearOfflineCache: 'Delete offline cache',
  clearOfflineCacheWarning: 'Removes all offline data saved on this device (families, months, and expenses). This action cannot be undone.',
  offlineCacheCleared: 'Offline cache deleted. Reloading…',
  offlineCacheClearError: 'Could not delete offline cache.',
  editProfile: 'Edit Profile',
  changePassword: 'Change Password',
  loginOrSignup: 'Login or Sign Up',
  confirmNewPassword: 'Confirm New Password',
  
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
  
  // Family
  familyBudget: 'Family Budget',
  loginToAccessFamily: 'Login to access your family budget',
  welcomeFamily: 'Welcome!',
  familySetupDescription: 'Create a new family or accept an invitation to get started.',
  createFamily: 'Create Family',
  invitations: 'Invitations',
  familyName: 'Family name',
  familyNamePlaceholder: 'E.g.: Smith Family',
  familyCreated: 'Family created successfully!',
  noPendingInvitations: 'No pending invitations',
  invitedToFamily: 'You have been invited to this family',
  invitationAccepted: 'Invitation accepted!',
  selectFamily: 'Select family',
  createNewFamily: 'Create new family',
  createFamilyDescription: 'Create a new family to manage your budget.',
  create: 'Create',
  familySettings: 'Family Settings',
  members: 'Members',
  inviteEmailPlaceholder: 'Guest email',
  invitationSent: 'Invitation sent!',
  you: 'You',
  member: 'Member',
  role_owner: 'Owner',
  role_admin: 'Admin',
  role_member: 'Member',
  pendingSent: 'Sent invitations',
  familyNameUpdated: 'Family name updated!',
  leaveFamily: 'Leave family',
  deleteFamily: 'Delete family',
  leaveFamilyConfirm: 'Leave family?',
  leaveFamilyWarning: 'You will lose access to this family budget.',
  deleteFamilyConfirm: 'Delete family?',
  deleteFamilyWarning: 'This action is irreversible. All budget data will be lost.',
  familyDeleted: 'Family deleted',
  leftFamily: 'You left the family',
  accept: 'Accept',
  family: 'Family',
  pendingInvitations: 'Pending invitations',
  noFamilySelected: 'No family selected',
  leave: 'Leave',
  promoteAdminFirst: 'Promote another member to admin before leaving',
  
  // Email Verification
  emailVerificationTitle: 'Verify your email',
  emailVerificationDescription: 'We sent a confirmation link to',
  emailVerificationInstructions: 'Click the link in the email to activate your account.',
  resendVerificationEmail: 'Resend email',
  verificationEmailResent: 'Verification email resent!',
  checkSpamFolder: "Didn't find it? Check your spam folder.",
  emailConfirmedSuccess: 'Email confirmed! You can use the app now.',
};
