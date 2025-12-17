import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type FamilyRole = 'owner' | 'admin' | 'member';

export interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
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
  
  // Actions
  createFamily: (name: string) => Promise<{ error: Error | null; family?: Family }>;
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
  const { user } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<FamilyInvitation[]>([]);
  const [myPendingInvitations, setMyPendingInvitations] = useState<FamilyInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const currentFamily = families.find(f => f.id === currentFamilyId) || null;
  const userRole = members.find(m => m.user_id === user?.id && m.family_id === currentFamilyId)?.role || null;

  // Load user's families
  const refreshFamilies = async () => {
    if (!user) {
      setFamilies([]);
      setCurrentFamilyId(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          family_id,
          families (
            id,
            name,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (!error && data) {
        const userFamilies = data
          .map((d: any) => d.families)
          .filter(Boolean) as Family[];
        setFamilies(userFamilies);
      }
    } catch (e) {
      console.log('Family tables not yet created');
      setFamilies([]);
    }
  };

  // Load current family's members
  const refreshMembers = async () => {
    if (!currentFamilyId) {
      setMembers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', currentFamilyId);

      if (!error && data) {
        setMembers(data);
      }
    } catch (e) {
      console.log('Family tables not yet created');
      setMembers([]);
    }
  };

  // Load invitations
  const refreshInvitations = async () => {
    if (!user) {
      setPendingInvitations([]);
      setMyPendingInvitations([]);
      return;
    }

    try {
      // Family invitations (for admins)
      if (currentFamilyId) {
        const { data: familyInvites } = await supabase
          .from('family_invitations')
          .select('*')
          .eq('family_id', currentFamilyId)
          .eq('status', 'pending');

        if (familyInvites) {
          setPendingInvitations(familyInvites);
        }
      }

      // My pending invitations
      const { data: myInvites } = await supabase
        .from('family_invitations')
        .select(`
          *,
          families (name)
        `)
        .eq('email', user.email)
        .eq('status', 'pending');

      if (myInvites) {
        setMyPendingInvitations(
          myInvites.map((inv: any) => ({
            ...inv,
            family_name: inv.families?.name
          }))
        );
      }
    } catch (e) {
      console.log('Family tables not yet created');
      setPendingInvitations([]);
      setMyPendingInvitations([]);
    }
  };

  // Load user preferences to get current family
  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('current_family_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.current_family_id) {
        setCurrentFamilyId(data.current_family_id);
      }
    } catch (e) {
      console.log('User preferences table not yet created');
    }
  };

  // Save current family to preferences
  const saveCurrentFamily = async (familyId: string | null) => {
    if (!user) return;

    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          current_family_id: familyId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    } catch (e) {
      console.log('User preferences table not yet created');
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (user) {
        await refreshFamilies();
        await loadUserPreferences();
        await refreshInvitations();
      } else {
        setFamilies([]);
        setCurrentFamilyId(null);
        setMembers([]);
        setPendingInvitations([]);
        setMyPendingInvitations([]);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  // Load members when family changes
  useEffect(() => {
    if (currentFamilyId) {
      refreshMembers();
      refreshInvitations();
    }
  }, [currentFamilyId]);

  // Create family
  const createFamily = async (name: string) => {
    // Get fresh session to ensure auth.uid() matches
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('families')
      .insert({ name, created_by: session.user.id })
      .select()
      .single();

    if (error) return { error };

    await refreshFamilies();
    await selectFamily(data.id);
    
    return { error: null, family: data };
  };

  // Select family
  const selectFamily = async (familyId: string) => {
    setCurrentFamilyId(familyId);
    await saveCurrentFamily(familyId);
  };

  // Update family name
  const updateFamilyName = async (familyId: string, name: string) => {
    const { error } = await supabase
      .from('families')
      .update({ name })
      .eq('id', familyId);

    if (!error) await refreshFamilies();
    return { error };
  };

  // Delete family
  const deleteFamily = async (familyId: string) => {
    const { error } = await supabase
      .from('families')
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

    const { error } = await supabase
      .from('family_members')
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

    const { error } = await supabase
      .from('family_invitations')
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
      .from('family_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);

    if (updateError) return { error: updateError };

    // Add user to family
    const { error: memberError } = await supabase
      .from('family_members')
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
      .from('family_invitations')
      .update({ status: 'rejected' })
      .eq('id', invitationId);

    if (!error) await refreshInvitations();
    return { error };
  };

  // Cancel invitation
  const cancelInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('family_invitations')
      .delete()
      .eq('id', invitationId);

    if (!error) await refreshInvitations();
    return { error };
  };

  // Update member role
  const updateMemberRole = async (memberId: string, role: FamilyRole) => {
    const { error } = await supabase
      .from('family_members')
      .update({ role })
      .eq('id', memberId);

    if (!error) await refreshMembers();
    return { error };
  };

  // Remove member
  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('family_members')
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
        createFamily,
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
