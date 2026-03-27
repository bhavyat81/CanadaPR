-- Schema v1.0.6: Pinned Messages
-- Creates the pinned_messages table with RLS policies

create table if not exists public.pinned_messages (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  room_key text not null,
  pinned_by uuid not null references auth.users(id) on delete cascade,
  pinned_at timestamptz not null default now(),
  message_content text not null,
  sender_name text not null,
  sender_id text not null
);

-- Indexes for common queries
create index if not exists pinned_messages_room_key_idx on public.pinned_messages (room_key);
create index if not exists pinned_messages_message_id_idx on public.pinned_messages (message_id);

-- Enable RLS
alter table public.pinned_messages enable row level security;

-- Public read: any authenticated user can read pinned messages
create policy "pinned_messages_read"
  on public.pinned_messages
  for select
  to authenticated
  using (true);

-- Authenticated insert: only admins/creator pin messages (enforced at app layer)
create policy "pinned_messages_insert"
  on public.pinned_messages
  for insert
  to authenticated
  with check (auth.uid() = pinned_by);

-- Delete: only the user who pinned the message can unpin it
create policy "pinned_messages_delete"
  on public.pinned_messages
  for delete
  to authenticated
  using (auth.uid() = pinned_by);
