import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getAppBaseUrl } from '@/lib/utils/appBaseUrl';
import * as userService from '@/lib/services/userService';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [postAuthType, setPostAuthType] = useState<'signup' | 'recovery' | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const type = params.get('type');

    if (type === 'signup' || type === 'recovery') {
      setPostAuthType(type);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!postAuthType) return;

    // Só mostra sucesso quando realmente existe sessão (evita falso positivo)
    if (postAuthType === 'signup' && user) {
      toast({
        title: t('success'),
        description: t('emailConfirmedSuccess'),
      });
    }

    // Remove o hash da URL para não expor tokens no navegador/histórico
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    setPostAuthType(null);
  }, [loading, postAuthType, user, t]);



  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // When a user becomes available, ensure server has initial preferences copied
  // from localStorage if the server record is missing or missing fields.
  useEffect(() => {
    if (!user) return;

    const syncLocalPreferencesToServer = async () => {
      try {
        const { data, error } = await userService.getUserPreferences(user.id);
        if (error) return;

        const localTheme = typeof window !== 'undefined' ? localStorage.getItem('budget-app-theme') : null;
        const localLanguage = typeof window !== 'undefined' ? localStorage.getItem('budget-app-language') : null;
        const localCurrency = typeof window !== 'undefined' ? localStorage.getItem('budget-app-currency') : null;

        const payload: any = { user_id: user.id };
        let shouldUpsert = false;

        if (!data) {
          // No server record: explicitly write all three preferences to ensure
          // the server reflects the app's current state. Use localStorage
          // values when available, otherwise use sensible defaults so the
          // server doesn't end up with an unexpected default.
          const browserLang = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
          const themeToWrite = localTheme || 'dark';
          const languageToWrite = (localLanguage === 'pt' || localLanguage === 'en') ? localLanguage : (browserLang === 'pt' ? 'pt' : 'en');
          const currencyToWrite = (localCurrency === 'BRL' || localCurrency === 'USD') ? localCurrency : 'BRL';

          payload.theme = themeToWrite;
          payload.language = languageToWrite;
          payload.currency = currencyToWrite;
          shouldUpsert = true;
        } else {
          // Partial record: fill missing fields from localStorage
          const prefs = data as userService.UserPreference;
          if ((!prefs.theme || prefs.theme === null) && localTheme) { payload.theme = localTheme; shouldUpsert = true; }
          if ((!prefs.language || prefs.language === null) && localLanguage) { payload.language = localLanguage; shouldUpsert = true; }
          if ((!prefs.currency || prefs.currency === null) && localCurrency) { payload.currency = localCurrency; shouldUpsert = true; }
        }

        if (shouldUpsert) {
          try {
            await userService.upsertUserPreference(payload);
          } catch (upsertErr) {
            // Non-fatal, log for diagnostics
            console.error('Failed to upsert user preferences on first auth:', upsertErr);
          }
        }
      } catch (err) {
        console.error('Error syncing local preferences to server:', err);
      }
    };

    syncLocalPreferencesToServer();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAppBaseUrl(),
        data: displayName ? { display_name: displayName } : undefined,
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Some sessions can fail server-side revocation (e.g. /logout 403). In that case,
    // we still want to reliably clear the local session so the user can log out.
    const { error } = await supabase.auth.signOut(); // default: global

    if (error) {
      // Fallback: local sign out (clears storage without calling the server)
      await supabase.auth.signOut({ scope: 'local' });

      // Last resort: ensure token is removed from storage
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
