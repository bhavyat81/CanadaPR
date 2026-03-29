-- Trigger function that could be used with Supabase Edge Functions or webhooks
-- to send push notifications when new messages are inserted
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function marks the message for notification processing.
  -- A Supabase Edge Function or webhook should poll/listen for new messages
  -- and send APNs push notifications to group members.
  PERFORM pg_notify('new_message', json_build_object(
    'message_id', NEW.id,
    'group_month', NEW.group_month,
    'sender_id', NEW.sender_id,
    'sender_name', NEW.sender_name,
    'content', LEFT(NEW.content, 100)
  )::text);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();
