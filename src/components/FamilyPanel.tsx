import React, { useState } from 'react';
import { Users, WifiOff, Check, Cloud, Plus, Mail, UserPlus, X, Loader2, Trash2, LogOut, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { useOnline } from '@/contexts/OnlineContext';
import { useAuth } from '@/contexts/AuthContext';
import { offlineAdapter } from '@/lib/offlineAdapter';
import { Family, FamilyMember, FamilyInvitation, FamilyRole } from '@/contexts/FamilyContext';

interface FamilyPanelProps {
  t: (key: string) => string;
  families: Family[];
  currentFamily: Family | null;
  selectFamily: (id: string) => void;
  createFamily: (name: string) => Promise<{ error: Error | null; family?: Family }>;
  members: FamilyMember[];
  myPendingInvitations: FamilyInvitation[];
  pendingInvitations: FamilyInvitation[];
  inviteMember: (email: string) => Promise<{ error: Error | null }>;
  removeMember: (id: string) => Promise<{ error: Error | null }>;
  cancelInvitation: (id: string) => Promise<{ error: Error | null }>;
  acceptInvitation: (id: string) => Promise<{ error: Error | null }>;
  rejectInvitation: (id: string) => Promise<{ error: Error | null }>;
  updateMemberRole: (id: string, role: FamilyRole) => Promise<{ error: Error | null }>;
  updateFamilyName: (id: string, name: string) => Promise<{ error: Error | null }>;
  deleteFamily: (id: string) => Promise<{ error: Error | null }>;
  leaveFamily: (id: string) => Promise<{ error: Error | null }>;
  isAdmin: boolean;
  isOnlyMember: boolean;
  isOnlyAdmin: boolean;
}

export const FamilyPanel = ({
  t,
  families,
  currentFamily,
  selectFamily,
  createFamily,
  members,
  myPendingInvitations,
  pendingInvitations,
  inviteMember,
  removeMember,
  cancelInvitation,
  acceptInvitation,
  rejectInvitation,
  updateMemberRole,
  updateFamilyName,
  deleteFamily,
  leaveFamily,
  isAdmin,
  isOnlyMember,
  isOnlyAdmin,
}: FamilyPanelProps) => {
  const { isOnline, isSyncing, syncFamily } = useOnline();
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showCreateFamilyDialog, setShowCreateFamilyDialog] = useState(false);
  const [createFamilyName, setCreateFamilyName] = useState('');

  const isCurrentOffline = currentFamily?.isOffline || offlineAdapter.isOfflineId(currentFamily?.id || '');

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    const { error } = await inviteMember(inviteEmail.trim());
    setIsInviting(false);
    if (error) return;
    setInviteEmail('');
  };

  const handleCreateFamily = async () => {
    if (!createFamilyName.trim()) return;
    setProcessingAction('create-family');
    await createFamily(createFamilyName.trim());
    setProcessingAction(null);
    setShowCreateFamilyDialog(false);
    setCreateFamilyName('');
  };

  const getRoleIcon = (role: string) => {
    if (role === 'owner' || role === 'admin') return <Crown className="h-4 w-4 text-yellow-500" />;
    return <User className="h-4 w-4 text-muted-foreground" />;
  };

  const getRoleLabel = (role: string) => (role === 'owner' || role === 'admin' ? t('role_admin') : t('role_member'));

  return (
    <>
      <div className="dashboard-card">
        <div className="dashboard-card-content space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('selectFamily')}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-10">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{currentFamily?.name || t('selectFamily')}</span>
                  {isCurrentOffline && <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-amber-500/20 text-amber-500 flex-shrink-0"><WifiOff className="h-3 w-3" /></Badge>}
                </div>
                <Check className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {families.map((family) => (
                <DropdownMenuItem key={family.id} onClick={() => selectFamily(family.id)} className="flex items-center justify-between">
                  <span className="truncate">{family.name}</span>
                  <div className="flex items-center gap-1">
                    {(family.isOffline || offlineAdapter.isOfflineId(family.id)) && <WifiOff className="h-3 w-3 text-amber-500" />}
                    {currentFamily?.id === family.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {isCurrentOffline && isOnline && (
                <DropdownMenuItem onClick={() => syncFamily(currentFamily.id)} disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Cloud className="h-4 w-4 mr-2" />}
                  {t('syncToCloud')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowCreateFamilyDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('createFamily')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {myPendingInvitations.length > 0 && (
        <div className="dashboard-card">
          <div className="dashboard-card-content p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider mb-2">{t('pendingInvitations')}</p>
            {myPendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-2 rounded-md bg-background">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{invitation.family_name}</p>
                  <p className="text-xs text-muted-foreground">{t('invitedToFamily')}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => rejectInvitation(invitation.id)} disabled={processingAction === invitation.id}><X className="h-4 w-4" /></Button>
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={() => acceptInvitation(invitation.id)} disabled={processingAction === invitation.id}>{processingAction === invitation.id ? <Loader2 className="h-3 w-3 animate-spin" /> : t('accept')}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentFamily ? (
        <>
          {isAdmin && (
            <div className="dashboard-card">
              <div className="dashboard-card-content space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('familyName')}</p>
                {editingName ? (
                  <div className="flex gap-2">
                    <Input className="h-9" value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && updateFamilyName(currentFamily.id, newFamilyName)} />
                    <Button size="sm" className="h-9" onClick={() => updateFamilyName(currentFamily.id, newFamilyName)}>{t('save')}</Button>
                    <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditingName(false)}>{t('cancel')}</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-sm" onClick={() => { setNewFamilyName(currentFamily.name); setEditingName(true); }}>{t('edit')}</Button>
                )}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="dashboard-card">
              <div className="dashboard-card-content space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('inviteMember')}</p>
                <div className="flex gap-2">
                  <Input className="h-9" placeholder={t('inviteEmailPlaceholder')} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInvite()} />
                  <Button size="sm" className="h-9 px-3" onClick={handleInvite} disabled={!inviteEmail.trim() || isInviting}>{isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}</Button>
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-card">
            <div className="dashboard-card-content">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('members')}</p>
              <div className="space-y-1">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/30 -mx-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getRoleIcon(member.role)}
                      <div className="min-w-0">
                        <p className="text-sm truncate">{member.user_id === user?.id ? t('you') : member.user_email || t('member')}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{getRoleLabel(member.role)}</p>
                      </div>
                    </div>
                    {isAdmin && member.user_id !== currentUserId && (
                      <div className="flex items-center gap-1">
                        <Select value={member.role === 'owner' ? 'admin' : member.role} onValueChange={(value) => updateMemberRole(member.id, value as FamilyRole)} disabled={processingAction === member.id}>
                          <SelectTrigger className="w-20 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t('role_admin')}</SelectItem>
                            <SelectItem value="member">{t('role_member')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeMember(member.id)} disabled={processingAction === member.id}>{processingAction === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isAdmin && pendingInvitations.length > 0 && (
            <div className="dashboard-card">
              <div className="dashboard-card-content space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('pendingSent')}</p>
                <div className="space-y-1">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/20 -mx-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground truncate">{invitation.email}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => cancelInvitation(invitation.id)} disabled={processingAction === invitation.id}>{processingAction === invitation.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}</Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-card">
            <div className="dashboard-card-content space-y-1.5 pt-3 border-t border-border/50">
              {!isOnlyMember && (
                <>
                  <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-muted-foreground hover:text-destructive" onClick={() => leaveFamily(currentFamily.id)} disabled={isOnlyAdmin}><LogOut className="h-3.5 w-3.5 mr-2" /><span className="text-sm">{t('leaveFamily')}</span></Button>
                  {isOnlyAdmin && <p className="text-[11px] text-muted-foreground pl-6">{t('promoteAdminFirst')}</p>}
                </>
              )}
              {(isAdmin || isOnlyMember) && <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-muted-foreground hover:text-destructive" onClick={() => deleteFamily(currentFamily.id)}><Trash2 className="h-3.5 w-3.5 mr-2" /><span className="text-sm">{t('deleteFamily')}</span></Button>}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('noFamilySelected')}</p>
        </div>
      )}

      <AlertDialog open={showCreateFamilyDialog} onOpenChange={setShowCreateFamilyDialog}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('createFamily')}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Input className="h-10" placeholder={t('familyNamePlaceholder')} value={createFamilyName} onChange={(e) => setCreateFamilyName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()} />
            <Button onClick={handleCreateFamily} disabled={processingAction === 'create-family' || !createFamilyName.trim()} className="w-full h-9">{processingAction === 'create-family' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}{t('createFamily')}</Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FamilyPanel;
