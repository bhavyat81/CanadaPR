-- Pinned Messages Schema for v1.1.2
-- Allows admin users to pin important messages in a chat room

CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT NOT NULL,
  room_key TEXT NOT NULL,
  pinned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  message_content TEXT,
  sender_name TEXT,
  sender_id UUID,
  UNIQUE(message_id, room_key)
);

-- RLS policies for pinned_messages
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can view pinned messages
CREATE POLICY "Anyone can view pinned messages" ON pinned_messages
  FOR SELECT USING (true);

-- Only admins can insert pinned messages (enforced at app level via role check)
CREATE POLICY "Authenticated users can pin messages" ON pinned_messages
  FOR INSERT WITH CHECK (auth.uid() = pinned_by);

-- Only the pinner (admin) can unpin
CREATE POLICY "Pinners can delete pinned messages" ON pinned_messages
  FOR DELETE USING (auth.uid() = pinned_by);
