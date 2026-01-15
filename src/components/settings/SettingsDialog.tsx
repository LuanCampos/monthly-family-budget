/**
 * Settings Panel - Main settings dialog component
 * 
 * This component orchestrates the settings UI, delegating to modular sections:
 * - ProfileSection: Edit user profile
 * - PasswordSection: Change password
 * - AuthSection: Login/Signup for offline users
 * - GeneralSection: User account, preferences, data management
 * - FamilySection: Family selector, members, invitations
 */

import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TriggerButton } from '@/components/common';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, ThemeKey } from '@/contexts/ThemeContext';
import { useCurrency, CurrencyCode } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily, FamilyRole } from '@/contexts/FamilyContext';
import { Language } from '@/i18n';
import { toast } from '@/hooks/ui/use-toast';
import { useOnline } from '@/contexts/OnlineContext';
import { offlineAdapter } from '@/lib/adapters/offlineAdapter';
import * as userService from '@/lib/services/userService';
import { clearOfflineCache } from '@/lib/storage/offlineStorage';
import { logger } from '@/lib/logger';

import {
  ProfileSection,
  PasswordSection,
  AuthSection,
  GeneralSection,
  FamilySection,
  DeleteFamilyAlert,
  LeaveFamilyAlert,
  CreateFamilyDialog,
} from './sections';
import { ConfirmDialog } from '@/components/common';

interface SettingsDialogProps {
  currentMonthLabel?: string;
  onDeleteMonth?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SettingsDialog = ({ 
  currentMonthLabel, 
  onDeleteMonth, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}: SettingsDialogProps) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { user, signOut } = useAuth();
  const { 
    currentFamily, 
    families,
    selectFamily,
    createFamily,
    members, 
    pendingInvitations, 
    myPendingInvitations,
    userRole,
    inviteMember,
    cancelInvitation,
    acceptInvitation,
    rejectInvitation,
    updateMemberRole,
    removeMember,
    updateFamilyName,
    deleteFamily,
    leaveFamily,
    refreshFamilies
  } = useFamily();
  const { syncFamily, isSyncing, syncProgress, isOnline } = useOnline();
  
