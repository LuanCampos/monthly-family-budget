/**
 * Generic Confirmation Dialog
 * 
 * Reusable AlertDialog for confirming destructive or important actions.
 * Use this instead of creating individual confirmation dialogs.
 */

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
import { AlertTriangle, Trash2, AlertCircle, type LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type ConfirmVariant = 'destructive' | 'warning' | 'default';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: LucideIcon;
  loading?: boolean;
}

const variantConfig: Record<ConfirmVariant, { icon: LucideIcon; iconClass: string; buttonClass: string }> = {
  destructive: {
    icon: Trash2,
    iconClass: 'text-destructive',
    buttonClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning',
    buttonClass: '',
  },
  default: {
    icon: AlertCircle,
    iconClass: 'text-primary',
    buttonClass: '',
  },
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'destructive',
  icon,
  loading = false,
}: ConfirmDialogProps) => {
  const { t } = useLanguage();
  
  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Icon className={`h-5 w-5 ${config.iconClass}`} />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelLabel || t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            className={config.buttonClass}
            disabled={loading}
            onClick={onConfirm}
          >
            {confirmLabel || (variant === 'destructive' ? t('delete') : t('confirm'))}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
