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
    .maybeSingle();
};

export const getCurrentFamilyPreference = async (userId: string) => {
  return supabase
    .from('user_preference')
    .select('current_family_id')
    .eq('user_id', userId)
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
      updated_at: data.updated_at || new Date().toISOString()
    }, { onConflict: 'user_id' });
};

export const updateCurrentFamily = async (userId: string, familyId: string | null) => {
  return supabase
    .from('user_preference')
    .upsert({
      user_id: userId,
      current_family_id: familyId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
};

// ============================================================================
// AUTH HELPERS
// ============================================================================

export const getSession = async () => {
  return supabase.auth.getSession();
};
