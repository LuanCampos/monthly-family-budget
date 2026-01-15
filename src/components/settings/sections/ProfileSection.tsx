/**
 * Profile Section - Edit profile dialog content
 */

import React, { useState, useEffect } from 'react';
import { User, Loader2 } from 'lucide-react';
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
import TriggerButton from '@/components/ui/trigger-button';
import * as userService from '@/lib/services/userService';
import { toast } from '@/hooks/ui/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileSectionProps {
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

export const ProfileSection: React.FC<ProfileSectionProps> = ({
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
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast({ title: t('error'), description: t('displayNameRequired'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await userService.updateUserProfile({ display_name: displayName.trim() });
    setIsLoading(false);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('profileUpdated') });
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
            <User className="h-5 w-5 text-primary" />
            {t('editProfile')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('profileDialogDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input 
              id="email" 
              type="email" 
              value={user?.email || ''} 
              disabled 
              className="h-10 bg-muted border-border" 
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
              className="h-10 bg-secondary/50 border-border" 
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
          <Button variant="outline" onClick={onBack}>{t('cancel')}</Button>
          <Button onClick={handleUpdateProfile} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('loading')}
              </>
            ) : (
              t('saveChanges')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
