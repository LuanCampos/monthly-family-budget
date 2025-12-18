import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { offlineDB, generateOfflineId, isOfflineId, syncQueue } from '@/lib/offlineStorage';

export type FamilyRole = 'owner' | 'admin' | 'member';

export interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  isOffline?: boolean;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  joined_at: string;
  user_email?: string;
  user_name?: string;
}

export interface FamilyInvitation {
  id: string;
  family_id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
  family_name?: string;
}

interface FamilyContextType {
  families: Family[];
  currentFamily: Family | null;
  currentFamilyId: string | null;
  members: FamilyMember[];
  pendingInvitations: FamilyInvitation[];
  myPendingInvitations: FamilyInvitation[];
  loading: boolean;
  userRole: FamilyRole | null;
  isCurrentFamilyOffline: boolean;
  
  // Actions
  createFamily: (name: string) => Promise<{ error: Error | null; family?: Family }>;
  createOfflineFamily: (name: string) => Promise<{ error: Error | null; family?: Family }>;
  selectFamily: (familyId: string) => Promise<void>;
  updateFamilyName: (familyId: string, name: string) => Promise<{ error: Error | null }>;
  deleteFamily: (familyId: string) => Promise<{ error: Error | null }>;
  leaveFamily: (familyId: string) => Promise<{ error: Error | null }>;
  
  // Invitations
  inviteMember: (email: string) => Promise<{ error: Error | null }>;
  acceptInvitation: (invitationId: string) => Promise<{ error: Error | null }>;
  rejectInvitation: (invitationId: string) => Promise<{ error: Error | null }>;
  cancelInvitation: (invitationId: string) => Promise<{ error: Error | null }>;
  
  // Members
  updateMemberRole: (memberId: string, role: FamilyRole) => Promise<{ error: Error | null }>;
  removeMember: (memberId: string) => Promise<{ error: Error | null }>;
  
  // Refresh
  refreshFamilies: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<FamilyInvitation[]>([]);
  const [myPendingInvitations, setMyPendingInvitations] = useState<FamilyInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const currentFamily = families.find(f => f.id === currentFamilyId) || null;
  const userRole = members.find(m => m.user_id === user?.id && m.family_id === currentFamilyId)?.role || null;
  const isCurrentFamilyOffline = currentFamily?.isOffline ?? isOfflineId(currentFamilyId || '');

  // Load offline families
  const loadOfflineFamilies = useCallback(async (): Promise<Family[]> => {
    try {
      const offlineFamilies = await offlineDB.getAll<Family>('families');
      return offlineFamilies.map(f => ({ ...f, isOffline: true }));
    } catch {
      return [];
    }
  }, []);

  // Load user's families (cloud + offline)
  const refreshFamilies = useCallback(async () => {
    const offlineFamilies = await loadOfflineFamilies();

    if (!user) {
      setFamilies(offlineFamilies);
      return;
    }

    try {
      const { data, error } = await supabase
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
        .eq('user_id', user.id);

      if (!error && data) {
        const cloudFamilies = data
          .map((d: any) => ({ ...d.family, isOffline: false }))
          .filter(Boolean) as Family[];
        
        // Merge cloud and offline families
        setFamilies([...cloudFamilies, ...offlineFamilies]);
      } else {
        setFamilies(offlineFamilies);
      }
    } catch (e) {
      console.log('Error loading families, using offline only');
      setFamilies(offlineFamilies);
    }
  }, [user, loadOfflineFamilies]);

  // Load current family's members
  const refreshMembers = useCallback(async () => {
    if (!currentFamilyId) {
      setMembers([]);
      return;
    }

    // Offline families don't have cloud members
    if (isOfflineId(currentFamilyId)) {
      setMembers([{
        id: 'offline-member',
        family_id: currentFamilyId,
        user_id: user?.id || 'offline-user',
        role: 'owner',
        joined_at: new Date().toISOString(),
      }]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('family_member')
        .select('*')
        .eq('family_id', currentFamilyId);

      if (!error && data) {
        setMembers(data);
      }
    } catch (e) {
      console.log('Family tables not yet created');
      setMembers([]);
    }
  }, [currentFamilyId, user?.id]);

  // Load only MY pending invitations (invitations sent TO me)
  // This can be called even when on offline family
  const refreshMyInvitations = useCallback(async () => {
    if (!user?.email) {
      setMyPendingInvitations([]);
      return;
    }

    try {
      // First get invitations without JOIN to avoid RLS issues
      const { data: myInvites, error } = await supabase
        .from('family_invitation')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'pending');

      if (error) {
        console.log('Error fetching invitations:', error);
        setMyPendingInvitations([]);
        return;
      }

      if (myInvites && myInvites.length > 0) {
        // Fetch family names separately
        const familyIds = [...new Set(myInvites.map(inv => inv.family_id))];
        const { data: familiesData } = await supabase
          .from('family')
          .select('id, name')
          .in('id', familyIds);

        const familyNameMap = new Map(familiesData?.map(f => [f.id, f.name]) || []);

        setMyPendingInvitations(
          myInvites.map((inv: any) => ({
            ...inv,
            family_name: familyNameMap.get(inv.family_id) || 'Família'
          }))
        );
      } else {
        setMyPendingInvitations([]);
      }
    } catch (e) {
      console.log('Error in refreshMyInvitations:', e);
      setMyPendingInvitations([]);
    }
  }, [user?.email]);

