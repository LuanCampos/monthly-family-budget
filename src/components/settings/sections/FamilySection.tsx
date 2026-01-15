/**
 * Family Tab - Family selector, members, invitations management
 */

import React from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Crown, 
  X, 
  Loader2, 
  WifiOff, 
  ChevronDown, 
  Plus, 
  Check, 
  Cloud, 
  Pencil, 
  LogOut, 
  Trash2,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { offlineAdapter } from '@/lib/adapters/offlineAdapter';
import type { Family, FamilyMember, FamilyInvitation, FamilyRole } from '@/contexts/FamilyContext';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface SyncProgress {
  step: string;
  current: number;
  total: number;
  details: string;
}

interface FamilySectionProps {
  user: SupabaseUser | null;
  currentFamily: Family | null;
  families: Family[];
  members: FamilyMember[];
  pendingInvitations: FamilyInvitation[];
  myPendingInvitations: FamilyInvitation[];
  userRole: FamilyRole | null;
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  processingAction: string | null;
  isInviting: boolean;
  inviteEmail: string;
  editingName: boolean;
  newFamilyName: string;
  isUpdatingName: boolean;
  onSelectFamily: (familyId: string) => void;
  onInviteEmailChange: (email: string) => void;
  onEditingNameChange: (editing: boolean) => void;
  onNewFamilyNameChange: (name: string) => void;
  onInvite: () => void;
  onUpdateFamilyName: () => void;
  onSyncFamily: () => void;
  onShowCreateFamily: () => void;
  onAcceptInvitation: (id: string) => void;
  onRejectInvitation: (id: string) => void;
  onCancelInvitation: (id: string) => void;
  onRoleChange: (memberId: string, role: FamilyRole) => void;
  onRemoveMember: (memberId: string) => void;
  onShowLeaveAlert: () => void;
  onShowDeleteAlert: () => void;
  t: (key: string) => string;
}

