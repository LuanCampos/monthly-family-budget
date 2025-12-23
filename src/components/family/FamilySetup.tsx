import { useState } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Users, Plus, Mail, Check, X, Loader2, WifiOff, Lock, User, ArrowLeft, LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { getAppBaseUrl } from '@/lib/utils/appBaseUrl';

export const FamilySetup = () => {
  const { t } = useLanguage();
  const { user, signIn, signUp, signOut } = useAuth();
  const { createFamily, createOfflineFamily, myPendingInvitations, acceptInvitation, rejectInvitation, loading } = useFamily();
  const { toast } = useToast();
  
  // Family creation state
  const [familyName, setFamilyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);
  
  // Auth state
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [pendingEmailVerification, setPendingEmailVerification] = useState<string | null>(null);

  const handleCreateFamily = async () => {
    if (!familyName.trim()) return;
    
    setIsCreating(true);
    const { error } = await createFamily(familyName.trim());
    setIsCreating(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('success'),
        description: t('familyCreated')
      });
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvitation(invitationId);
    const { error } = await acceptInvitation(invitationId);
    setProcessingInvitation(null);

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
    setProcessingInvitation(invitationId);
    const { error } = await rejectInvitation(invitationId);
    setProcessingInvitation(null);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleContinueOffline = async () => {
    setIsCreating(true);
    const { error } = await createOfflineFamily(t('offlineFamily'));
    setIsCreating(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: t('error'),
        description: t('fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    setIsAuthLoading(true);
    const { error } = await signIn(email, password);
    setIsAuthLoading(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message === 'Invalid login credentials' 
          ? t('invalidCredentials') 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('success'),
        description: t('loginSuccess'),
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword || !displayName.trim()) {
      toast({
        title: t('error'),
        description: t('fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t('error'),
        description: t('passwordTooShort'),
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t('error'),
        description: t('passwordsDoNotMatch'),
        variant: 'destructive',
      });
      return;
    }

    setIsAuthLoading(true);
    const { error } = await signUp(email, password, displayName.trim());
    setIsAuthLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: t('error'),
          description: t('emailAlreadyRegistered'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('error'),
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      setPendingEmailVerification(email);
      toast({
        title: t('success'),
        description: t('signupSuccess'),
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: t('error'),
        description: t('enterEmailForReset'),
        variant: 'destructive',
      });
      return;
    }

    setIsAuthLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAppBaseUrl(),
    });
    setIsAuthLoading(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('success'),
        description: t('resetEmailSent'),
      });
      setIsForgotPassword(false);
    }
  };

  // Show welcome screen with options when no user
  if (!user) {
    // Forgot password form
    if (isForgotPassword) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">
                {t('forgotPassword')}
              </CardTitle>
              <CardDescription>
                {t('forgotPasswordDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">{t('email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isAuthLoading}>
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('loading')}
                    </>
                  ) : (
                    t('sendResetLink')
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsForgotPassword(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('backToLogin')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Email verification pending
    if (pendingEmailVerification) {
      const handleResendVerification = async () => {
        setIsAuthLoading(true);
        const { error } = await supabase.auth.resend({
          type: 'signup',
           email: pendingEmailVerification,
           options: {
             emailRedirectTo: getAppBaseUrl(),
           },
        });
        setIsAuthLoading(false);

        if (error) {
          toast({
            title: t('error'),
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('success'),
            description: t('verificationEmailResent'),
          });
        }
      };

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-primary">
                {t('emailVerificationTitle')}
              </CardTitle>
              <CardDescription className="space-y-2">
                <p>{t('emailVerificationDescription')}</p>
                <p className="font-medium text-foreground">{pendingEmailVerification}</p>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {t('emailVerificationInstructions')}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendVerification}
                disabled={isAuthLoading}
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('loading')}
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    {t('resendVerificationEmail')}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t('checkSpamFolder')}
              </p>
              <Separator />
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setPendingEmailVerification(null);
                  setShowAuthForm(true);
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToLogin')}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Auth form (login/signup)
    if (showAuthForm) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">
                {t('appTitle')}
              </CardTitle>
              <CardDescription>
                {t('authDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">{t('login')}</TabsTrigger>
                  <TabsTrigger value="signup">{t('signup')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder={t('emailPlaceholder')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">{t('password')}</Label>
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 h-auto text-xs"
                          onClick={() => setIsForgotPassword(true)}
                        >
                          {t('forgotPassword')}
                        </Button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder={t('passwordPlaceholder')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isAuthLoading}>
                      {isAuthLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('loading')}
                        </>
                      ) : (
                        t('login')
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{t('displayName')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder={t('displayNamePlaceholder')}
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t('email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder={t('emailPlaceholder')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder={t('passwordPlaceholder')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">{t('confirmPassword')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder={t('confirmPasswordPlaceholder')}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isAuthLoading}>
                      {isAuthLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('loading')}
                        </>
                      ) : (
                        t('signup')
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setShowAuthForm(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('back')}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Welcome screen with options
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t('familyBudget')}</CardTitle>
            <CardDescription>{t('loginToAccessFamily')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => setShowAuthForm(true)}>
              <LogIn className="mr-2 h-4 w-4" />
              {t('loginOrSignup')}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('or')}</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleContinueOffline}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <WifiOff className="mr-2 h-4 w-4" />
              )}
              {t('continueOffline')}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t('continueOfflineDescription')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>{t('welcomeFamily')}</CardTitle>
          <CardDescription>{t('familySetupDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={myPendingInvitations.length > 0 ? 'invitations' : 'create'}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('createFamily')}
              </TabsTrigger>
              <TabsTrigger value="invitations" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('invitations')}
                {myPendingInvitations.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {myPendingInvitations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('familyName')}</label>
                <Input
                  placeholder={t('familyNamePlaceholder')}
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateFamily}
                disabled={!familyName.trim() || isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t('createFamily')}
              </Button>
            </TabsContent>

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
                        <p className="text-xs text-muted-foreground">
                          {t('invitedToFamily')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectInvitation(invitation.id)}
                          disabled={processingInvitation === invitation.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          disabled={processingInvitation === invitation.id}
                        >
                          {processingInvitation === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Botão de logout para trocar de conta */}
          <Separator className="my-4" />
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={async () => {
              try {
                await signOut();
              } catch (error) {
                toast({
                  title: t('error'),
                  description: String(error),
                  variant: 'destructive',
                });
              }
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('logout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
