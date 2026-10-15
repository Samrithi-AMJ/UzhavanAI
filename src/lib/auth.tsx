/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile } from './supabase';
import type { Language } from './i18n';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInAsGuest: (name?: string) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isValidLang(v: string | null | undefined): v is Language {
  return !!v && ['en', 'hi', 'mr', 'ta', 'te', 'bn'].includes(v);
}

const GUEST_STORAGE_KEY = 'uzhavan-guest-session';

function createGuestState(name = 'Uzhavan Farmer', lang: Language = 'en'): { session: Session; profile: Profile } {
  const user = {
    id: 'guest-farmer-001',
    app_metadata: {},
    user_metadata: { full_name: name },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'guest@uzhavan.ai',
  } as unknown as User;

  const session = {
    access_token: 'guest-token',
    refresh_token: 'guest-refresh',
    expires_in: 86400,
    token_type: 'bearer',
    user,
  };

  const profile: Profile = {
    id: 'guest-farmer-001',
    full_name: name,
    farm_name: 'Green Field Farm',
    location: 'Thanjavur, Tamil Nadu',
    latitude: 10.787,
    longitude: 79.1378,
    farm_size_acres: 3,
    language: lang,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { session, profile };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>(
    isValidLang(localStorage.getItem('agri-lang')) ? localStorage.getItem('agri-lang') as Language : 'en'
  );

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) {
        setProfile(data as Profile);
        const storedLang = localStorage.getItem('agri-lang');
        if (!isValidLang(storedLang) && isValidLang((data as Profile).language)) {
          setLanguageState((data as Profile).language as Language);
          localStorage.setItem('agri-lang', (data as Profile).language as Language);
        }
      }
    } catch (err) {
      console.warn('[UzhavanAI] Profile fetch ignored (network/unconfigured):', err);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Check if user previously signed in as guest
    const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
    if (savedGuest) {
      try {
        const parsed = JSON.parse(savedGuest);
        const guest = createGuestState(parsed.name || 'Uzhavan Farmer', language);
        setSession(guest.session);
        setProfile(guest.profile);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    }

    // Safety timeout: NEVER leave the user stuck on the loading spinner for more than 1.5 seconds!
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 1500);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data?.session ?? null);
        if (data?.session?.user) {
          loadProfile(data.session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[UzhavanAI] Auth getSession failed or unreachable:', err);
        if (mounted) setLoading(false);
      })
      .finally(() => {
        clearTimeout(safetyTimer);
      });

    let listener: { subscription?: { unsubscribe: () => void } } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        if (newSession?.user) {
          loadProfile(newSession.user.id);
        } else if (!localStorage.getItem(GUEST_STORAGE_KEY)) {
          setProfile(null);
        }
      });
      listener = data;
    } catch (err) {
      console.warn('[UzhavanAI] Auth state change listener uninitialized:', err);
    }

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agri-lang', lang);
    if (session?.user) {
      supabase
        .from('profiles')
        .update({ language: lang })
        .eq('id', session.user.id)
        .then(({ error }) => {
          if (error) {
            // The local choice (state + localStorage, already applied above)
            // remains correct and authoritative regardless of this failing —
            // this only affects cross-device sync of the language
            // preference. Logged so a real RLS/permissions problem is
            // visible during development rather than silently swallowed.
            console.error('[UzhavanAI] Failed to persist language to profile:', {
              operation: 'update',
              table: 'profiles',
              userId: session.user.id,
              code: error.code,
              message: error.message,
            });
          }
        });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        language,
      });
    }
    return { error: null };
  };

  const signInAsGuest = (name = 'Uzhavan Farmer') => {
    const guest = createGuestState(name, language);
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ name }));
    setSession(guest.session);
    setProfile(guest.profile);
    setLoading(false);
  };

  const signOut = async () => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignored if network unavailable
    }
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (session?.user && session.user.id !== 'guest-farmer-001') {
      await loadProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        language,
        setLanguage,
        signIn,
        signUp,
        signInAsGuest,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
