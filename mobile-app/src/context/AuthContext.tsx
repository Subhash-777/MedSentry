import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database, Profile } from '../types/database';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthContextValue = {
  /** Supabase Auth session (null when signed out) */
  session: Session | null;
  /** Supabase Auth user (null when signed out) */
  user: User | null;
  /** MedSentry profile row from `profiles` table */
  profile: Profile | null;
  /** True while the initial session check or a sign-in/sign-out call is in flight */
  loading: boolean;
  /** Sign the current user out */
  signOut: () => Promise<void>;
  /** Refetch profile row from DB */
  refreshProfile: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------------------
  // Bootstrap: restore session on app start & handle deep links
  // -------------------------------------------------------------------------
  useEffect(() => {
    // 1. Auto-refresh session while app is active
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    // 2. Handle incoming deep links (Email Confirmations / Magic Links)
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      // Extract the PKCE code if present in the redirect URL
      const codeMatch = url.match(/code=([^&#]+)/);
      if (codeMatch && codeMatch[1]) {
        try {
          // Exchanging the code verifies the email and creates the session
          await supabase.auth.exchangeCodeForSession(codeMatch[1]);
        } catch (err) {
          console.error('[AuthContext] Deep link code exchange error:', err);
        }
      }
    };

    const linkingSub = Linking.addEventListener('url', (event) => handleDeepLink(event.url));
    Linking.getInitialURL().then(handleDeepLink);

    // 3. Restore session normally
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchOrCreateProfile(data.session.user);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.warn('[AuthContext] Session restore network error:', err?.message || err);
      setLoading(false);
    });

    // Listen for auth state changes (sign in, token refresh, sign out)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        fetchOrCreateProfile(newSession.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
      appStateSub.remove();
      linkingSub.remove();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Profile upsert — creates the `profiles` row on first login
  // (Works identically for Email/Password and Google Sign-In)
  // -------------------------------------------------------------------------
  async function fetchOrCreateProfile(authUser: User) {
    try {
      const googleName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.user_metadata?.preferred_username ||
        null;

      // Try to load the existing profile row
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Row doesn't exist yet — create it (first login)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newProfile = {
          id: authUser.id,
          full_name: googleName,
          preferred_language: 'en',
          is_admin: false,
          account_type: 'standard' as const,
        } satisfies ProfileInsert;

        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile as any)
          .select('*')
          .single();

        if (!insertError && created) {
          setProfile(created as Profile);
        }
      } else if (!error && data) {
        const p = data as any;
        // If DB profile exists but lacks full_name, backfill from Google Account metadata
        if (!p.full_name && googleName) {
          await (supabase.from('profiles') as any)
            .update({ full_name: googleName })
            .eq('id', authUser.id);
          p.full_name = googleName;
        }
        setProfile(p as Profile);
      }
    } catch (err) {
      console.error('[AuthContext] fetchOrCreateProfile error:', err);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Auth actions
  // -------------------------------------------------------------------------

  async function signOut(): Promise<void> {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile(): Promise<void> {
    if (session?.user) {
      await fetchOrCreateProfile(session.user);
    }
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
