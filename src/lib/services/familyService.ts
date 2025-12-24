/**
 * Family Service - Centralized Supabase API calls for family operations
 * 
 * This service handles all database operations related to:
 * - Families (CRUD)
 * - Family members (CRUD)
 * - Family invitations (CRUD)
 * 
 * All Supabase queries for these entities should go through this service.
 */

import { supabase } from '../supabase';

// ============================================================================
// FAMILY QUERIES
// ============================================================================

export const getFamiliesByUser = async (userId: string) => {
  return supabase
    .from('family_member')
    .select(`
      family_id,
      family (
        id,
        name,
        created_by,
        created_at
      )
    `)
    .eq('user_id', userId);
};

export const insertFamily = async (name: string, createdBy: string) => {
  return supabase
    .from('family')
    .insert({ name, created_by: createdBy })
    .select()
    .single();
};

export const updateFamilyName = async (familyId: string, name: string) => {
  return supabase
    .from('family')
    .update({ name })
    .eq('id', familyId);
};

export const deleteFamily = async (familyId: string) => {
  return supabase
    .from('family')
    .delete()
    .eq('id', familyId);
};

// ============================================================================
// FAMILY MEMBER QUERIES
// ============================================================================

export const getMembersByFamily = async (familyId: string) => {
  return supabase
    .from('family_member')
    .select('*')
    .eq('family_id', familyId);
};

export const insertFamilyMember = async (payload: {
  family_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  user_email?: string | null;
}) => {
  return supabase
    .from('family_member')
    .insert(payload);
};

export const updateMemberRole = async (memberId: string, role: string) => {
  return supabase
    .from('family_member')
    .update({ role })
    .eq('id', memberId);
};

export const deleteMember = async (memberId: string) => {
  return supabase
    .from('family_member')
    .delete()
    .eq('id', memberId);
};

export const deleteMemberByFamilyAndUser = async (familyId: string, userId: string) => {
  return supabase
    .from('family_member')
    .delete()
    .eq('family_id', familyId)
    .eq('user_id', userId);
};

export const deleteMembersByFamily = async (familyId: string) => {
  return supabase
    .from('family_member')
    .delete()
    .eq('family_id', familyId);
};

// ============================================================================
// FAMILY INVITATION QUERIES
// ============================================================================

export const getInvitationsByEmail = async (email: string) => {
  return supabase
    .from('family_invitation')
    .select(`
      *,
      family:family_id (
        name
      )
    `)
    .eq('email', email)
    .eq('status', 'pending');
};

export const getInvitationsByEmailSimple = async (email: string) => {
  return supabase
    .from('family_invitation')
    .select('*')
    .eq('email', email)
    .eq('status', 'pending');
};

export const getInvitationsByFamily = async (familyId: string) => {
  return supabase
    .from('family_invitation')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'pending');
};

export const getFamilyNamesByIds = async (familyIds: string[]) => {
  return supabase
    .from('family')
    .select('id, name')
    .in('id', familyIds);
};

export const insertInvitation = async (payload: {
  family_id: string;
  email: string;
  invited_by: string;
  family_name?: string;
}) => {
  return supabase
    .from('family_invitation')
    .insert(payload);
};

export const updateInvitationStatus = async (invitationId: string, status: 'accepted' | 'rejected' | 'expired') => {
  return supabase
    .from('family_invitation')
    .update({ status })
    .eq('id', invitationId);
};

export const deleteInvitation = async (invitationId: string) => {
  return supabase
    .from('family_invitation')
    .delete()
    .eq('id', invitationId);
};

// ============================================================================
// SYNC OPERATIONS (used by OnlineContext)
// ============================================================================

export const deleteByIdFromTable = async (table: string, id: string) => {
  return supabase.from(table).delete().eq('id', id);
};

export const insertToTable = async (table: string, data: any) => {
  return supabase.from(table).insert(data);
};

export const updateInTable = async (table: string, id: string, data: any) => {
  return supabase.from(table).update(data).eq('id', id);
};

export const insertWithSelect = async (table: string, data: any) => {
  return supabase.from(table).insert(data).select().single();
};

// Note: upsertCategoryGoal was removed. Use category_limit (per month) instead.

export const insertMonthWithId = async (data: { id: string; family_id: string; year: number; month: number; income: number }) => {
  return supabase.from('month').insert(data);
};

export const insertExpenseForSync = async (data: any) => {
  return supabase.from('expense').insert(data).select().single();
};

export const insertSubcategoryForSync = async (data: { family_id: string; name: string; category_key: string }) => {
  return supabase.from('subcategory').insert(data).select().single();
};

export const insertRecurringForSync = async (data: any) => {
  return supabase.from('recurring_expense').insert(data).select().single();
};
export const insertIncomeSourceForSync = async (data: { month_id: string; name: string; value: number }) => {
  return supabase.from('income_source').insert(data).select().single();
};

export const insertCategoryLimitForSync = async (data: { month_id: string; category_key: string; percentage: number }) => {
  return supabase.from('category_limit').insert(data).select().single();
};