export const FamilySection: React.FC<FamilySectionProps> = ({
  user,
  currentFamily,
  families,
  members,
  pendingInvitations,
  myPendingInvitations,
  userRole,
  isOnline,
  isSyncing,
  syncProgress,
  processingAction,
  isInviting,
  inviteEmail,
  editingName,
  newFamilyName,
  isUpdatingName,
  onSelectFamily,
  onInviteEmailChange,
  onEditingNameChange,
  onNewFamilyNameChange,
  onInvite,
  onUpdateFamilyName,
  onSyncFamily,
  onShowCreateFamily,
  onAcceptInvitation,
  onRejectInvitation,
  onCancelInvitation,
  onRoleChange,
  onRemoveMember,
  onShowLeaveAlert,
  onShowDeleteAlert,
  t,
}) => {
  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const isCurrentOffline = currentFamily?.isOffline || offlineAdapter.isOfflineId(currentFamily?.id || '');
  const isOnlyMember = members.length === 1;
  const adminCount = members.filter(m => m.role === 'owner' || m.role === 'admin').length;
  const isOnlyAdmin = isAdmin && adminCount === 1 && members.length > 1;

  const getRoleIcon = (role: FamilyRole) => {
    if (role === 'owner' || role === 'admin') {
      return <Crown className="h-4 w-4 text-yellow-500" />;
    }
    return <User className="h-4 w-4 text-muted-foreground" />;
  };

  const getRoleLabel = (role: FamilyRole) => {
    if (role === 'owner' || role === 'admin') {
      return t('role_admin');
    }
    return t('role_member');
  };

  return (
    <div className="mt-0 space-y-5">
      {/* Pending invitations for current user - Highlighted */}
      {myPendingInvitations.length > 0 && (
        <div className="dashboard-card">
          <div className="dashboard-card-content p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider mb-2">
              {t('pendingInvitations')}
            </p>
            {myPendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-2 rounded-md bg-background">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{invitation.family_name}</p>
                  <p className="text-xs text-muted-foreground">{t('invitedToFamily')}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-9 w-9 p-0" 
                    onClick={() => onRejectInvitation(invitation.id)} 
                    disabled={processingAction === invitation.id} 
                    aria-label={t('rejectInvitation')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-9 px-3 text-xs" 
                    onClick={() => onAcceptInvitation(invitation.id)} 
                    disabled={processingAction === invitation.id} 
                    aria-label={t('acceptInvitation')}
                  >
                    {processingAction === invitation.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      t('accept')
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Family Selector with inline edit */}
      <div className="dashboard-card">
        <div className="dashboard-card-content space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('selectFamily')}
          </p>
          
          {editingName ? (
            <div className="flex gap-2">
              <Input 
                className="h-10 flex-1" 
                value={newFamilyName} 
                onChange={(e) => onNewFamilyNameChange(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onUpdateFamilyName();
                  if (e.key === 'Escape') onEditingNameChange(false);
                }}
                autoFocus
              />
              <Button 
                size="sm" 
                className="h-10 px-3" 
                onClick={onUpdateFamilyName} 
                disabled={isUpdatingName}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-10 px-3" 
                onClick={() => onEditingNameChange(false)} 
                disabled={isUpdatingName}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-between h-10">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">
                        {currentFamily?.name || t('selectFamily')}
                      </span>
                      {isCurrentOffline && (
                        <Badge 
                          variant="secondary" 
                          className="h-5 px-1.5 text-[10px] bg-amber-500/20 text-amber-500 flex-shrink-0"
                        >
                          <WifiOff className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {families.map((family) => (
                    <DropdownMenuItem
                      key={family.id}
                      onClick={() => onSelectFamily(family.id)}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate">{family.name}</span>
                      <div className="flex items-center gap-1">
                        {(family.isOffline || offlineAdapter.isOfflineId(family.id)) && (
                          <WifiOff className="h-3 w-3 text-amber-500" />
                        )}
                        {currentFamily?.id === family.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {isCurrentOffline && isOnline && !isSyncing && (
                    <DropdownMenuItem onClick={onSyncFamily} disabled={isSyncing}>
                      <Cloud className="h-4 w-4 mr-2" />
                      {t('syncToCloud')}
                    </DropdownMenuItem>
                  )}
                  {isSyncing && syncProgress && (
                    <div className="px-2 py-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="truncate">{syncProgress.step}</span>
                      </div>
                      <Progress value={(syncProgress.current / syncProgress.total) * 100} className="h-1.5" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{syncProgress.details}</span>
                        <span>{syncProgress.current}/{syncProgress.total}</span>
                      </div>
                    </div>
                  )}
                  <DropdownMenuItem onClick={onShowCreateFamily}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createFamily')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {isAdmin && currentFamily && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 flex-shrink-0" 
                  onClick={() => { 
                    onNewFamilyNameChange(currentFamily.name); 
                    onEditingNameChange(true); 
                  }}
                  title={t('edit')}
                  aria-label={t('edit')}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {currentFamily ? (
        <>
          {/* Members list */}
          <div className="dashboard-card">
            <div className="dashboard-card-content">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t('members')}
              </p>
              <div className="space-y-1">
                {members.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/30 -mx-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getRoleIcon(member.role)}
                      <div className="min-w-0">
                        <p className="text-sm truncate">
                          {member.user_id === user?.id ? t('you') : member.user_email || t('member')}
                        </p>
                        <p className="text-[11px] text-muted-foreground capitalize">
                          {getRoleLabel(member.role)}
                        </p>
                      </div>
                    </div>
                    {isAdmin && member.user_id !== user?.id && (
                      <div className="flex items-center gap-1">
                        <Select 
                          value={member.role === 'owner' ? 'admin' : member.role} 
                          onValueChange={(value) => onRoleChange(member.id, value as FamilyRole)} 
                          disabled={processingAction === member.id}
                        >
                          <SelectTrigger className="w-20 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t('role_admin')}</SelectItem>
                            <SelectItem value="member">{t('role_member')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-muted-foreground hover:text-destructive" 
                          onClick={() => onRemoveMember(member.id)} 
                          disabled={processingAction === member.id} 
                          aria-label={t('removeMember')}
                        >
                          {processingAction === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Invite member */}
          {isAdmin && (
            <div className="dashboard-card">
              <div className="dashboard-card-content space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {t('inviteMember')}
                </p>
                <div className="flex gap-2">
                  <Input 
                    className="h-9" 
                    placeholder={t('inviteEmailPlaceholder')} 
                    type="email" 
                    value={inviteEmail} 
                    onChange={(e) => onInviteEmailChange(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && onInvite()} 
                  />
                  <Button 
                    size="sm" 
                    className="h-9 px-3" 
                    onClick={onInvite} 
                    disabled={!inviteEmail.trim() || isInviting}
                  >
                    {isInviting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Pending sent invitations - Subtle */}
          {isAdmin && pendingInvitations.length > 0 && (
            <div className="dashboard-card">
              <div className="dashboard-card-content space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {t('pendingSent')}
                </p>
                <div className="space-y-1">
                  {pendingInvitations.map((invitation) => (
                    <div 
                      key={invitation.id} 
                      className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/20 -mx-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground truncate">
                          {invitation.email}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => onCancelInvitation(invitation.id)} 
                        disabled={processingAction === invitation.id} 
                        aria-label={t('cancelInvitation')}
                      >
                        {processingAction === invitation.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone - Leave/Delete family */}
          <div className="dashboard-card">
            <div className="dashboard-card-content space-y-1.5 pt-3 border-t border-border/50 flex flex-col items-center">
              {!isOnlyMember && (
                <div className="flex flex-col items-center w-full">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-3/4 justify-center h-8 text-destructive ring-1 ring-destructive/20 rounded" 
                    onClick={onShowLeaveAlert}
                    disabled={isOnlyAdmin}
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    <span className="text-sm">{t('leaveFamily')}</span>
                  </Button>
                  {isOnlyAdmin && (
                    <p className="text-[11px] text-muted-foreground text-center mt-1">
                      {t('promoteAdminFirst')}
                    </p>
                  )}
                </div>
              )}
              {(isAdmin || isOnlyMember) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-3/4 justify-center h-8 text-destructive ring-1 ring-destructive/20 rounded" 
                  onClick={onShowDeleteAlert}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  <span className="text-sm">{t('deleteFamily')}</span>
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('noFamilySelected')}</p>
        </div>
      )}
    </div>
  );
};
