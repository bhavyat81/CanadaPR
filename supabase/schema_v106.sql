-- Migration v1.06: Push notifications support
-- Adds device_tokens table, pending_notifications table,
-- notifications_enabled column on profiles, and a DB trigger
-- that queues a notification payload when a new message is inserted.

-- ============================================================
-- 1. device_tokens table
-- ============================================================
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'ios',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, token)
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own device tokens"
  ON device_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. pending_notifications table
-- Stores notifications queued by the DB trigger.
-- A separate worker (Edge Function or external service) reads
-- this table and delivers them via APNs.
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_token TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE pending_notifications ENABLE ROW LEVEL SECURITY;

-- Only service-role / internal functions should read/write this table.
-- No direct client access is needed.
CREATE POLICY "No direct client access to pending_notifications"
  ON pending_notifications
  FOR ALL
  USING (false);

-- ============================================================
-- 3. Add notifications_enabled to profiles
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;

-- ============================================================
-- 4. DB function: queue notifications when a new message arrives
-- ============================================================
CREATE OR REPLACE FUNCTION queue_message_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_name TEXT;
  v_sender_name TEXT;
  v_body TEXT;
  v_recipient RECORD;
BEGIN
  -- Build a human-readable group label from group_month (e.g. "2024-03_Express_Entry")
  v_group_name := REPLACE(NEW.group_month, '_', ' ');

  -- Sender display name
  v_sender_name := NEW.sender_name;

  -- Notification body: "SenderName: first 80 chars of message"
  v_body := v_sender_name || ': ' || LEFT(NEW.content, 80);

  -- Iterate over members of this group who:
  --   a) are not the sender
  --   b) have notifications enabled (or the column is NULL, treated as enabled)
  --   c) are not blocked by the sender
  --   d) have at least one device token
  FOR v_recipient IN
    SELECT
      gm.user_id,
      dt.token,
      dt.platform
    FROM group_members gm
    JOIN device_tokens dt ON dt.user_id = gm.user_id
    JOIN profiles p ON p.id = gm.user_id
    WHERE gm.group_key = NEW.group_month
      AND gm.user_id <> NEW.sender_id
      AND (p.notifications_enabled IS TRUE OR p.notifications_enabled IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE b.blocker_id = gm.user_id
          AND b.blocked_id = NEW.sender_id
      )
  LOOP
    INSERT INTO pending_notifications
      (recipient_user_id, device_token, title, body, data)
    VALUES (
      v_recipient.user_id,
      v_recipient.token,
      v_group_name,
      v_body,
      jsonb_build_object(
        'message_id', NEW.id,
        'group_month', NEW.group_month,
        'sender_id', NEW.sender_id
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Drop trigger if it already exists (idempotent migration)
DROP TRIGGER IF EXISTS on_new_message_queue_notifications ON messages;

CREATE TRIGGER on_new_message_queue_notifications
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION queue_message_notifications();

-- ============================================================
-- NOTE: To deliver APNs push notifications in production you
-- need to configure an APNs key in the Apple Developer Portal
-- and set up a Supabase Edge Function (or external cron) that
-- reads from `pending_notifications` (sent = false), calls the
-- APNs API with the device token and payload, then marks the
-- row as sent = true.
-- ============================================================
