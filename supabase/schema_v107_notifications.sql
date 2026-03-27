-- v107: Push notification support

-- device_tokens: stores APNs/FCM device tokens per user
CREATE TABLE IF NOT EXISTS device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'ios',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own device tokens"
  ON device_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- pending_notifications: queue for server-side push dispatch (no direct client access)
CREATE TABLE IF NOT EXISTS pending_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL,
  device_token text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pending_notifications ENABLE ROW LEVEL SECURITY;
-- No client policies — only service role can read/write pending_notifications

-- Add notifications_enabled flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true;

-- Trigger: queue push notifications when a new message is inserted
CREATE OR REPLACE FUNCTION queue_message_notifications()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sender_name text;
  v_group_name text;
  v_member record;
  v_token record;
BEGIN
  -- Sender display name
  SELECT display_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Use group_month as the group identifier in the notification title
  v_group_name := NEW.group_month;

  -- Iterate over group members excluding the sender
  FOR v_member IN
    SELECT gm.user_id
    FROM group_members gm
    JOIN profiles p ON p.id = gm.user_id
    WHERE gm.group_key = NEW.group_month
      AND gm.user_id <> NEW.sender_id
      AND COALESCE(p.notifications_enabled, true) = true
      -- Exclude users who have blocked the sender or been blocked by them
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE (b.blocker_id = gm.user_id AND b.blocked_id = NEW.sender_id)
           OR (b.blocker_id = NEW.sender_id AND b.blocked_id = gm.user_id)
      )
  LOOP
    -- Insert a pending notification for each device token belonging to this recipient
    FOR v_token IN
      SELECT token FROM device_tokens WHERE user_id = v_member.user_id
    LOOP
      INSERT INTO pending_notifications (
        recipient_user_id,
        device_token,
        title,
        body,
        data
      ) VALUES (
        v_member.user_id,
        v_token.token,
        'New message in ' || v_group_name,
        v_sender_name || ': ' || LEFT(NEW.content, 100),
        jsonb_build_object('group_month', NEW.group_month, 'message_id', NEW.id)
      );
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_queue_message_notifications ON messages;
CREATE TRIGGER trg_queue_message_notifications
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION queue_message_notifications();
