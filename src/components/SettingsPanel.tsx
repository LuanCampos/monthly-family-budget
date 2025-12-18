import { useState, useEffect } from 'react';
import { Settings, Globe, Palette, Trash2, Coins, User, KeyRound, LogIn, LogOut, Users, UserPlus, Mail, Crown, X, Loader2, WifiOff, ChevronDown, Plus, Check, Cloud, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, themes, ThemeKey } from '@/contexts/ThemeContext';
import { useCurrency, currencies, CurrencyCode } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily, FamilyRole } from '@/contexts/FamilyContext';
import { languages, Language } from '@/i18n';
import { TranslationKey } from '@/i18n/translations/pt';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useOnline } from '@/contexts/OnlineContext';
import { clearOfflineCache, isOfflineId } from '@/lib/offlineStorage';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SettingsPanelProps {
  currentMonthLabel?: string;
  onDeleteMonth?: () => void;
}

export const SettingsPanel = ({ currentMonthLabel, onDeleteMonth }: SettingsPanelProps) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { user, signOut, signIn, signUp } = useAuth();
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
    leaveFamily
  } = useFamily();
  const { syncFamily, isSyncing, isOnline } = useOnline();
  
  const [activeSection, setActiveSection] = useState<'main' | 'profile' | 'password' | 'auth'>('main');
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  
  // Auth form state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  
  // Family management state
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showCreateFamilyDialog, setShowCreateFamilyDialog] = useState(false);
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [createFamilyName, setCreateFamilyName] = useState('');

  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const isCurrentOffline = currentFamily?.isOffline || isOfflineId(currentFamily?.id || '');
  const isOnlyMember = members.length === 1;
  const adminCount = members.filter(m => m.role === 'owner' || m.role === 'admin').length;
  const isOnlyAdmin = isAdmin && adminCount === 1 && members.length > 1;

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || '');
    }
  }, [user]);

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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setActiveSection('main');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setInviteEmail('');
      setEditingName(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast({ title: t('error'), description: t('displayNameRequired'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
    setIsLoading(false);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('profileUpdated') });
      setActiveSection('main');
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: t('error'), description: t('fillAllFields'), variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: t('error'), description: t('passwordTooShort'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('error'), description: t('passwordsDoNotMatch'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });
    if (signInError) {
      setIsLoading(false);
      toast({ title: t('error'), description: t('currentPasswordIncorrect'), variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('passwordUpdated') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveSection('main');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  // Auth handlers for offline mode
  const handleAuthSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      toast({ title: t('error'), description: t('fillAllFields'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(authEmail, authPassword);
    setIsLoading(false);
    if (error) {
      toast({
        title: t('error'),
        description: error.message === 'Invalid login credentials' ? t('invalidCredentials') : error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: t('success'), description: t('loginSuccess') });
      setActiveSection('main');
      setAuthEmail('');
      setAuthPassword('');
    }
  };

  const handleAuthSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !authConfirmPassword || !authDisplayName.trim()) {
      toast({ title: t('error'), description: t('fillAllFields'), variant: 'destructive' });
      return;
    }
    if (authPassword.length < 6) {
      toast({ title: t('error'), description: t('passwordTooShort'), variant: 'destructive' });
      return;
    }
    if (authPassword !== authConfirmPassword) {
      toast({ title: t('error'), description: t('passwordsDoNotMatch'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(authEmail, authPassword, authDisplayName.trim());
    setIsLoading(false);
    if (error) {
      if (error.message.includes('already registered')) {
        toast({ title: t('error'), description: t('emailAlreadyRegistered'), variant: 'destructive' });
      } else {
        toast({ title: t('error'), description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: t('success'), description: t('signupSuccess') });
      setActiveSection('main');
      setAuthEmail('');
      setAuthPassword('');
      setAuthConfirmPassword('');
      setAuthDisplayName('');
    }
  };

  // Family selector handlers
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
    const { error } = await syncFamily(currentFamily.id);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
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

  // Family management handlers
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
    if (!currentFamily || !newFamilyName.trim()) return;
    const { error } = await updateFamilyName(currentFamily.id, newFamilyName.trim());
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('familyNameUpdated') });
      setEditingName(false);
    }
  };

  const handleDeleteFamily = async () => {
    if (!currentFamily) return;
    const { error } = await deleteFamily(currentFamily.id);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('familyDeleted') });
      setOpen(false);
    }
    setShowDeleteAlert(false);
  };

  const handleLeaveFamily = async () => {
    if (!currentFamily) return;
    const { error } = await leaveFamily(currentFamily.id);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('leftFamily') });
      setOpen(false);
    }
    setShowLeaveAlert(false);
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

  // Profile section
  if (activeSection === 'profile') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0">
            {user ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={getDisplayName()} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{getUserInitials()}</AvatarFallback>
              </Avatar>
            ) : (
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="bg-card border-border sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('editProfile')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">{t('emailCannotBeChanged')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">{t('displayName')}</Label>
              <Input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('displayNamePlaceholder')} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setActiveSection('main')} className="flex-1">{t('cancel')}</Button>
              <Button onClick={handleUpdateProfile} disabled={isLoading} className="flex-1">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('loading')}</> : t('saveChanges')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Password section
  if (activeSection === 'password') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0">
            {user ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={getDisplayName()} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{getUserInitials()}</AvatarFallback>
              </Avatar>
            ) : (
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="bg-card border-border sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {t('changePassword')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t('currentPasswordPlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('newPasswordPlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('confirmPasswordPlaceholder')} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setActiveSection('main')} className="flex-1">{t('cancel')}</Button>
              <Button onClick={handleUpdatePassword} disabled={isLoading} className="flex-1">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('loading')}</> : t('updatePassword')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Auth section (for offline mode users)
  if (activeSection === 'auth') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="bg-card border-border sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              {t('loginOrSignup')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'login' | 'signup')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">{t('login')}</TabsTrigger>
                <TabsTrigger value="signup">{t('signup')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleAuthSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="auth-email">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="auth-email"
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth-password">{t('password')}</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="auth-password"
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('loading')}</> : t('login')}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleAuthSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="auth-name">{t('displayName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="auth-name"
                        type="text"
                        placeholder={t('displayNamePlaceholder')}
                        value={authDisplayName}
                        onChange={(e) => setAuthDisplayName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth-signup-email">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="auth-signup-email"
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth-signup-password">{t('password')}</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="auth-signup-password"
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth-confirm-password">{t('confirmPassword')}</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="auth-confirm-password"
                        type="password"
                        placeholder={t('confirmPasswordPlaceholder')}
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('loading')}</> : t('signup')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <Button variant="ghost" onClick={() => setActiveSection('main')} className="w-full">
              {t('back')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main settings with tabs
  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 relative">
            {user ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={getDisplayName()} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{getUserInitials()}</AvatarFallback>
              </Avatar>
            ) : (
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
            {myPendingInvitations.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                {myPendingInvitations.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="bg-card border-border sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('settings')}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue={myPendingInvitations.length > 0 ? 'family' : 'general'} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 mx-6 mt-4 flex-shrink-0" style={{ width: 'calc(100% - 3rem)' }}>
              <TabsTrigger value="general">{t('preferences')}</TabsTrigger>
              <TabsTrigger value="family" className="relative">
                {t('family')}
                {myPendingInvitations.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                    {myPendingInvitations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              {/* General Tab */}
              <TabsContent value="general" className="mt-0 space-y-5">
                {/* User Account Section */}
                {user ? (
                  <>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('account')}</Label>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.user_metadata?.avatar_url} alt={getDisplayName()} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">{getUserInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getDisplayName()}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => setActiveSection('profile')} className="h-9">
                          <User className="h-4 w-4 mr-2" />{t('editProfile')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setActiveSection('password')} className="h-9">
                          <KeyRound className="h-4 w-4 mr-2" />{t('changePassword')}
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" className="w-full h-9 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />{t('logout')}
                      </Button>
                    </div>
                    <Separator className="bg-border" />
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('account')}</Label>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-muted-foreground text-sm">
                        <WifiOff className="h-4 w-4" />
                        {t('offlineMode')}
                      </div>
                      <Button variant="outline" className="w-full h-10" onClick={() => setActiveSection('auth')}>
                        <LogIn className="h-4 w-4 mr-2" />{t('loginOrSignup')}
                      </Button>
                    </div>
                    <Separator className="bg-border" />
                  </>
                )}

                {/* Preferences Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('preferences')}</Label>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Globe className="h-4 w-4 text-muted-foreground" />{t('language')}
                    </Label>
                    <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                      <SelectTrigger className="h-10 bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {languages.map((lang) => <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Coins className="h-4 w-4 text-muted-foreground" />{t('currency')}
                    </Label>
                    <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                      <SelectTrigger className="h-10 bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {currencies.map((curr) => <SelectItem key={curr.code} value={curr.code}>{curr.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Palette className="h-4 w-4 text-muted-foreground" />{t('theme')}
                    </Label>
                    <Select value={theme} onValueChange={(v) => setTheme(v as ThemeKey)}>
                      <SelectTrigger className="h-10 bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {themes.map((themeOption) => <SelectItem key={themeOption.key} value={themeOption.key}>{t(themeOption.labelKey as TranslationKey)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Data Management */}
                <>
                  <Separator className="bg-border" />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('dataManagement')}</Label>

                    {/* Delete Month */}
                    {onDeleteMonth && currentMonthLabel && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full h-10 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />{t('delete')} "{currentMonthLabel}"
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteMonth')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('deleteMonthConfirm')} <strong>{currentMonthLabel}</strong>? {t('deleteMonthWarning')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="h-10">{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction className="h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDeleteMonth}>{t('delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Clear Offline Cache */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-10 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={processingAction === 'clear-offline-cache'}
                        >
                          {processingAction === 'clear-offline-cache' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <HardDrive className="h-4 w-4 mr-2" />
                          )}
                          {t('clearOfflineCache')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('clearOfflineCache')}</AlertDialogTitle>
                          <AlertDialogDescription>{t('clearOfflineCacheWarning')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="h-10">{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            className="h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleClearOfflineCache}
                          >
                            {t('delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>

              </TabsContent>

              {/* Family Tab */}
              <TabsContent value="family" className="mt-0 space-y-4">
                {/* Family Selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('selectFamily')}</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {currentFamily?.name || t('selectFamily')}
                          </span>
                          {isCurrentOffline && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-amber-500/20 text-amber-500 flex-shrink-0">
                              <WifiOff className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {families.map((family) => (
                        <DropdownMenuItem
                          key={family.id}
                          onClick={() => selectFamily(family.id)}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">{family.name}</span>
                          <div className="flex items-center gap-1">
                            {(family.isOffline || isOfflineId(family.id)) && (
                              <WifiOff className="h-3 w-3 text-amber-500" />
                            )}
                            {currentFamily?.id === family.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      {isCurrentOffline && isOnline && (
                        <DropdownMenuItem onClick={handleSyncFamily} disabled={isSyncing}>
                          {isSyncing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Cloud className="h-4 w-4 mr-2" />
                          )}
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

                {currentFamily ? (
                  <>
                    {/* Family name editing */}
                    {isAdmin && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t('familyName')}</Label>
                        {editingName ? (
                          <div className="flex gap-2">
                            <Input value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateFamilyName()} />
                            <Button size="sm" onClick={handleUpdateFamilyName}>{t('save')}</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>{t('cancel')}</Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => { setNewFamilyName(currentFamily.name); setEditingName(true); }}>{t('edit')}</Button>
                        )
                        }
                      </div>
                    )}

                    {/* Pending invitations for current user */}
                    {myPendingInvitations.length > 0 && (
                      <div className="space-y-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <Label className="text-sm font-medium">{t('pendingInvitations')}</Label>
                        {myPendingInvitations.map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between p-2 rounded bg-background">
                            <div>
                              <p className="font-medium text-sm">{invitation.family_name}</p>
                              <p className="text-xs text-muted-foreground">{t('invitedToFamily')}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleRejectInvitation(invitation.id)} disabled={processingAction === invitation.id}>
                                <X className="h-4 w-4" />
                              </Button>
                              <Button size="sm" onClick={() => handleAcceptInvitation(invitation.id)} disabled={processingAction === invitation.id}>
                                {processingAction === invitation.id ? <Loader2 className="h-4 w-4 animate-spin" /> : t('accept')}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    {/* Invite member */}
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Input placeholder={t('inviteEmailPlaceholder')} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInvite()} />
                        <Button onClick={handleInvite} disabled={!inviteEmail.trim() || isInviting}>
                          {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}

                    {/* Members list */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t('members')}</Label>
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                          <div className="flex items-center gap-3">
                            {getRoleIcon(member.role)}
                            <div>
                              <p className="font-medium text-sm">{member.user_id === user?.id ? t('you') : member.user_email || t('member')}</p>
                              <p className="text-xs text-muted-foreground capitalize">{getRoleLabel(member.role)}</p>
                            </div>
                          </div>
                          {isAdmin && member.user_id !== user?.id && (
                            <div className="flex items-center gap-2">
                              <Select value={member.role === 'owner' ? 'admin' : member.role} onValueChange={(value) => handleRoleChange(member.id, value as FamilyRole)} disabled={processingAction === member.id}>
                                <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">{t('role_admin')}</SelectItem>
                                  <SelectItem value="member">{t('role_member')}</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveMember(member.id)} disabled={processingAction === member.id}>
                                {processingAction === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Pending sent invitations */}
                    {isAdmin && pendingInvitations.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">{t('pendingSent')}</Label>
                        {pendingInvitations.map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border bg-muted/30">
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{invitation.email}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCancelInvitation(invitation.id)} disabled={processingAction === invitation.id}>
                              {processingAction === invitation.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    {/* Leave/Delete family */}
                    <div className="space-y-2">
                      {!isOnlyMember && (
                        <Button 
                          variant="outline" 
                          className="w-full text-destructive hover:text-destructive" 
                          onClick={() => setShowLeaveAlert(true)}
                          disabled={isOnlyAdmin}
                          title={isOnlyAdmin ? t('promoteAdminFirst') : undefined}
                        >
                          <LogOut className="h-4 w-4 mr-2" />{t('leaveFamily')}
                        </Button>
                      )}
                      {isOnlyAdmin && !isOnlyMember && (
                        <p className="text-xs text-muted-foreground text-center">{t('promoteAdminFirst')}</p>
                      )}
                      {(isAdmin || isOnlyMember) && (
                        <Button variant="destructive" className="w-full" onClick={() => setShowDeleteAlert(true)}>
                          <Trash2 className="h-4 w-4 mr-2" />{t('deleteFamily')}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('noFamilySelected')}</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteFamilyConfirm')}</AlertDialogTitle>
            <AlertDialogDescription className={!isCurrentOffline ? "text-destructive font-medium" : ""}>
              {isCurrentOffline ? t('deleteFamilyWarning') : t('deleteFamilyWarningOnline')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFamily} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Alert */}
      <AlertDialog open={showLeaveAlert} onOpenChange={setShowLeaveAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('leaveFamily')}</AlertDialogTitle>
            <AlertDialogDescription>{t('leaveFamilyConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveFamily} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('leave')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Family Dialog */}
      <Dialog open={showCreateFamilyDialog} onOpenChange={setShowCreateFamilyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('createFamily')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t('familyNamePlaceholder')}
              value={createFamilyName}
              onChange={(e) => setCreateFamilyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
            />
            <Button onClick={handleCreateFamily} disabled={isCreatingFamily || !createFamilyName.trim()} className="w-full">
              {isCreatingFamily ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {t('createFamily')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};