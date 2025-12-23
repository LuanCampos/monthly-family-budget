/**
 * Hook for Settings Panel - Profile Management
 * Handles display name and password updates
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/ui/use-toast';
import { logger } from '@/lib/logger';

export interface ProfileSettingsState {
  displayName: string;
  setDisplayName: (name: string) => void;
  currentPassword: string;
  setCurrentPassword: (pwd: string) => void;
  newPassword: string;
  setNewPassword: (pwd: string) => void;
  confirmPassword: string;
  setConfirmPassword: (pwd: string) => void;
  isLoading: boolean;
  handleUpdateProfile: () => Promise<void>;
  handleUpdatePassword: () => Promise<void>;
  getUserInitials: () => string;
  getDisplayName: () => string;
}

export const useProfileSettings = (t: (key: string) => string): ProfileSettingsState => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || user?.user_metadata?.full_name || ''
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast({ title: t('error'), description: t('displayNameRequired'), variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    logger.info('profile.update.start', { displayName });
    
    const { error } = await supabase.auth.updateUser({ 
      data: { display_name: displayName.trim() } 
    });
    
    setIsLoading(false);
    if (error) {
      logger.error('profile.update.failed', { error: error.message });
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      logger.info('profile.update.success');
      toast({ title: t('success'), description: t('profileUpdated') });
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
    logger.info('password.update.start');
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });
    
    if (signInError) {
      setIsLoading(false);
      logger.warn('password.update.signin_failed');
      toast({ title: t('error'), description: t('currentPasswordIncorrect'), variant: 'destructive' });
      return;
    }
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);
    
    if (error) {
      logger.error('password.update.failed', { error: error.message });
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      logger.info('password.update.success');
      toast({ title: t('success'), description: t('passwordUpdated') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return {
    displayName,
    setDisplayName,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    handleUpdateProfile,
    handleUpdatePassword,
    getUserInitials,
    getDisplayName,
  };
};
