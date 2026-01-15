/**
 * Auth Section - Login/Signup dialog for offline mode users
 */

import React, { useState } from 'react';
import { LogIn, User, Mail, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TriggerButton } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/ui/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthSectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  t: (key: string) => string;
  // For uncontrolled trigger mode
  controlledOpen?: boolean;
  user: SupabaseUser | null;
  myPendingInvitations: unknown[];
  getUserInitials: () => string;
  getDisplayName: () => string;
}

export const AuthSection: React.FC<AuthSectionProps> = ({
  open,
  onOpenChange,
  onBack,
  t,
  controlledOpen,
  user,
  myPendingInvitations,
  getUserInitials,
  getDisplayName,
}) => {
  const { signIn, signUp } = useAuth();
  
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
    setAuthDisplayName('');
  };

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
      resetForm();
      onBack();
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
      resetForm();
      onBack();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="dashboard-card-header px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <LogIn className="h-5 w-5" />
            {t('loginOrSignup')}
          </DialogTitle>
          <DialogDescription>
            {t('authDialogDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto dashboard-card-content space-y-4">
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
                  {isLoading ? (
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
                  {isLoading ? (
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
          
          <Button variant="ghost" onClick={onBack} className="w-full">
            {t('back')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
