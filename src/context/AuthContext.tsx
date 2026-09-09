import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AccessState } from '../types';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  access: AccessState;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshAccess: () => Promise<AccessState>;
};

const blankAccess: AccessState = { frankiflow: false, frankiholz: false, frankiflowRole: null };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AccessState>(blankAccess);

  const checkAccess = useCallback(async (activeSession?: Session | null): Promise<AccessState> => {
    const current = activeSession ?? (await supabase.auth.getSession()).data.session;
    if (!current?.user) {
      setAccess(blankAccess);
      return blankAccess;
    }

    const [flowResult, holzResult] = await Promise.all([
      supabase
        .from('pricing_admin_users')
        .select('role,active')
        .eq('user_id', current.user.id)
        .eq('active', true)
        .maybeSingle(),
      supabase.rpc('frankiholz_admin_access_check'),
    ]);

    const next: AccessState = {
      frankiflow: Boolean(flowResult.data && !flowResult.error),
      frankiholz: Boolean(holzResult.data && !holzResult.error),
      frankiflowRole: (flowResult.data as { role?: string } | null)?.role ?? null,
    };
    setAccess(next);
    return next;
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await checkAccess(data.session);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession) await checkAccess(nextSession);
      else setAccess(blankAccess);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [checkAccess]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: error.message };
    const next = await checkAccess(data.session);
    if (!next.frankiflow && !next.frankiholz) {
      await supabase.auth.signOut();
      return { error: 'This account is signed in but is not authorized for FrankiFlow or FrankiHolz admin access.' };
    }
    return {};
  }, [checkAccess]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    access,
    signIn,
    signOut,
    refreshAccess: () => checkAccess(session),
  }), [session, loading, access, signIn, signOut, checkAccess]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
