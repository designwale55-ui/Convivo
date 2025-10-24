import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, role: 'listener' | 'artist') => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  spendCredits: (amount: number) => Promise<boolean>;
  updateLocalCredits: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, retryCount = 0): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        setProfile(data);
        return true;
      }

      if (error) {
        console.error('convivo:error: Failed to fetch profile', error);
        if (retryCount < 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retryCount + 1);
        }
      }
      return false;
    } catch (err) {
      console.error('convivo:error: Profile fetch exception', err);
      if (retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(userId, retryCount + 1);
      }
      return false;
    }
  };

  const createUserProfile = async (userId: string, email: string, role: 'listener' | 'artist') => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          role,
          credits_balance: 0,
          tier: role === 'artist' ? 'X' : null,
        })
        .select()
        .single();

      if (data && !error) {
        const { data: initResult, error: initError } = await supabase.rpc('init_user_credits', {
          p_user_id: userId
        });

        if (!initError && initResult) {
          await supabase.from('credit_transactions').insert({
            user_id: userId,
            transaction_type: 'signup-bonus',
            amount_credits: 100,
            amount_inr: 0,
          });
        }

        await fetchProfile(userId);
      }
    } catch (err) {
      console.error('convivo:error: Failed to create user profile', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, role: 'listener' | 'artist') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (data.user && !error) {
      await createUserProfile(data.user.id, email, role);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const spendCredits = async (amount: number): Promise<boolean> => {
    if (!user) {
      console.error('convivo:error: Cannot spend credits - no user');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('spend_credit', {
        p_user_id: user.id,
        p_amount: amount
      });

      if (error) {
        console.error('convivo:error: Credit deduction failed', error);
        return false;
      }

      if (data === true) {
        if (profile) {
          setProfile({
            ...profile,
            credits_balance: profile.credits_balance - amount
          });
        }
        await fetchProfile(user.id);
        return true;
      }

      return false;
    } catch (err) {
      console.error('convivo:error: Credit spending exception', err);
      return false;
    }
  };

  const updateLocalCredits = (newBalance: number) => {
    if (profile) {
      setProfile({
        ...profile,
        credits_balance: newBalance
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut, refreshProfile, spendCredits, updateLocalCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
