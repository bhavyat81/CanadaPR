import { createClient } from '@supabase/supabase-js';
import { isNativeCapacitor } from './capacitor';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ MISSING SUPABASE CREDENTIALS — NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set at build time. Auth and data calls will fail.'
  );
}

/**
 * On native Capacitor (iOS/Android) we use @capacitor/preferences for auth
 * session storage to avoid the WKWebView localStorage + Web Locks deadlock
 * that causes "Lock was not released within 5000ms" errors.
 *
 * On web, we fall back to localStorage.
 */

// Lazy-loaded Preferences reference (only on native)
let _preferences: typeof import('@capacitor/preferences').Preferences | null = null;
let _preferencesLoaded = false;

// Eagerly kick off the dynamic import on native platforms
if (typeof window !== 'undefined' && isNativeCapacitor()) {
  import('@capacitor/preferences')
    .then(({ Preferences }) => {
      _preferences = Preferences;
      _preferencesLoaded = true;
    })
    .catch((err) => {
      console.warn('Failed to load @capacitor/preferences, falling back to localStorage:', err);
      _preferencesLoaded = true; // mark loaded even on failure so we fall back
    });
}

async function waitForPreferences(): Promise<void> {
  if (_preferencesLoaded) return;
  await new Promise<void>((resolve) => {
    const check = () => {
      if (_preferencesLoaded) return resolve();
      setTimeout(check, 10);
    };
    check();
  });
}

const capacitorStorage = {
  getItem: async (key: string): Promise<string | null> => {
    await waitForPreferences();
    if (_preferences) {
      const { value } = await _preferences.get({ key });
      return value;
    }
    try { return window.localStorage.getItem(key); }
    catch { return null; }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await waitForPreferences();
    if (_preferences) {
      await _preferences.set({ key, value });
      return;
    }
    try { window.localStorage.setItem(key, value); }
    catch { /* ignore */ }
  },
  removeItem: async (key: string): Promise<void> => {
    await waitForPreferences();
    if (_preferences) {
      await _preferences.remove({ key });
      return;
    }
    try { window.localStorage.removeItem(key); }
    catch { /* ignore */ }
  },
};

// Determine storage: use capacitorStorage on native, localStorage on web
const authStorage = typeof window !== 'undefined' && isNativeCapacitor()
  ? capacitorStorage
  : typeof window !== 'undefined'
    ? window.localStorage
    : undefined;

/**
 * On native Capacitor (iOS/Android) the Supabase gotrue-js Web Lock mechanism
 * deadlocks when combined with async @capacitor/preferences storage because
 * the lock acquisition blocks the async microtask queue in WKWebView.
 * The no-op lock bypasses this by calling the callback directly — safe here
 * because native mobile apps are single-tab so concurrent session access is
 * not a concern. See: https://github.com/supabase/gotrue-js/issues/325
 */
// Parameters match the Supabase lock interface: (name, acquireTimeout, fn) => Promise<T>.
// The name and acquireTimeout args are intentionally unused — the no-op skips locking entirely.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noOpLock = async <T>(_name: string, _acquireTimeout: number, fn: () => Promise<T>): Promise<T> => fn();

const isNative = typeof window !== 'undefined' && isNativeCapacitor();

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      storageKey: 'canadapr-auth',
      storage: authStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Disable Web Locks on native Capacitor to prevent deadlock with async storage
      ...(isNative ? { lock: noOpLock } : {}),
    },
  }
);