  // Load family-specific invitations (invitations sent FROM current family)
  // Only called for online families
  const refreshFamilyInvitations = useCallback(async () => {
    if (!currentFamilyId || isOfflineId(currentFamilyId)) {
      setPendingInvitations([]);
      return;
    }

    try {
      const { data: familyInvites } = await supabase
        .from('family_invitation')
        .select('*')
        .eq('family_id', currentFamilyId)
        .eq('status', 'pending');

      if (familyInvites) {
        setPendingInvitations(familyInvites);
      }
    } catch {
      setPendingInvitations([]);
    }
  }, [currentFamilyId]);

  // Combined refresh for backwards compatibility
  const refreshInvitations = useCallback(async () => {
    await Promise.all([
      refreshMyInvitations(),
      refreshFamilyInvitations()
    ]);
  }, [refreshMyInvitations, refreshFamilyInvitations]);

  // Load user preferences to get current family
  const loadUserPreferences = useCallback(async () => {
    // If no user, only allow offline families from localStorage
    if (!user) {
      const savedFamilyId = localStorage.getItem('current-family-id');
      // Only restore if it's an offline family ID
      if (savedFamilyId && isOfflineId(savedFamilyId)) {
        setCurrentFamilyId(savedFamilyId);
      } else {
        // Clear any cloud family selection when logged out
        setCurrentFamilyId(null);
        localStorage.removeItem('current-family-id');
      }
      return;
    }

    try {
      const { data } = await supabase
        .from('user_preference')
        .select('current_family_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.current_family_id) {
        setCurrentFamilyId(data.current_family_id);
        localStorage.setItem('current-family-id', data.current_family_id);
      } else {
        // User logged in but no family preference - check localStorage for offline family
        const savedFamilyId = localStorage.getItem('current-family-id');
        if (savedFamilyId && isOfflineId(savedFamilyId)) {
          setCurrentFamilyId(savedFamilyId);
        }
      }
    } catch (e) {
      console.log('User preferences table not yet created');
    }
  }, [user]);

