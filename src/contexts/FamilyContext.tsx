import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import * as familyService from '@/lib/services/familyService';
import * as userService from '@/lib/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { offlineAdapter } from '@/lib/adapters/offlineAdapter';

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
  const isCurrentFamilyOffline = currentFamily?.isOffline ?? offlineAdapter.isOfflineId(currentFamilyId || '');
  const userKey = user ? `${user.id}:${user.email ?? ''}` : 'anonymous';

  // Track initialization per user identity so token refreshes don't force full reloads
  const prevUserKeyRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  // Load offline families
  const loadOfflineFamilies = useCallback(async (): Promise<Family[]> => {
    try {
      const offlineFamilies = await offlineAdapter.getAll<Family>('families');
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
      const { data, error } = await familyService.getFamiliesByUser(user.id);

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
    if (offlineAdapter.isOfflineId(currentFamilyId || '')) {
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
      const { data, error } = await familyService.getMembersByFamily(currentFamilyId);

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
      // Try to get invitations with family join - this works if RLS allows
      const { data: myInvitesWithFamily, error: joinError } = await familyService.getInvitationsByEmail(user.email);

      if (!joinError && myInvitesWithFamily) {
        setMyPendingInvitations(
          myInvitesWithFamily.map((inv: any) => ({
            ...inv,
            family_name: inv.family?.name || 'Família'
          }))
        );
        return;
      }

      // Fallback: get invitations without join (RLS might block the join)
      const { data: myInvites, error } = await familyService.getInvitationsByEmailSimple(user.email);

      if (error) {
        console.log('Error fetching invitations:', error);
        setMyPendingInvitations([]);
        return;
      }

      if (myInvites && myInvites.length > 0) {
        // Try to fetch family names separately (might fail due to RLS)
        const familyIds = [...new Set(myInvites.map(inv => inv.family_id))];
        const { data: familiesData } = await familyService.getFamilyNamesByIds(familyIds);

        const familyNameMap = new Map(familiesData?.map(f => [f.id, f.name]) || []);

        setMyPendingInvitations(
          myInvites.map((inv: any) => ({
            ...inv,
            family_name: familyNameMap.get(inv.family_id) || inv.family_name || 'Família'
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
    if (!currentFamilyId || offlineAdapter.isOfflineId(currentFamilyId || '')) {
      setPendingInvitations([]);
      return;
    }

    try {
      const { data: familyInvites } = await familyService.getInvitationsByFamily(currentFamilyId);

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
      if (savedFamilyId && offlineAdapter.isOfflineId(savedFamilyId)) {
        setCurrentFamilyId(savedFamilyId);
      } else {
        // Clear any cloud family selection when logged out
        setCurrentFamilyId(null);
        localStorage.removeItem('current-family-id');
      }
      return;
    }

    try {
      const { data } = await userService.getCurrentFamilyPreference(user.id);

      if (data?.current_family_id) {
        setCurrentFamilyId(data.current_family_id);
        localStorage.setItem('current-family-id', data.current_family_id);
      } else {
        // User logged in but no family preference - check localStorage for offline family
        const savedFamilyId = localStorage.getItem('current-family-id');
        if (savedFamilyId && offlineAdapter.isOfflineId(savedFamilyId)) {
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

    if (!user || !familyId || offlineAdapter.isOfflineId(familyId)) return;

    try {
      await userService.updateCurrentFamily(user.id, familyId);
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
    // Skip re-initialization when the same user session is refreshed (e.g. tab visibility change)
    if (hasInitializedRef.current && prevUserKeyRef.current === userKey) {
      return;
    }

    prevUserKeyRef.current = userKey;
    hasInitializedRef.current = true;

    const init = async () => {
      setLoading(true);
      
      // Load families first
      const offlineFamilies = await loadOfflineFamilies();
      let allFamilies = offlineFamilies;

      if (user) {
        try {
          const { data, error } = await familyService.getFamiliesByUser(user.id);

          if (!error && data) {
            const cloudFamilies = data
              .map((d: any) => ({ ...d.family, isOffline: false }))
              .filter(Boolean) as Family[];
            
            allFamilies = [...cloudFamilies, ...offlineFamilies];
          }
        } catch (e) {
          console.log('Error loading families, using offline only');
        }
      }
      
      setFamilies(allFamilies);
      
      // Load user preferences
      let selectedFamilyId: string | null = null;

      const savedFamilyId = localStorage.getItem('current-family-id');

      if (!user) {
        // When logged out, only restore offline families from localStorage
        if (savedFamilyId && offlineAdapter.isOfflineId(savedFamilyId)) {
          const offlineExists = allFamilies.some(f => f.id === savedFamilyId);
          if (offlineExists) {
            selectedFamilyId = savedFamilyId;
          } else {
            localStorage.removeItem('current-family-id');
          }
        }
      } else {
        // Priority 1: browser memory (localStorage) if still available
        if (savedFamilyId) {
          const savedExists = allFamilies.some(f => f.id === savedFamilyId);
          if (savedExists) {
            selectedFamilyId = savedFamilyId;
          } else {
            // Stale family id (user removed / deleted / not loaded)
            localStorage.removeItem('current-family-id');
          }
        }

        // Priority 2: user_preferences (server)
        if (!selectedFamilyId) {
          try {
            const { data } = await userService.getCurrentFamilyPreference(user.id);
            if (data?.current_family_id) {
              const familyExists = allFamilies.some(f => f.id === data.current_family_id);
              if (familyExists) {
                selectedFamilyId = data.current_family_id;
              }
            }
          } catch (e) {
            console.log('User preferences table not yet created');
          }
        }

        // Priority 3: auto-select first available family
        if (!selectedFamilyId && allFamilies.length > 0) {
          selectedFamilyId = allFamilies[0].id;
        }

        // Keep server preference in sync for online families
        if (selectedFamilyId && !offlineAdapter.isOfflineId(selectedFamilyId)) {
          userService.updateCurrentFamily(user.id, selectedFamilyId).then(() => {});
        }

        await refreshMyInvitations();
      }
      
      setCurrentFamilyId(selectedFamilyId);
      if (selectedFamilyId) {
        localStorage.setItem('current-family-id', selectedFamilyId);
      } else {
        localStorage.removeItem('current-family-id');
      }

      setLoading(false);
    };
    void init();
  }, [userKey, loadOfflineFamilies, refreshMyInvitations]);

  // Load members and family invitations when family changes
  useEffect(() => {
    if (!currentFamilyId) return;
    
    // Always refresh members (handles both online and offline)
    refreshMembers();
    
    // Only refresh family invitations for online families
    if (!offlineAdapter.isOfflineId(currentFamilyId || '')) {
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
  // This can happen when:
  // 1. Switching to an offline family that hasn't been loaded yet
  // 2. User was removed from a family by another admin
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
        // User was likely removed from this family - select another one if available
        console.log('Family not found after reload, selecting another family:', currentFamilyId);
        
        // Find remaining families to select from
        const remainingFamilies = families.filter(f => f.id !== currentFamilyId);
        
        if (remainingFamilies.length > 0) {
          // Select the first available family
          setCurrentFamilyId(remainingFamilies[0].id);
          localStorage.setItem('current-family-id', remainingFamilies[0].id);
          // Save to cloud preferences if user is logged in
          if (user && !offlineAdapter.isOfflineId(remainingFamilies[0].id)) {
            userService.updateCurrentFamily(user.id, remainingFamilies[0].id).then(() => {});
          }
        } else {
          // No families left
          setCurrentFamilyId(null);
          localStorage.removeItem('current-family-id');
        }
        
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
  }, [currentFamilyId, families, loading, refreshFamilies, user]);

  // Create offline family (always works, even without auth)
  const createOfflineFamily = async (name: string) => {
    const id = offlineAdapter.generateOfflineId('family');
    const now = new Date().toISOString();

    const family: Family = {
      id,
      name,
      created_by: user?.id || 'offline-user',
      created_at: now,
      isOffline: true,
    };

    await offlineAdapter.put('families', family as any);
    await refreshFamilies();
    await selectFamily(id);

    return { error: null, family };
  };

  // Create family (cloud if online + authenticated, offline otherwise)
  const createFamily = async (name: string) => {
    // Always get fresh session from Supabase to ensure we have the latest auth state
    const { data: { session: currentSession } } = await userService.getSession();
    const sessionUser = currentSession?.user;

    if (!navigator.onLine || !sessionUser) {
      // Create offline family
      console.log('Creating offline family. Online:', navigator.onLine, 'User:', !!sessionUser);
      return createOfflineFamily(name);
    }

    console.log('Creating cloud family for user:', sessionUser.email);

    // Create cloud family
    const { data: family, error } = await familyService.insertFamily(name, sessionUser.id);

    if (error) {
      // Fallback to offline on error
      console.error('Cloud family creation failed, creating offline:', error);
      return createOfflineFamily(name);
    }

    // Ensure creator becomes a member/owner
    const { error: memberError } = await familyService.insertFamilyMember({
      family_id: family.id,
      user_id: sessionUser.id,
      role: 'owner',
      user_email: sessionUser.email || null,
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
    setCurrentFamilyId(familyId);
    await saveCurrentFamily(familyId);
  };

  // Update family name
  const updateFamilyName = async (familyId: string, name: string) => {
    if (offlineAdapter.isOfflineId(familyId)) {
      const family = await offlineAdapter.get<Family>('families', familyId);
      if (family) {
        await offlineAdapter.put('families', { ...family, name } as any);
        await refreshFamilies();
      }
      return { error: null };
    }

    const { error } = await familyService.updateFamilyName(familyId, name);

    if (!error) await refreshFamilies();
    return { error };
  };

  // Delete family
  const deleteFamily = async (familyId: string) => {
    if (offlineAdapter.isOfflineId(familyId)) {
      // Delete offline family and all related data
      const months = await offlineAdapter.getAllByIndex<any>('months', 'family_id', familyId);
      for (const month of months) {
        const expenses = await offlineAdapter.getAllByIndex<any>('expenses', 'month_id', month.id);
        for (const exp of expenses) await offlineAdapter.delete('expenses', exp.id);
        await offlineAdapter.delete('months', month.id);
      }
      
      const recurring = await offlineAdapter.getAllByIndex<any>('recurring_expenses', 'family_id', familyId);
      for (const rec of recurring) await offlineAdapter.delete('recurring_expenses', rec.id);
      
      const subs = await offlineAdapter.getAllByIndex<any>('subcategories', 'family_id', familyId);
      for (const sub of subs) await offlineAdapter.delete('subcategories', sub.id);
      
      
      await offlineAdapter.delete('families', familyId);

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

    const { error } = await familyService.deleteFamily(familyId);

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

    if (offlineAdapter.isOfflineId(familyId)) {
      return deleteFamily(familyId);
    }

    const { error } = await familyService.deleteMemberByFamilyAndUser(familyId, user.id);

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
    
    if (offlineAdapter.isOfflineId(currentFamilyId || '')) {
      return { error: new Error('Convites não disponíveis em famílias offline. Sincronize primeiro.') };
    }

    // Include family_name in the invitation for display purposes
    const { error } = await familyService.insertInvitation({
      family_id: currentFamilyId,
      email: email.toLowerCase(),
      invited_by: user.id,
      family_name: currentFamily?.name || 'Família'
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
    const { error: updateError } = await familyService.updateInvitationStatus(invitationId, 'accepted');

    if (updateError) return { error: updateError };

    // Add user to family
    const { error: memberError } = await familyService.insertFamilyMember({
      family_id: invitation.family_id,
      user_id: user.id,
      role: 'member',
      user_email: user.email || null,
    });

    if (memberError) return { error: memberError };

    // Refresh families first and wait for it to complete
    await refreshFamilies();
    await refreshInvitations();
    
    // Small delay to ensure state is updated before selecting
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now select the family
    await selectFamily(invitation.family_id);

    return { error: null };
  };

  // Reject invitation
  const rejectInvitation = async (invitationId: string) => {
    const { error } = await familyService.updateInvitationStatus(invitationId, 'rejected');

    if (!error) await refreshInvitations();
    return { error };
  };

  // Cancel invitation
  const cancelInvitation = async (invitationId: string) => {
    const { error } = await familyService.deleteInvitation(invitationId);

    if (!error) await refreshInvitations();
    return { error };
  };

  // Update member role
  const updateMemberRole = async (memberId: string, role: FamilyRole) => {
    const { error } = await familyService.updateMemberRole(memberId, role);

    if (!error) await refreshMembers();
    return { error };
  };

  // Remove member
  const removeMember = async (memberId: string) => {
    const { error } = await familyService.deleteMember(memberId);

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
