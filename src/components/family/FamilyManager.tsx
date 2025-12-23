import { useState } from 'react';
import { useFamily, FamilyRole } from '@/contexts/FamilyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Crown, 
  User,
  Trash2,
  X,
  Loader2,
  Settings,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/ui/use-toast';

export const FamilyManager = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { 
    currentFamily, 
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
    leaveFamily
  } = useFamily();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const isOnlyMember = members.length === 1;
  const adminCount = members.filter(m => m.role === 'owner' || m.role === 'admin').length;
  const isOnlyAdmin = isAdmin && adminCount === 1 && members.length > 1;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsInviting(true);
    const { error } = await inviteMember(inviteEmail.trim());
    setIsInviting(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('success'),
        description: t('invitationSent')
      });
      setInviteEmail('');
    }
  };

  const handleUpdateName = async () => {
    if (!currentFamily || !newFamilyName.trim()) return;
    
    const { error } = await updateFamilyName(currentFamily.id, newFamilyName.trim());
    
    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('success'),
        description: t('familyNameUpdated')
      });
      setEditingName(false);
    }
  };

  const handleDeleteFamily = async () => {
    if (!currentFamily) return;
    
    const { error } = await deleteFamily(currentFamily.id);
    
    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('success'),
        description: t('familyDeleted')
      });
      setOpen(false);
    }
    setShowDeleteAlert(false);
  };

  const handleLeaveFamily = async () => {
    if (!currentFamily) return;
    
    const { error } = await leaveFamily(currentFamily.id);
    
    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('success'),
        description: t('leftFamily')
      });
      setOpen(false);
    }
    setShowLeaveAlert(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    setProcessingAction(memberId);
    const { error } = await removeMember(memberId);
    setProcessingAction(null);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setProcessingAction(invitationId);
    const { error } = await cancelInvitation(invitationId);
    setProcessingAction(null);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRoleChange = async (memberId: string, role: FamilyRole) => {
    setProcessingAction(memberId);
    const { error } = await updateMemberRole(memberId, role);
    setProcessingAction(null);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingAction(invitationId);
    const { error } = await acceptInvitation(invitationId);
    setProcessingAction(null);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('success'),
        description: t('invitationAccepted')
      });
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingAction(invitationId);
    const { error } = await rejectInvitation(invitationId);
    setProcessingAction(null);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

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

  if (!currentFamily) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label={t('openFamilySettings')}>
            <Settings className="h-4 w-4" />
            {myPendingInvitations.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                {myPendingInvitations.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('familySettings')}
            </DialogTitle>
            <DialogDescription>
              {currentFamily.name}
            </DialogDescription>
          </DialogHeader>

            <Tabs defaultValue={myPendingInvitations.length > 0 ? 'invitations' : 'members'}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="members">{t('members')}</TabsTrigger>
              <TabsTrigger value="invitations" className="relative">
                {t('invitations')}
                {myPendingInvitations.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {myPendingInvitations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings">{t('settings')}</TabsTrigger>
            </TabsList>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4 mt-4">
              {isAdmin && (
                <section aria-label="invite" className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">{t('invite')}</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('inviteEmailPlaceholder')}
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    />
                    <Button onClick={handleInvite} disabled={!inviteEmail.trim() || isInviting} aria-label={t('sendInvitation')}>
                      {isInviting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </section>
              )}

              <section aria-label="members-list" className="space-y-2">
                <h3 className="text-sm font-semibold">{t('members')}</h3>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {getRoleIcon(member.role)}
                        <div>
                          <p className="font-medium text-sm">
                            {member.user_id === user?.id ? t('you') : member.user_email || t('member')}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{getRoleLabel(member.role)}</p>
                        </div>
                      </div>
                      {/* Admin pode gerenciar outros membros (exceto a si mesmo) */}
                      {isAdmin && member.user_id !== user?.id && (
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role === 'owner' ? 'admin' : member.role}
                            onValueChange={(value) => handleRoleChange(member.id, value as FamilyRole)}
                            disabled={processingAction === member.id}
                          >
                            <SelectTrigger className="w-28 h-8">
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
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={processingAction === member.id}
                            aria-label={t('removeMember')}
                          >
                            {processingAction === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Pending invitations from this family */}
              {isAdmin && pendingInvitations.length > 0 && (
                <section aria-label="pending-sent" className="space-y-2">
                  <h3 className="text-sm font-semibold">{t('pendingSent')}</h3>
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{invitation.email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        disabled={processingAction === invitation.id}
                        aria-label={t('cancelInvitation')}
                      >
                        {processingAction === invitation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </section>
              )}
            </TabsContent>

            {/* My Invitations Tab */}
            <TabsContent value="invitations" className="mt-4">
              {myPendingInvitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('noPendingInvitations')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <div>
                        <p className="font-medium">{invitation.family_name}</p>
                        <p className="text-xs text-muted-foreground">{t('invitedToFamily')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectInvitation(invitation.id)}
                          disabled={processingAction === invitation.id}
                          aria-label={t('rejectInvitation')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          disabled={processingAction === invitation.id}
                        >
                          {processingAction === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t('accept')
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <section aria-label="family-details" className="space-y-2">
                <h3 className="text-sm font-semibold">{t('familyDetails')}</h3>
                {isAdmin ? (
                  editingName ? (
                    <div className="flex gap-2">
                      <Input
                        value={newFamilyName}
                        onChange={(e) => setNewFamilyName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                      />
                      <Button onClick={handleUpdateName}>{t('save')}</Button>
                      <Button variant="outline" onClick={() => setEditingName(false)}>
                        {t('cancel')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <span>{currentFamily.name}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setNewFamilyName(currentFamily.name);
                          setEditingName(true);
                        }}
                      >
                        {t('edit')}
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <span>{currentFamily.name}</span>
                  </div>
                )}
              </section>

              <section aria-label="danger-zone" className="pt-4 border-t border-border space-y-3 flex flex-col items-center">
                <h3 className="text-sm font-semibold text-destructive w-full">{t('dangerZone')}</h3>
                {/* Se for único membro, não pode sair, apenas excluir */}
                {!isOnlyMember && (
                  <div className="flex flex-col items-center w-full">
                    <Button
                      variant="outline"
                      className="w-3/4 text-destructive hover:text-destructive hover:bg-destructive/10 ring-1 ring-destructive/20 rounded"
                      onClick={() => setShowLeaveAlert(true)}
                      disabled={isOnlyAdmin}
                      title={isOnlyAdmin ? t('promoteAdminFirst') : undefined}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('leaveFamily')}
                    </Button>
                    {isOnlyAdmin && (
                      <p className="text-xs text-muted-foreground text-center mt-1">{t('promoteAdminFirst')}</p>
                    )}
                  </div>
                )}
                {/* Admin pode excluir (ou único membro) */}
                {(isAdmin || isOnlyMember) && (
                  <Button
                    variant="destructive"
                    className="w-3/4 ring-1 ring-destructive/20 rounded"
                    onClick={() => setShowDeleteAlert(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('deleteFamily')}
                  </Button>
                )}
              </section>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteFamilyConfirm')}</AlertDialogTitle>
            <AlertDialogDescription className={!currentFamily?.isOffline ? "text-destructive font-medium" : ""}>
              {currentFamily?.isOffline ? t('deleteFamilyWarning') : t('deleteFamilyWarningOnline')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFamily} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Alert */}
      <AlertDialog open={showLeaveAlert} onOpenChange={setShowLeaveAlert}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('leaveFamilyConfirm')}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('leaveFamilyWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveFamily} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
