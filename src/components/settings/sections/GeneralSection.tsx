/**
 * General Tab - User account, preferences, and data management
 */

import React from 'react';
import { 
  Globe, 
  Palette, 
  Coins, 
  User, 
  KeyRound, 
  LogIn, 
  LogOut, 
  WifiOff, 
  Trash2, 
  HardDrive, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { languages, Language } from '@/i18n';
import { themes, ThemeKey } from '@/contexts/ThemeContext';
import { currencies, CurrencyCode } from '@/contexts/CurrencyContext';
import { TranslationKey } from '@/i18n/translations/pt';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface GeneralSectionProps {
  user: SupabaseUser | null;
  language: Language;
  theme: ThemeKey;
  currency: CurrencyCode;
  currentMonthLabel?: string;
  processingAction: string | null;
  onLanguageChange: (lang: Language) => void;
  onThemeChange: (theme: ThemeKey) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onEditProfile: () => void;
  onEditPassword: () => void;
  onSignOut: () => void;
  onAuthClick: () => void;
  onDeleteMonth?: () => void;
  onClearOfflineCache: () => void;
  getUserInitials: () => string;
  getDisplayName: () => string;
  t: (key: string) => string;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({
  user,
  language,
  theme,
  currency,
  currentMonthLabel,
  processingAction,
  onLanguageChange,
  onThemeChange,
  onCurrencyChange,
  onEditProfile,
  onEditPassword,
  onSignOut,
  onAuthClick,
  onDeleteMonth,
  onClearOfflineCache,
  getUserInitials,
  getDisplayName,
  t,
}) => {
  return (
    <div className="mt-0 space-y-5">
      {/* User Account Section */}
      {user ? (
        <div className="dashboard-card">
          <div className="dashboard-card-content space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={getDisplayName()} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onEditProfile} 
                className="flex-1 h-8 text-xs"
              >
                <User className="h-3.5 w-3.5 mr-1.5" />
                {t('editProfile')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onEditPassword} 
                className="flex-1 h-8 text-xs"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                {t('changePassword')}
              </Button>
            </div>
            <div className="flex justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-muted-foreground hover:text-destructive" 
                onClick={onSignOut}
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                <span className="text-sm">{t('logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-card">
          <div className="dashboard-card-content space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <WifiOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('offlineMode')}</span>
            </div>
            <Button variant="outline" className="w-full h-9" onClick={onAuthClick}>
              <LogIn className="h-4 w-4 mr-2" />
              {t('loginOrSignup')}
            </Button>
          </div>
        </div>
      )}

      {/* Preferences Section */}
      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {t('preferences')}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('language')}</span>
              </div>
              <Select value={language} onValueChange={(v) => onLanguageChange(v as Language)}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('currency')}</span>
              </div>
              <Select value={currency} onValueChange={(v) => onCurrencyChange(v as CurrencyCode)}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('theme')}</span>
              </div>
              <Select value={theme} onValueChange={(v) => onThemeChange(v as ThemeKey)}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {themes.map((themeOption) => (
                    <SelectItem key={themeOption.key} value={themeOption.key}>
                      {t(themeOption.labelKey as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone - More subtle */}
      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
            {t('dataManagement')}
          </p>
          <div className="space-y-1.5 flex flex-col items-center">
            {onDeleteMonth && currentMonthLabel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-3/4 justify-center h-8 text-destructive ring-1 ring-destructive/20 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    <span className="text-sm">{t('delete')} "{currentMonthLabel}"</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      {t('deleteMonth')}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      {t('deleteMonthConfirm')} <strong>{currentMonthLabel}</strong>? {t('deleteMonthWarning')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                      onClick={onDeleteMonth}
                    >
                      {t('delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-3/4 justify-center h-8 text-destructive ring-1 ring-destructive/20 rounded"
                  disabled={processingAction === 'clear-offline-cache'}
                >
                  {processingAction === 'clear-offline-cache' ? (
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  ) : (
                    <HardDrive className="h-3.5 w-3.5 mr-2" />
                  )}
                  <span className="text-sm">{t('clearOfflineCache')}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {t('clearOfflineCache')}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    {t('clearOfflineCacheWarning')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={onClearOfflineCache}
                  >
                    {t('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};
