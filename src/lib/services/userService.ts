/**
 * User Service - Centralized Supabase API calls for user operations
 * 
 * This service handles all database operations related to:
 * - User preferences (language, theme, currency, current family)
 * - User authentication helpers
 * 
 * All Supabase queries for user-related entities should go through this service.
 */

import { supabase } from '../supabase';

// ============================================================================
// USER PREFERENCE QUERIES
// ============================================================================

export interface UserPreference {
  id: string;
  user_id: string;
  application_key: string;
  language: string | null;
  currency: string | null;
  theme: string | null;
  current_family_id: string | null;
  updated_at: string;
}

export const getUserPreferences = async (userId: string) => {
  return supabase
    .from('user_preference')
    .select('*')
    .eq('user_id', userId)
    .eq('application_key', 'finance')
    .maybeSingle();
};

export const getCurrentFamilyPreference = async (userId: string) => {
  return supabase
    .from('user_preference')
    .select('current_family_id')
    .eq('user_id', userId)
    .eq('application_key', 'finance')
    .maybeSingle();
};

export const upsertUserPreference = async (data: {
  user_id: string;
  current_family_id?: string | null;
  language?: string | null;
  currency?: string | null;
  theme?: string | null;
  updated_at?: string;
}) => {
  return supabase
    .from('user_preference')
    .upsert({
      ...data,
      application_key: 'finance',
      updated_at: data.updated_at || new Date().toISOString()
    }, { onConflict: 'user_id,application_key' });
};

export const updateCurrentFamily = async (userId: string, familyId: string | null) => {
  return supabase
    .from('user_preference')
    .upsert({
      user_id: userId,
      application_key: 'finance',
      current_family_id: familyId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,application_key' });
};

// ============================================================================
// AUTH HELPERS
// ============================================================================

export const getSession = async () => {
  return supabase.auth.getSession();
};

/**
 * Update user profile metadata (display name, etc.)
 */
export const updateUserProfile = async (metadata: { display_name?: string; [key: string]: unknown }) => {
  return supabase.auth.updateUser({ data: metadata });
};

/**
 * Verify current password by attempting sign in
 */
export const verifyPassword = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword: string) => {
  return supabase.auth.updateUser({ password: newPassword });
};

/**
 * Send password reset email
 */
export const resetPasswordForEmail = async (email: string, redirectTo?: string) => {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
};

/**
 * Resend email verification
 */
export const resendVerificationEmail = async (email: string, redirectTo?: string) => {
  return supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
};
