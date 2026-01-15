/**
 * Settings Dialogs - Alert dialogs and modals for settings
 */

import React from 'react';
import { Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

// Delete Family Alert
interface DeleteFamilyAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCurrentOffline: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  t: (key: string) => string;
}

export const DeleteFamilyAlert: React.FC<DeleteFamilyAlertProps> = ({
  open,
  onOpenChange,
  isCurrentOffline,
  isDeleting,
  onDelete,
  t,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-card border-border sm:max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          {t('deleteFamilyConfirm')}
        </AlertDialogTitle>
        <AlertDialogDescription className={!isCurrentOffline ? "text-destructive font-medium" : ""}>
          {isCurrentOffline ? t('deleteFamilyWarning') : t('deleteFamilyWarningOnline')}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
        <AlertDialogAction 
          onClick={onDelete} 
          disabled={isDeleting} 
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {t('delete')}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Leave Family Alert
interface LeaveFamilyAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLeaving: boolean;
  onLeave: () => void;
  t: (key: string) => string;
}

export const LeaveFamilyAlert: React.FC<LeaveFamilyAlertProps> = ({
  open,
  onOpenChange,
  isLeaving,
  onLeave,
  t,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-card border-border sm:max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          {t('leaveFamilyConfirm')}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-muted-foreground">
          {t('leaveFamilyWarning')}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isLeaving}>{t('cancel')}</AlertDialogCancel>
        <AlertDialogAction 
          onClick={onLeave} 
          disabled={isLeaving} 
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {t('leave')}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Create Family Dialog
interface CreateFamilyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyName: string;
  onFamilyNameChange: (name: string) => void;
  isCreating: boolean;
  onCreate: () => void;
  t: (key: string) => string;
}

export const CreateFamilyDialog: React.FC<CreateFamilyDialogProps> = ({
  open,
  onOpenChange,
  familyName,
  onFamilyNameChange,
  isCreating,
  onCreate,
  t,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-card border-border sm:max-w-sm max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
      <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
        <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
          <Plus className="h-5 w-5 text-primary" />
          {t('createFamily')}
        </DialogTitle>
      </DialogHeader>
      <div className="px-6 py-4">
        <Input
          className="h-10 bg-secondary/50 border-border"
          placeholder={t('familyNamePlaceholder')}
          value={familyName}
          onChange={(e) => onFamilyNameChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCreate()}
        />
      </div>
      <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t('cancel')}
        </Button>
        <Button onClick={onCreate} disabled={isCreating || !familyName.trim()}>
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {t('createFamily')}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