  // Navigation state
  const [activeSection, setActiveSection] = useState<'main' | 'profile' | 'password' | 'auth'>('main');
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  
  // Family management state
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showCreateFamilyDialog, setShowCreateFamilyDialog] = useState(false);
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [createFamilyName, setCreateFamilyName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isDeletingFamily, setIsDeletingFamily] = useState(false);
  const [isLeavingFamily, setIsLeavingFamily] = useState(false);

  const isCurrentOffline = currentFamily?.isOffline || offlineAdapter.isOfflineId(currentFamily?.id || '');

  // Helper functions
  const getUserInitials = () => {
    if (!user) return '?';
    const email = user.email || '';
    const name = user.user_metadata?.display_name || user.user_metadata?.full_name;
    if (name) {
      return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.display_name || user.user_metadata?.full_name || user.email;
  };

  // Dialog handlers
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setActiveSection('main');
      setInviteEmail('');
      setEditingName(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  // Preference persistence
  const persistUserPreference = async (partial: { theme?: ThemeKey; language?: Language; currency?: CurrencyCode }) => {
    if (!user) return;

    const payload = {
      user_id: user.id,
      application_key: 'finance',
      ...(partial.theme ? { theme: partial.theme } : {}),
      ...(partial.language ? { language: partial.language } : {}),
      ...(partial.currency ? { currency: partial.currency } : {}),
    };

    try {
      const res = await userService.upsertUserPreference(payload);
      if (res.error) {
        throw res.error;
      }
    } catch (_err) {
      // Fallback: save to offline store and enqueue sync
      try {
        await offlineAdapter.put('user_preferences', {
          ...payload,
          updated_at: new Date().toISOString(),
        });
        await offlineAdapter.sync.add({
          type: 'user_preference',
          action: 'upsert',
          data: payload,
          familyId: '',
        });
      } catch (offlineErr) {
        logger.error('settings.persistPreference.offlineFailed', { error: offlineErr });
      }
    }
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      setLanguage(newLanguage);
      await persistUserPreference({ language: newLanguage });
    } catch (_err) {
      logger.error('settings.languageChange.failed', { error: _err });
    }
  };

  const handleCurrencyChange = async (newCurrency: CurrencyCode) => {
    try {
      setCurrency(newCurrency);
      await persistUserPreference({ currency: newCurrency });
    } catch (_err) {
      logger.error('settings.currencyChange.failed', { error: _err });
    }
  };

  const handleThemeChange = async (newTheme: ThemeKey) => {
    try {
      setTheme(newTheme);
      await persistUserPreference({ theme: newTheme });
    } catch (_err) {
      logger.error('settings.themeChange.failed', { error: _err });
    }
  };

  // Family handlers
  const handleCreateFamily = async () => {
    if (!createFamilyName.trim()) return;
    setIsCreatingFamily(true);
    const { error } = await createFamily(createFamilyName.trim());
    setIsCreatingFamily(false);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('familyCreated') });
      setShowCreateFamilyDialog(false);
      setCreateFamilyName('');
    }
  };

  const handleSyncFamily = async () => {
    if (!currentFamily) return;
    const { newFamilyId, error } = await syncFamily(currentFamily.id);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else if (newFamilyId) {
      await refreshFamilies();
      await selectFamily(newFamilyId);
    }
  };

  const handleClearOfflineCache = async () => {
    setProcessingAction('clear-offline-cache');
    try {
      await clearOfflineCache();
      localStorage.removeItem('current-family-id');
      toast({ title: t('success'), description: t('offlineCacheCleared') });
      setTimeout(() => window.location.reload(), 350);
    } catch (error) {
      toast({
        title: t('error'),
        description: (error as Error)?.message || t('offlineCacheClearError'),
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    const { error } = await inviteMember(inviteEmail.trim());
    setIsInviting(false);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('invitationSent') });
      setInviteEmail('');
    }
  };

  const handleUpdateFamilyName = async () => {
    if (!currentFamily || !newFamilyName.trim() || isUpdatingName) return;
    setIsUpdatingName(true);
    try {
      const { error } = await updateFamilyName(currentFamily.id, newFamilyName.trim());
      if (error) {
        toast({ title: t('error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('success'), description: t('familyNameUpdated') });
        setEditingName(false);
      }
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleDeleteFamily = async () => {
    if (!currentFamily || isDeletingFamily) return;
    setIsDeletingFamily(true);
    try {
      const { error } = await deleteFamily(currentFamily.id);
      if (error) {
        toast({ title: t('error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('success'), description: t('familyDeleted') });
        setOpen(false);
      }
    } finally {
      setShowDeleteAlert(false);
      setIsDeletingFamily(false);
    }
  };

  const handleLeaveFamily = async () => {
    if (!currentFamily || isLeavingFamily) return;
    setIsLeavingFamily(true);
    try {
      const { error } = await leaveFamily(currentFamily.id);
      if (error) {
        toast({ title: t('error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('success'), description: t('leftFamily') });
        setOpen(false);
      }
    } finally {
      setShowLeaveAlert(false);
      setIsLeavingFamily(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setProcessingAction(memberId);
    const { error } = await removeMember(memberId);
    setProcessingAction(null);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setProcessingAction(invitationId);
    const { error } = await cancelInvitation(invitationId);
    setProcessingAction(null);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleRoleChange = async (memberId: string, role: FamilyRole) => {
    setProcessingAction(memberId);
    const { error } = await updateMemberRole(memberId, role);
    setProcessingAction(null);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingAction(invitationId);
    const { error } = await acceptInvitation(invitationId);
    setProcessingAction(null);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('invitationAccepted') });
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingAction(invitationId);
    const { error } = await rejectInvitation(invitationId);
    setProcessingAction(null);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  };

  // Render Profile Section
  if (activeSection === 'profile') {
    return (
      <ProfileSection
        open={open}
        onOpenChange={handleOpenChange}
        onBack={() => setActiveSection('main')}
        t={t}
        controlledOpen={controlledOpen}
        user={user}
        myPendingInvitations={myPendingInvitations}
        getUserInitials={getUserInitials}
        getDisplayName={getDisplayName}
      />
    );
  }

  // Render Password Section
  if (activeSection === 'password') {
    return (
      <PasswordSection
        open={open}
        onOpenChange={handleOpenChange}
        onBack={() => setActiveSection('main')}
        t={t}
        controlledOpen={controlledOpen}
        user={user}
        myPendingInvitations={myPendingInvitations}
        getUserInitials={getUserInitials}
        getDisplayName={getDisplayName}
      />
    );
  }

  // Render Auth Section
  if (activeSection === 'auth') {
    return (
      <AuthSection
        open={open}
        onOpenChange={handleOpenChange}
        onBack={() => setActiveSection('main')}
        t={t}
        controlledOpen={controlledOpen}
        user={user}
        myPendingInvitations={myPendingInvitations}
        getUserInitials={getUserInitials}
        getDisplayName={getDisplayName}
      />
    );
  }

  // Main settings with tabs
  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {controlledOpen === undefined && (
          <DialogTrigger asChild>
            <TriggerButton 
              user={user} 
              myPendingInvitations={myPendingInvitations} 
              getUserInitials={getUserInitials} 
              getDisplayName={getDisplayName} 
            />
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
          <DialogHeader className="dashboard-card-header px-5 pt-5 pb-3 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">{t('settings')}</DialogTitle>
          </DialogHeader>
          
          <Tabs 
            defaultValue={myPendingInvitations.length > 0 ? 'family' : 'general'} 
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <TabsList 
              className="grid w-full grid-cols-2 mx-5 flex-shrink-0 h-9" 
              style={{ width: 'calc(100% - 2.5rem)' }}
            >
              <TabsTrigger value="general" className="text-sm">{t('preferences')}</TabsTrigger>
              <TabsTrigger value="family" className="relative text-sm">
                {t('family')}
                {myPendingInvitations.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-destructive text-destructive-foreground rounded-full">
                    {myPendingInvitations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto dashboard-card-content min-h-0">
              <TabsContent value="general">
                <GeneralSection
                  user={user}
                  language={language}
                  theme={theme}
                  currency={currency}
                  currentMonthLabel={currentMonthLabel}
                  processingAction={processingAction}
                  onLanguageChange={handleLanguageChange}
                  onThemeChange={handleThemeChange}
                  onCurrencyChange={handleCurrencyChange}
                  onEditProfile={() => setActiveSection('profile')}
                  onEditPassword={() => setActiveSection('password')}
                  onSignOut={handleSignOut}
                  onAuthClick={() => setActiveSection('auth')}
                  onDeleteMonth={onDeleteMonth}
                  onClearOfflineCache={handleClearOfflineCache}
                  getUserInitials={getUserInitials}
                  getDisplayName={getDisplayName}
                  t={t}
                />
              </TabsContent>

              <TabsContent value="family">
                <FamilySection
                  user={user}
                  currentFamily={currentFamily}
                  families={families}
                  members={members}
                  pendingInvitations={pendingInvitations}
                  myPendingInvitations={myPendingInvitations}
                  userRole={userRole}
                  isOnline={isOnline}
                  isSyncing={isSyncing}
                  syncProgress={syncProgress}
                  processingAction={processingAction}
                  isInviting={isInviting}
                  inviteEmail={inviteEmail}
                  editingName={editingName}
                  newFamilyName={newFamilyName}
                  isUpdatingName={isUpdatingName}
                  onSelectFamily={selectFamily}
                  onInviteEmailChange={setInviteEmail}
                  onEditingNameChange={setEditingName}
                  onNewFamilyNameChange={setNewFamilyName}
                  onInvite={handleInvite}
                  onUpdateFamilyName={handleUpdateFamilyName}
                  onSyncFamily={handleSyncFamily}
                  onShowCreateFamily={() => setShowCreateFamilyDialog(true)}
                  onAcceptInvitation={handleAcceptInvitation}
                  onRejectInvitation={handleRejectInvitation}
                  onCancelInvitation={handleCancelInvitation}
                  onRoleChange={handleRoleChange}
                  onRemoveMember={(memberId) => setMemberToRemove(memberId)}
                  onShowLeaveAlert={() => setShowLeaveAlert(true)}
                  onShowDeleteAlert={() => setShowDeleteAlert(true)}
                  t={t}
                />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      <DeleteFamilyAlert
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        isCurrentOffline={isCurrentOffline}
        isDeleting={isDeletingFamily}
        onDelete={handleDeleteFamily}
        t={t}
      />

      <LeaveFamilyAlert
        open={showLeaveAlert}
        onOpenChange={setShowLeaveAlert}
        isLeaving={isLeavingFamily}
        onLeave={handleLeaveFamily}
        t={t}
      />

      <CreateFamilyDialog
        open={showCreateFamilyDialog}
        onOpenChange={setShowCreateFamilyDialog}
        familyName={createFamilyName}
        onFamilyNameChange={setCreateFamilyName}
        isCreating={isCreatingFamily}
        onCreate={handleCreateFamily}
        t={t}
      />

      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        onConfirm={() => memberToRemove && handleRemoveMember(memberToRemove)}
        title={t('removeMemberConfirm') || 'Remover membro?'}
        description={t('removeMemberWarning') || 'O membro perderá acesso aos dados da família.'}
        variant="destructive"
        loading={!!processingAction}
      />
    </>
  );
};
