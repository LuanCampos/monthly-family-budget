import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogIn, LogOut, User, Settings, KeyRound } from 'lucide-react';
import { UserSettingsDialog } from './UserSettingsDialog';

export const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);

  const getUserInitials = () => {
    if (!user) return '?';
    const email = user.email || '';
    const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name;
    
    if (displayName) {
      return displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.display_name || user.user_metadata?.full_name || user.email;
  };

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        asChild
        title={t('login')}
        className="h-8 w-8"
      >
        <Link to="/auth">
          <LogIn className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={getDisplayName()} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none truncate">
                {getDisplayName()}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('accountSettings')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
};
