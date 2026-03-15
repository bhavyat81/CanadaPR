'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import UserProfileModal from '@/components/UserProfileModal';
import MembersPanel from '@/components/MembersPanel';
import { formatMonth } from '@/lib/months';
import { getCategoryShortLabel, buildGroupKey } from '@/lib/categories';

const MESSAGES_LIMIT = 100;

interface Message {
  id: string;
  group_month: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface Member {
  id: string;
  display_name: string;
}

export default function CategoryChat({
  category,
  month,
}: {
  category: string;
  month: string;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [userProfile, setUserProfile] = useState<{ display_name: string } | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const decodedCategory = decodeURIComponent(category);
  const decodedMonth = decodeURIComponent(month);

  const groupKey = buildGroupKey(decodedCategory, decodedMonth);

  const displayMonth = formatMonth(decodedMonth);
  const categoryShort = getCategoryShortLabel(decodedCategory) ?? decodedCategory;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load profile:', error);
          return;
        }
        setUserProfile(data);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    interface GroupMemberRow {
      profiles: { id: string; display_name: string } | { id: string; display_name: string }[] | null;
    }

    const loadMembership = async () => {
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('group_key', groupKey)
        .maybeSingle();

      setIsMember(!!membership);

      const { data: groupMemberRows } = await supabase
        .from('group_members')
        .select('profiles(id, display_name)')
        .eq('group_key', groupKey);

      if (groupMemberRows) {
        const memberList: Member[] = (groupMemberRows as GroupMemberRow[])
          .flatMap((row) => {
            const p = row.profiles;
            if (!p) return [];
            return Array.isArray(p) ? p : [p];
          })
          .filter((p): p is Member => !!p && !!p.display_name);
        setMembers(memberList);
      }
    };

    loadMembership();
  }, [user, groupKey]);

  useEffect(() => {
    if (!user) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('group_month', groupKey)
        .order('created_at', { ascending: true })
        .limit(MESSAGES_LIMIT);

      setMessages(data || []);
      setLoadingMessages(false);
    };

    loadMessages();

    const channel = supabase
      .channel(`messages:${groupKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_month=eq.${groupKey}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groupKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoinGroup = async () => {
    if (!user || joiningGroup) return;
    setJoiningGroup(true);

    const { error } = await supabase
      .from('group_members')
      .insert({ user_id: user.id, group_key: groupKey });

    if (error && error.code !== '23505') {
      console.error('Failed to join group:', error);
      setJoiningGroup(false);
      return;
    }

    setIsMember(true);
    if (userProfile) {
      setMembers((prev) => {
        if (prev.some((m) => m.id === user.id)) return prev;
        return [...prev, { id: user.id, display_name: userProfile.display_name }];
      });
    }
    setJoiningGroup(false);
  };

  const handleLeaveGroup = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', user.id)
      .eq('group_key', groupKey);

    if (error) {
      console.error('Failed to leave group:', error);
      return;
    }

    router.push(`/groups/${decodedCategory}`);
  };

  // TODO: paste the rest of your existing file from "handleSendMessage" onward if needed
  // For now we just render a minimal placeholder to keep compilation obvious.
  return (
    <div style={{ padding: 16 }}>
      <h1>{categoryShort} — {displayMonth}</h1>
      <p>Chat UI continues here (we need to paste the remainder of the original page.tsx).</p>
      <div ref={messagesEndRef} />
    </div>
  );
}
