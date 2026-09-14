import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type Tier = 'free' | 'pro';

interface UserContextValue {
  tier: Tier;
  user: any | null;
  loading: boolean;
  // Refreshes the tier from the database — call after a payment webhook confirms
  // a subscription change. Tier writes are server-only (see 02_security_hardening.sql).
  refreshTier: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<any | null>(null);
  const [tier,    setTier]    = useState<Tier>('free');
  const [loading, setLoading] = useState(true);

  const fetchProfileTier = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', userId)
        .single();
      setTier((data?.tier as Tier) ?? 'free');
    } catch {
      setTier('free');
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          await fetchProfileTier(session.user.id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      if (session) {
        setUser(session.user);
        await fetchProfileTier(session.user.id);
      } else {
        setUser(null);
        setTier('free');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-queries the profile row to sync tier after a server-side subscription change.
  const refreshTier = async () => {
    if (user?.id) await fetchProfileTier(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <UserContext.Provider value={{ tier, user, loading, refreshTier, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
