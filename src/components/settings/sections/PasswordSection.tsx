/**
 * Password Section - Change password dialog content
 */

import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TriggerButton } from '@/components/common';
import * as userService from '@/lib/services/userService';
import { toast } from '@/hooks/ui/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface PasswordSectionProps {
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

export const PasswordSection: React.FC<PasswordSectionProps> = ({
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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    
    const { error: signInError } = await userService.verifyPassword(
      user?.email || '',
      currentPassword
    );
    
    if (signInError) {
      setIsLoading(false);
      toast({ title: t('error'), description: t('currentPasswordIncorrect'), variant: 'destructive' });
      return;
    }
    
    const { error } = await userService.updatePassword(newPassword);
    setIsLoading(false);
    
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('passwordUpdated') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onBack();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <TriggerButton 
            user={user} 
            myPendingInvitations={myPendingInvitations as any[]} 
            getUserInitials={getUserInitials} 
            getDisplayName={getDisplayName} 
          />
        </DialogTrigger>
      )}
      <DialogContent className="bg-card border-border sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="h-5 w-5 text-primary" />
            {t('changePassword')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('passwordDialogDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
            <Input 
              id="currentPassword" 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              placeholder={t('currentPasswordPlaceholder')} 
              className="h-10 bg-secondary/50 border-border" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPassword')}</Label>
            <Input 
              id="newPassword" 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder={t('newPasswordPlaceholder')} 
              className="h-10 bg-secondary/50 border-border" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder={t('confirmPasswordPlaceholder')} 
              className="h-10 bg-secondary/50 border-border" 
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
          <Button variant="outline" onClick={onBack}>{t('cancel')}</Button>
          <Button onClick={handleUpdatePassword} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('loading')}
              </>
            ) : (
              t('updatePassword')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
