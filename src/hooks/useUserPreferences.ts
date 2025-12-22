import { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, ThemeKey } from '@/contexts/ThemeContext';
import { useCurrency, CurrencyCode } from '@/contexts/CurrencyContext';

interface UserPreference {
  id: string;
  user_id: string;
  language: string | null;
  currency: string | null;
  theme: string | null;
  current_family_id: string | null;
  updated_at: string;
}

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
        const { data, error } = await supabase
          .from('user_preference')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading user preferences:', error);
          return;
        }

        if (data) {
          const prefs = data as UserPreference;
          
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
        console.error('Error loading user preferences:', err);
      }
    };

    loadPreferences();
  }, [user, loading, setLanguage, setTheme, setCurrency]);
};
