'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { initPushNotifications, removeDeviceToken } from '@/lib/notifications';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Track the current user in a ref so auth-change callbacks always have the
  // latest value without needing to re-subscribe.
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);
      userRef.current = u;
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const prevUser = userRef.current;
        const nextUser = session?.user ?? null;
        setSession(session);
        setUser(nextUser);
        userRef.current = nextUser;
        setLoading(false);

        if (event === 'SIGNED_IN' && nextUser) {
          // Register for push notifications after login
          initPushNotifications(nextUser.id).catch((err) =>
            console.error('[AuthProvider] push registration error:', err)
          );
        }

        if (event === 'SIGNED_OUT' && prevUser) {
          removeDeviceToken(prevUser.id).catch((err) =>
            console.error('[AuthProvider] removeDeviceToken error:', err)
          );
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
