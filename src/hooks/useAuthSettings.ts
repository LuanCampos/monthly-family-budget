/**
 * Hook for Settings Panel - Auth Management
 * Handles sign in, sign up, and sign out
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/ui/use-toast';
import { logger } from '@/lib/logger';

export type AuthTab = 'login' | 'signup';

export interface AuthSettingsState {
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (pwd: string) => void;
  authConfirmPassword: string;
  setAuthConfirmPassword: (pwd: string) => void;
  authDisplayName: string;
  setAuthDisplayName: (name: string) => void;
  authTab: AuthTab;
  setAuthTab: (tab: AuthTab) => void;
  isLoading: boolean;
  handleSignIn: () => Promise<void>;
  handleSignUp: () => Promise<void>;
  handleSignOut: () => Promise<void>;
}

export const useAuthSettings = (t: (key: string) => string): AuthSettingsState => {
  const { signIn, signUp, signOut } = useAuth();
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!authEmail || !authPassword) {
      toast({ title: t('error'), description: t('fillAllFields'), variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    logger.info('auth.signin.start', { email: authEmail });
    
    const { error } = await signIn(authEmail, authPassword);
    setIsLoading(false);
    
    if (error) {
      logger.error('auth.signin.failed', { error: error.message });
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      logger.info('auth.signin.success');
      toast({ title: t('success'), description: t('signedInSuccessfully') });
      setAuthEmail('');
      setAuthPassword('');
      setAuthTab('login');
    }
  };

  const handleSignUp = async () => {
    if (!authEmail || !authPassword || !authConfirmPassword) {
      toast({ title: t('error'), description: t('fillAllFields'), variant: 'destructive' });
      return;
    }
    if (authPassword !== authConfirmPassword) {
      toast({ title: t('error'), description: t('passwordsDoNotMatch'), variant: 'destructive' });
      return;
    }
    if (authPassword.length < 6) {
      toast({ title: t('error'), description: t('passwordTooShort'), variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    logger.info('auth.signup.start', { email: authEmail });
    
    const { error } = await signUp(authEmail, authPassword, authDisplayName);
    setIsLoading(false);
    
    if (error) {
      logger.error('auth.signup.failed', { error: error.message });
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      logger.info('auth.signup.success');
      toast({ title: t('success'), description: t('accountCreatedSuccessfully') });
      setAuthEmail('');
      setAuthPassword('');
      setAuthConfirmPassword('');
      setAuthDisplayName('');
      setAuthTab('login');
    }
  };

  const handleSignOut = async () => {
    logger.info('auth.signout.start');
    await signOut();
    logger.info('auth.signout.success');
  };

  return {
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authConfirmPassword,
    setAuthConfirmPassword,
    authDisplayName,
    setAuthDisplayName,
    authTab,
    setAuthTab,
    isLoading,
    handleSignIn,
    handleSignUp,
    handleSignOut,
  };
};
