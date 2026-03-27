'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
const loadNotifications = () => import('@/lib/notifications');

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
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      userRef.current = session?.user ?? null;
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          userRef.current = session.user;
          try {
            const { initPushNotifications } = await loadNotifications();
            await initPushNotifications(session.user.id);
          } catch (err) {
            console.error('Failed to initialize push notifications:', err);
          }
        } else if (event === 'SIGNED_OUT') {
          const previousUser = userRef.current;
          userRef.current = null;
          if (previousUser) {
            try {
              const { removeDeviceToken } = await loadNotifications();
              await removeDeviceToken(previousUser.id);
            } catch (err) {
              console.error('Failed to remove device token:', err);
            }
          }
        }
      }
    );

    // Handle Capacitor app resume — refresh the expired session
    let unmounted = false;
    let appStateCleanup: (() => void) | undefined;

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { App } = await import('@capacitor/app');
          const listener = await App.addListener('appStateChange', async ({ isActive }) => {
            if (isActive) {
              await supabase.auth.startAutoRefresh();
            } else {
              await supabase.auth.stopAutoRefresh();
            }
          });
          if (unmounted) {
            listener.remove();
          } else {
            appStateCleanup = () => listener.remove();
          }
        }
      } catch {
        // Not running in Capacitor — ignore
      }
    })();

    return () => {
      unmounted = true;
      subscription.unsubscribe();
      appStateCleanup?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
