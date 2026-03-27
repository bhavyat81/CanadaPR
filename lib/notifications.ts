'use client';

import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

// Lazily import native plugins so the web build is not broken
async function getPushNotifications() {
  const { PushNotifications } = await import('@capacitor/push-notifications');
  return PushNotifications;
}

async function getLocalNotifications() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

/** Request push notification permission from the OS. Returns true if granted. */
export async function requestPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const PushNotifications = await getPushNotifications();
    const result = await PushNotifications.requestPermissions();
    return result.receive === 'granted';
  } catch (err) {
    console.error('[notifications] requestPermission error:', err);
    return false;
  }
}

/**
 * Register this device with APNs/FCM and return the device token.
 * Resolves with the token string, or null on failure.
 */
export async function registerForPush(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const PushNotifications = await getPushNotifications();

    return new Promise((resolve) => {
      const cleanup = () => {
        PushNotifications.removeAllListeners().catch(() => {/* best-effort */});
      };

      PushNotifications.addListener('registration', (token) => {
        cleanup();
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('[notifications] APNs registration error:', err);
        cleanup();
        resolve(null);
      });

      PushNotifications.register();
    });
  } catch (err) {
    console.error('[notifications] registerForPush error:', err);
    return null;
  }
}

/** Save the device token to the `device_tokens` Supabase table. */
export async function saveDeviceToken(userId: string, token: string): Promise<void> {
  const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
  const { error } = await supabase.from('device_tokens').upsert(
    {
      user_id: userId,
      token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,token' }
  );
  if (error) {
    console.error('[notifications] saveDeviceToken error:', error);
  }
}

/** Remove ALL device tokens for this user (call on logout). */
export async function removeDeviceToken(userId: string): Promise<void> {
  const { error } = await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', userId);
  if (error) {
    console.error('[notifications] removeDeviceToken error:', error);
  }
}

/**
 * Full push registration flow:
 *  1. request permission
 *  2. get device token
 *  3. save to Supabase
 */
export async function initPushNotifications(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const granted = await requestPermission();
  if (!granted) return;

  const token = await registerForPush();
  if (!token) return;

  await saveDeviceToken(userId, token);
}

/** Show an in-app local notification (when app is open but user is in a different chat room). */
export async function showLocalNotification(options: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const LocalNotifications = await getLocalNotifications();
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title: options.title,
          body: options.body,
          extra: options.data ?? {},
          sound: 'default',
        },
      ],
    });
  } catch (err) {
    console.error('[notifications] showLocalNotification error:', err);
  }
}
