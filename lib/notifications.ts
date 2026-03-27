import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

async function getPushNotificationsPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  return PushNotifications;
}

async function getLocalNotificationsPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

export async function registerForPush(): Promise<string | null> {
  const PushNotifications = await getPushNotificationsPlugin();
  if (!PushNotifications) return null;

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return null;

  // Remove any previous listeners to avoid duplicates across repeated calls
  await PushNotifications.removeAllListeners();

  await PushNotifications.register();

  return new Promise((resolve) => {
    PushNotifications.addListener('registration', (token) => {
      resolve(token.value);
    });
    PushNotifications.addListener('registrationError', () => {
      resolve(null);
    });
  });
}

export async function saveDeviceToken(userId: string, token: string): Promise<void> {
  await supabase.from('device_tokens').upsert(
    {
      user_id: userId,
      token,
      platform: 'ios',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,token' }
  );
}

export async function removeDeviceToken(userId: string): Promise<void> {
  await supabase.from('device_tokens').delete().eq('user_id', userId);
}

export async function initPushNotifications(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const token = await registerForPush();
  if (token) {
    await saveDeviceToken(userId, token);
  }
}

export interface LocalNotificationOptions {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function showLocalNotification(opts: LocalNotificationOptions): Promise<void> {
  const LocalNotifications = await getLocalNotificationsPlugin();
  if (!LocalNotifications) return;

  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') return;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now(),
        title: opts.title,
        body: opts.body,
        extra: opts.data ?? {},
      },
    ],
  });
}
