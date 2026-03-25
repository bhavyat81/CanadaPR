-- Migration: v1.0.1 – Admin roles, message deletion, and group kick
-- Run this in Supabase SQL Editor

-- 1. Add role column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('creator_admin', 'admin', 'member'));

-- 2. Enable REPLICA IDENTITY FULL on messages so DELETE events carry the old row id
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 3. Set the creator/admin role for the designated account
UPDATE profiles
SET role = 'creator_admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'bhavyat81admin@gmail.com'
);

-- 4. RPC: Update a user's role (called by admins)
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  target_role TEXT;
BEGIN
  SELECT COALESCE(role, 'member') INTO caller_role FROM profiles WHERE id = auth.uid();
  SELECT COALESCE(role, 'member') INTO target_role FROM profiles WHERE id = target_user_id;

  IF caller_role NOT IN ('admin', 'creator_admin') THEN
    RAISE EXCEPTION 'insufficient_permissions';
  END IF;

  IF target_role = 'creator_admin' THEN
    RAISE EXCEPTION 'cannot_modify_creator';
  END IF;

  IF new_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$;

-- 5. RPC: Kick a user from a group (called by admins)
CREATE OR REPLACE FUNCTION kick_from_group(target_user_id UUID, group_key_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  target_role TEXT;
BEGIN
  SELECT COALESCE(role, 'member') INTO caller_role FROM profiles WHERE id = auth.uid();
  SELECT COALESCE(role, 'member') INTO target_role FROM profiles WHERE id = target_user_id;

  IF caller_role NOT IN ('admin', 'creator_admin') THEN
    RAISE EXCEPTION 'insufficient_permissions';
  END IF;

  IF target_role = 'creator_admin' THEN
    RAISE EXCEPTION 'cannot_kick_creator';
  END IF;

  DELETE FROM group_members
  WHERE user_id = target_user_id AND group_key = group_key_param;
END;
$$;

-- 6. RPC: Delete a message (called by admins)
CREATE OR REPLACE FUNCTION admin_delete_message(message_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT COALESCE(role, 'member') INTO caller_role FROM profiles WHERE id = auth.uid();

  IF caller_role NOT IN ('admin', 'creator_admin') THEN
    RAISE EXCEPTION 'insufficient_permissions';
  END IF;

  DELETE FROM messages WHERE id = message_id_param;
END;
$$;