  // Save current family to preferences
  const saveCurrentFamily = useCallback(async (familyId: string | null) => {
    // Always save to localStorage for offline access
    if (familyId) {
      localStorage.setItem('current-family-id', familyId);
    } else {
      localStorage.removeItem('current-family-id');
    }

    if (!user || !familyId || isOfflineId(familyId)) return;

    try {
      await supabase
        .from('user_preference')
        .upsert({
          user_id: user.id,
          current_family_id: familyId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    } catch (e) {
      console.log('User preferences table not yet created');
    }
  }, [user]);

  // Reset state when user logs out
  useEffect(() => {
    if (!user) {
      // Clear all cloud-related state on logout
      setMembers([]);
      setPendingInvitations([]);
      setMyPendingInvitations([]);
      // currentFamilyId and families are handled by loadUserPreferences/refreshFamilies
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshFamilies();
      await loadUserPreferences();
      // Only check MY invitations during initial load (not family-specific)
      if (user) {
        await refreshMyInvitations();
      }
      setLoading(false);
    };
    init();
  }, [user, refreshFamilies, loadUserPreferences, refreshMyInvitations]);

  // Load members and family invitations when family changes
  useEffect(() => {
    if (!currentFamilyId) return;
    
    // Always refresh members (handles both online and offline)
    refreshMembers();
    
    // Only refresh family invitations for online families
    if (!isOfflineId(currentFamilyId)) {
      refreshFamilyInvitations();
    } else {
      // Clear family invitations when switching to offline
      setPendingInvitations([]);
    }
  }, [currentFamilyId, refreshMembers, refreshFamilyInvitations]);

  // Track which family IDs we've already tried to reload for
  const attemptedReloadRef = useRef<string | null>(null);
  const lastFamiliesLengthRef = useRef<number>(0);

  // Handle case where currentFamilyId is set but family is not found in the array
  // This can happen when switching to an offline family that hasn't been loaded yet
  useEffect(() => {
    const handleMissingFamily = async () => {
      if (!currentFamilyId || loading) return;
      
      // Check if family exists in current list
      const familyExists = families.some(f => f.id === currentFamilyId);
      
      if (familyExists) {
        // Reset the ref when family is found
        attemptedReloadRef.current = null;
        lastFamiliesLengthRef.current = families.length;
        return;
      }
      
      // Don't retry if families length hasn't changed (prevents infinite loops)
      if (attemptedReloadRef.current === currentFamilyId && 
          lastFamiliesLengthRef.current === families.length) {
        // We already tried to reload for this ID and family still not found
        console.log('Family not found after reload, clearing invalid ID:', currentFamilyId);
        setCurrentFamilyId(null);
        localStorage.removeItem('current-family-id');
        attemptedReloadRef.current = null;
        return;
      }
      
      // Mark that we're attempting reload for this family ID
      attemptedReloadRef.current = currentFamilyId;
      lastFamiliesLengthRef.current = families.length;
      
      // Try to reload families only once
      await refreshFamilies();
    };
    
    handleMissingFamily();
  }, [currentFamilyId, families.length, loading, refreshFamilies]);

  // Create offline family (always works, even without auth)
  const createOfflineFamily = async (name: string) => {
    const id = generateOfflineId('family');
    const now = new Date().toISOString();

    const family: Family = {
      id,
      name,
      created_by: user?.id || 'offline-user',
      created_at: now,
      isOffline: true,
    };

    await offlineDB.put('families', family);
    await refreshFamilies();
    await selectFamily(id);

    return { error: null, family };
  };

  // Create family (cloud if online + authenticated, offline otherwise)
  const createFamily = async (name: string) => {
    // Check if we can create in cloud
    const ensuredSession = session ?? (await supabase.auth.getSession()).data.session;
    const sessionUser = ensuredSession?.user;

    if (!navigator.onLine || !sessionUser) {
      // Create offline family
      return createOfflineFamily(name);
    }

    // Create cloud family
    const { data: family, error } = await supabase
      .from('family')
      .insert({ name, created_by: sessionUser.id })
      .select()
      .single();

    if (error) {
      // Fallback to offline on error
      console.error('Cloud family creation failed, creating offline:', error);
      return createOfflineFamily(name);
    }

    // Ensure creator becomes a member/owner
    const { error: memberError } = await supabase
      .from('family_member')
      .insert({
        family_id: family.id,
        user_id: sessionUser.id,
        role: 'owner',
      });

    if (memberError && (memberError as any).code !== '23505') {
      console.error('Member creation error:', memberError);
    }

    await refreshFamilies();
    await selectFamily(family.id);

    return { error: null, family: { ...family, isOffline: false } };
  };

  // Select family
  const selectFamily = async (familyId: string) => {
    // If switching to an offline family (different from current), reload the page
    // to ensure IndexedDB connections are fresh and avoid state issues
    const switchingToOffline = isOfflineId(familyId);
    const alreadyOnThisFamily = currentFamilyId === familyId;

    if (switchingToOffline && !alreadyOnThisFamily) {
      localStorage.setItem('current-family-id', familyId);
      window.location.reload();
      return;
    }

    setCurrentFamilyId(familyId);
    await saveCurrentFamily(familyId);
  };

  // Update family name
  const updateFamilyName = async (familyId: string, name: string) => {
    if (isOfflineId(familyId)) {
      const family = await offlineDB.get<Family>('families', familyId);
      if (family) {
        await offlineDB.put('families', { ...family, name });
        await refreshFamilies();
      }
      return { error: null };
    }

    const { error } = await supabase
      .from('family')
      .update({ name })
      .eq('id', familyId);

    if (!error) await refreshFamilies();
    return { error };
  };

  // Delete family
  const deleteFamily = async (familyId: string) => {
    if (isOfflineId(familyId)) {
      // Delete offline family and all related data
      const months = await offlineDB.getAllByIndex<any>('months', 'family_id', familyId);
      for (const month of months) {
        const expenses = await offlineDB.getAllByIndex<any>('expenses', 'month_id', month.id);
        for (const exp of expenses) await offlineDB.delete('expenses', exp.id);
        await offlineDB.delete('months', month.id);
      }
      
      const recurring = await offlineDB.getAllByIndex<any>('recurring_expenses', 'family_id', familyId);
      for (const rec of recurring) await offlineDB.delete('recurring_expenses', rec.id);
      
      const subs = await offlineDB.getAllByIndex<any>('subcategories', 'family_id', familyId);
      for (const sub of subs) await offlineDB.delete('subcategories', sub.id);
      
      const goals = await offlineDB.getAllByIndex<any>('category_goals', 'family_id', familyId);
      for (const goal of goals) await offlineDB.delete('category_goals', goal.id);
      
      await offlineDB.delete('families', familyId);

      if (currentFamilyId === familyId) {
        const remaining = families.filter(f => f.id !== familyId);
        if (remaining.length > 0) {
          await selectFamily(remaining[0].id);
        } else {
          setCurrentFamilyId(null);
          await saveCurrentFamily(null);
        }
      }
      await refreshFamilies();
      return { error: null };
    }

    const { error } = await supabase
      .from('family')
      .delete()
      .eq('id', familyId);

    if (!error) {
      if (currentFamilyId === familyId) {
        const remaining = families.filter(f => f.id !== familyId);
        if (remaining.length > 0) {
          await selectFamily(remaining[0].id);
        } else {
          setCurrentFamilyId(null);
          await saveCurrentFamily(null);
        }
      }
      await refreshFamilies();
    }
    return { error };
  };

  // Leave family
  const leaveFamily = async (familyId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    if (isOfflineId(familyId)) {
      return deleteFamily(familyId);
    }

    const { error } = await supabase
      .from('family_member')
      .delete()
      .eq('family_id', familyId)
      .eq('user_id', user.id);

    if (!error) {
      if (currentFamilyId === familyId) {
        const remaining = families.filter(f => f.id !== familyId);
        if (remaining.length > 0) {
          await selectFamily(remaining[0].id);
        } else {
          setCurrentFamilyId(null);
          await saveCurrentFamily(null);
        }
      }
      await refreshFamilies();
    }
    return { error };
  };

  // Invite member
  const inviteMember = async (email: string) => {
    if (!user || !currentFamilyId) return { error: new Error('Not authenticated or no family selected') };
    
    if (isOfflineId(currentFamilyId)) {
      return { error: new Error('Convites não disponíveis em famílias offline. Sincronize primeiro.') };
    }

    const { error } = await supabase
      .from('family_invitation')
      .insert({
        family_id: currentFamilyId,
        email: email.toLowerCase(),
        invited_by: user.id
      });

    if (!error) await refreshInvitations();
    return { error };
  };

  // Accept invitation
  const acceptInvitation = async (invitationId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const invitation = myPendingInvitations.find(i => i.id === invitationId);
    if (!invitation) return { error: new Error('Invitation not found') };

    // Update invitation status
    const { error: updateError } = await supabase
      .from('family_invitation')
      .update({ status: 'accepted' })
      .eq('id', invitationId);

    if (updateError) return { error: updateError };

    // Add user to family
    const { error: memberError } = await supabase
      .from('family_member')
      .insert({
        family_id: invitation.family_id,
        user_id: user.id,
        role: 'member'
      });

    if (memberError) return { error: memberError };

    await refreshFamilies();
    await refreshInvitations();
    await selectFamily(invitation.family_id);

    return { error: null };
  };

  // Reject invitation
  const rejectInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('family_invitation')
      .update({ status: 'rejected' })
      .eq('id', invitationId);

    if (!error) await refreshInvitations();
    return { error };
  };

  // Cancel invitation
  const cancelInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('family_invitation')
      .delete()
      .eq('id', invitationId);

    if (!error) await refreshInvitations();
    return { error };
  };

  // Update member role
  const updateMemberRole = async (memberId: string, role: FamilyRole) => {
    const { error } = await supabase
      .from('family_member')
      .update({ role })
      .eq('id', memberId);

    if (!error) await refreshMembers();
    return { error };
  };

  // Remove member
  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('family_member')
      .delete()
      .eq('id', memberId);

    if (!error) await refreshMembers();
    return { error };
  };

  return (
    <FamilyContext.Provider
      value={{
        families,
        currentFamily,
        currentFamilyId,
        members,
        pendingInvitations,
        myPendingInvitations,
        loading,
        userRole,
        isCurrentFamilyOffline,
        createFamily,
        createOfflineFamily,
        selectFamily,
        updateFamilyName,
        deleteFamily,
        leaveFamily,
        inviteMember,
        acceptInvitation,
        rejectInvitation,
        cancelInvitation,
        updateMemberRole,
        removeMember,
        refreshFamilies,
        refreshMembers,
        refreshInvitations,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};
