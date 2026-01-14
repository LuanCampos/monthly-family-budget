import { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import * as userService from '@/lib/services/userService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, ThemeKey } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { logger } from '@/lib/logger';

export const useUserPreferences = (user: User | null, loading: boolean) => {
  const { setLanguage } = useLanguage();
  const { setTheme } = useTheme();
  const { setCurrency } = useCurrency();
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if still loading auth state
    if (loading) return;

    // Reset tracking when user changes
    if (user?.id !== lastUserIdRef.current) {
      hasLoadedRef.current = false;
      lastUserIdRef.current = user?.id ?? null;
    }

    // Skip if no user or already loaded for this user
    if (!user || hasLoadedRef.current) return;

    const loadPreferences = async () => {
      try {
        const { data, error } = await userService.getUserPreferences(user.id);

        if (error) {
          logger.warn('userPreferences.load.error', { userId: user.id, error });
          return;
        }

        if (data) {
          const prefs = data as userService.UserPreference;
          
          if (prefs.language && (prefs.language === 'pt' || prefs.language === 'en')) {
            setLanguage(prefs.language);
          }
          
          if (prefs.theme) {
            setTheme(prefs.theme as ThemeKey);
          }
          
          if (prefs.currency && (prefs.currency === 'BRL' || prefs.currency === 'USD')) {
            setCurrency(prefs.currency);
          }
        }

        hasLoadedRef.current = true;
      } catch (err) {
        logger.error('userPreferences.load.failed', { userId: user.id, error: err });
      }
    };

    loadPreferences();
  }, [user, loading, setLanguage, setTheme, setCurrency]);
};
