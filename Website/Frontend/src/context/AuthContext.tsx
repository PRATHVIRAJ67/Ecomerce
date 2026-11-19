import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Profile } from '@ecommerce/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError } from '../lib/api';
import { keys } from '../lib/queries';
import { supabase } from '../lib/supabase';

type Status = 'loading' | 'signed_out' | 'ready' | 'unavailable';

interface AuthState {
  status: Status;
  session: Session | null;
  profile: Profile | null;
  /** True once we know whether the visitor is signed in. */
  ready: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { full_name: string; email: string; password: string }) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Email or password is incorrect.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first — check your inbox for the link.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with this email already exists. Try signing in.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('password should be')) return 'Password must be at least 8 characters.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [initialised, setInitialised] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialised(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const me = useQuery({
    queryKey: [...keys.profile, userId],
    queryFn: () => api.get<Profile>('/me'),
    enabled: Boolean(userId),
    retry: (count, err) => !(err instanceof ApiError && (err.status === 401 || err.status === 403)) && count < 2,
    staleTime: 5 * 60_000,
  });

  // A suspended account or a revoked session: sign out locally so the visitor can keep browsing as a guest.
  useEffect(() => {
    if (me.error instanceof ApiError && (me.error.status === 401 || me.error.status === 403)) {
      void supabase?.auth.signOut();
    }
  }, [me.error]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Sign-in is not configured for this store yet.');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(friendlyAuthError(error.message));
  }, []);

  const signUp = useCallback(async ({ full_name, email, password }: { full_name: string; email: string; password: string }) => {
    if (!supabase) throw new Error('Registration is not configured for this store yet.');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: full_name.trim() }, emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    // Supabase returns a user with no identities when the email is already registered (anti-enumeration).
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Try signing in.');
    }
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    qc.removeQueries({ queryKey: ['me'] });
  }, [qc]);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Password reset is not configured for this store yet.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    if (error) throw new Error(friendlyAuthError(error.message));
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error('Not configured');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(friendlyAuthError(error.message));
  }, []);

  const value = useMemo<AuthState>(() => {
    let status: Status;
    if (!supabase) status = 'unavailable';
    else if (!initialised) status = 'loading';
    else if (!session) status = 'signed_out';
    else status = 'ready';
    return {
      status,
      session,
      profile: me.data ?? null,
      ready: status !== 'loading',
      isSignedIn: status === 'ready',
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
    };
  }, [initialised, session, me.data, signIn, signUp, signOut, requestPasswordReset, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
