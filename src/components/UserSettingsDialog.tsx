import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Loader2, User, KeyRound } from 'lucide-react';

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserSettingsDialog: React.FC<UserSettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast({
        title: t('error'),
        description: t('displayNameRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('success'),
        description: t('profileUpdated'),
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: t('error'),
        description: t('fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('error'),
        description: t('passwordTooShort'),
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('error'),
        description: t('passwordsDoNotMatch'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    // First verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });

    if (signInError) {
      setIsLoading(false);
      toast({
        title: t('error'),
        description: t('currentPasswordIncorrect'),
        variant: 'destructive',
      });
      return;
    }

    // Then update to new password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('success'),
        description: t('passwordUpdated'),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('accountSettings')}</DialogTitle>
          <DialogDescription>{t('accountSettingsDescription')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="text-xs sm:text-sm">
              <User className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="text-xs sm:text-sm">
              <KeyRound className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('password')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">{t('emailCannotBeChanged')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">{t('displayName')}</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('displayNamePlaceholder')}
              />
            </div>
            <Button onClick={handleUpdateProfile} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('saveChanges')
              )}
            </Button>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('currentPasswordPlaceholder')}
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
              />
            </div>
            <Button onClick={handleUpdatePassword} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('updatePassword')
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
