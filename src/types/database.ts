/**
 * Database Types
 * 
 * These types represent rows from Supabase tables exactly as they come from the database.
 * They use snake_case naming to match database schema.
 * 
 * Application code should transform these into app types (camelCase) from budget.ts
 * using mappers in lib/mappers.ts or transformers in individual services.
 * 
 * Tables in Supabase (finance app):
 * - family
 * - family_member
 * - family_invitation
 * - user_preference
 * - month
 * - expense
 * - recurring_expense
 * - subcategory
 * - category_limit
 * - income_source
 * - goal
 * - goal_entry
 */

// ==========================================
// Family & User Tables
// ==========================================

export type FamilyRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface FamilyRow {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export interface FamilyMemberRow {
  id: string;
  family_id: string;
  user_id: string;
  user_email: string;
  role: FamilyRole;
  joined_at: string;
}

export interface FamilyInvitationRow {
  id: string;
  family_id: string;
  family_name: string;
  email: string;
  invited_by: string | null;
  status: InvitationStatus;
  created_at: string;
  expires_at: string;
}

export interface UserPreferenceRow {
  id: string;
  user_id: string;
  application_key: 'finance' | 'calendar';
  language: string;
  currency: string;
  theme: string;
  current_family_id: string | null;
  updated_at: string;
}

// ==========================================
// Budget Tables
// ==========================================

export interface MonthRow {
  id: string;
  family_id: string;
  year: number;
  month: number;
  income: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseRow {
  id: string;
  month_id: string;
  family_id: string;
  title: string;
  category_key: string;
  subcategory_id: string | null;
  value: number;
  is_recurring: boolean;
  is_pending: boolean;
  due_day: number | null;
  recurring_expense_id: string | null;
  installment_current: number | null;
  installment_total: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpenseRow {
  id: string;
  family_id: string;
  title: string;
  category_key: string;
  subcategory_id: string | null;
  value: number;
  due_day: number | null;
  has_installments: boolean;
  total_installments: number | null;
  start_year: number | null;
  start_month: number | null;
  created_at: string;
  updated_at: string;
}

export interface SubcategoryRow {
  id: string;
  family_id: string;
  name: string;
  category_key: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryLimitRow {
  id: string;
  month_id: string;
  category_key: string;
  percentage: number;
  created_at: string;
  updated_at: string;
}

export interface IncomeSourceRow {
  id: string;
  month_id: string;
  name: string;
  value: number;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Goals Tables
// ==========================================

export type GoalStatus = 'active' | 'archived';

export interface GoalRow {
  id: string;
  family_id: string;
  name: string;
  target_value: number;
  target_month: number | null;
  target_year: number | null;
  account: string | null;
  linked_subcategory_id: string | null;
  linked_category_key: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface GoalEntryRow {
  id: string;
  goal_id: string;
  expense_id: string | null;
  value: number;
  description: string | null;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Supabase Types
// ==========================================

/**
 * Supabase Channel types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseChannel = any;
