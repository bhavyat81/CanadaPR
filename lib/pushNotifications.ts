import { supabase } from '@/lib/supabase';
import { isNativeCapacitor } from '@/lib/capacitor';

let initialized = false;

export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase.from('push_tokens').upsert(
    { user_id: userId, token, platform: 'ios', updated_at: new Date().toISOString() },
    { onConflict: 'user_id,token' }
  );
  if (error) {
    console.error('Failed to save push token:', error);
  }
}

export async function initPushNotifications(userId: string): Promise<void> {
  if (initialized) return;
  if (!isNativeCapacitor()) return;
  initialized = true;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.log('Push notification permission not granted');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      savePushToken(userId, token.value);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received in foreground:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification tapped:', action);
    });
  } catch (err) {
    // Silently fail on web/SSR where the plugin is not available
    console.log('Push notifications not available:', err);
  }
}
