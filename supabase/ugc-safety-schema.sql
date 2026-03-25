-- UGC Safety Schema for Apple App Store Guideline 1.2 Compliance
-- Developer monitors the reports table and acts within 24 hours by removing
-- offending content and ejecting the user who provided it via the Supabase dashboard.

-- Reports table for flagged content
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID NOT NULL,
  message_id TEXT,
  message_content TEXT,
  reason TEXT NOT NULL,
  group_month TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Add terms_accepted_at to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- RLS policies for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- RLS policies for blocks
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own blocks" ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can view their own blocks" ON blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can delete their own blocks" ON blocks FOR DELETE USING (auth.uid() = blocker_id);
