import { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService, SignInInput, SignUpInput } from '../services/authService';
import { supabase } from '../services/supabaseClient';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateName: (fullName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    authService
      .getSession()
      .then((current) => {
        if (mounted) setSession(current);
      })
      .catch((err) => {
        console.warn('[auth] failed to restore session', err);
      })
      .finally(() => {
        if (mounted) setInitializing(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        setSession(next);
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      initializing,
      signIn: async (input) => {
        await authService.signIn(input);
      },
      signUp: async (input) => {
        await authService.signUp(input);
      },
      signOut: async () => {
        await authService.signOut();
      },
      updateName: async (fullName: string) => {
        const { data, error } = await supabase.auth.updateUser({
          data: { full_name: fullName },
        });
        if (error) throw error;
        if (data.user) {
          setSession((curr) =>
            curr ? { ...curr, user: data.user! } : curr,
          );
        }
      },
    }),
    [session, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
