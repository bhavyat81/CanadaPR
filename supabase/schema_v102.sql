-- Migration: v1.02 – Group membership (join/leave)

CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  group_key TEXT NOT NULL,  -- e.g., "express-entry-fsw:2025-03"
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_key)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all group members"
  ON group_members FOR SELECT USING (true);

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Note: existing messages from v1.0 may use old group_month keys like "2025-03" without a category prefix.
-- Admins can migrate them manually with:
-- UPDATE messages SET group_month = 'non-express-entry:' || group_month WHERE group_month NOT LIKE '%:%';
