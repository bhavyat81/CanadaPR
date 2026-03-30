'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import UserProfileModal from '@/components/UserProfileModal';
import MembersPanel from '@/components/MembersPanel';
import { formatMonth } from '@/lib/months';
import { getCategoryShortLabel, buildGroupKey } from '@/lib/categories';

// Maximum number of messages to load per chat room
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

export default function CategoryChatPage({
  params,
}: {
  params: Promise<{ category: string; month: string }>;
}) {
  const { category, month } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [userProfile, setUserProfile] = useState<{ display_name: string } | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null); // null = loading
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const decodedCategory = decodeURIComponent(category);
  const decodedMonth = decodeURIComponent(month);

  // Combined group key using helper: "category:month" (e.g., "express-entry-fsw:2025-11")
  const groupKey = buildGroupKey(decodedCategory, decodedMonth);

  const displayMonth = formatMonth(decodedMonth);
  const categoryShort = getCategoryShortLabel(decodedCategory) ?? decodedCategory;

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load user profile
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

  // Check if current user is a member of this group and load members list
  useEffect(() => {
    if (!user) return;

    // Type for row returned by group_members joined with profiles
    interface GroupMemberRow {
      profiles: { id: string; display_name: string } | { id: string; display_name: string }[] | null;
    }

    const loadMembership = async () => {
      // Check if current user is a member
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('group_key', groupKey)
        .maybeSingle();

      setIsMember(!!membership);

      // Load all members of this group via group_members joined with profiles
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

  // Load initial messages
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

    // Subscribe to new messages via Supabase Realtime
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

  // Auto-scroll to bottom when messages change
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
      // Ignore duplicate key errors (23505) — user may have already joined; treat as success
      console.error('Failed to join group:', error);
      setJoiningGroup(false);
      return;
    }

    setIsMember(true);
    // Add current user to members list optimistically
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

    router.push(`/groups/category?cat=${encodeURIComponent(decodedCategory)}`);
  };

  const handleSendMessage = async (content: string) => {
    if (!user || !userProfile) return;

    // Optimistic update
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      group_month: groupKey,
      sender_id: user.id,
      sender_name: userProfile.display_name,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setSendError(null);

    const { error, data } = await supabase
      .from('messages')
      .insert({
        group_month: groupKey,
        sender_id: user.id,
        sender_name: userProfile.display_name,
        content,
      })
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      console.error('Failed to send message:', error);
      setSendError('Failed to send message. Please check your connection and try again.');
    } else if (data) {
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? data : m)));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* Chat Header */}
      <div className="bg-white border-b px-4 py-3 sm:py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
              🇨🇦 {displayMonth} Chat
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              {categoryShort} · {decodedMonth} applicants
            </p>
          </div>
          <MembersPanel members={members} />
          {isMember && (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              title="Leave group"
              className="text-gray-400 hover:text-red-500 transition-colors text-xl px-1"
            >
              🚪
            </button>
          )}
          <button
            onClick={() => router.push(`/groups/category?cat=${encodeURIComponent(decodedCategory)}`)}
            className="text-red-600 hover:text-red-700 font-medium text-sm whitespace-nowrap"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Leave Group Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Leave this group?</h2>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to leave this group? You can always rejoin later.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-3 sm:px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {loadingMessages ? (
            <div className="text-center text-gray-500 py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-700">No messages yet</h3>
              <p className="text-gray-500 mt-2">
                Be the first to say hello to the {displayMonth} {categoryShort} group!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                messageId={msg.id}
                senderId={msg.sender_id}
                senderName={msg.sender_name}
                content={msg.content}
                createdAt={msg.created_at}
                isOwnMessage={msg.sender_id === user?.id}
                onClickUsername={setSelectedUserId}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="max-w-4xl mx-auto w-full">
        {sendError && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{sendError}</span>
            <button
              onClick={() => setSendError(null)}
              className="ml-2 text-red-500 hover:text-red-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}
        {!userProfile ? (
          <div className="p-4 bg-yellow-50 border-t text-center text-yellow-800">
            Please{' '}
            <a href="/profile" className="font-medium underline">
              set up your profile
            </a>{' '}
            to send messages.
          </div>
        ) : isMember === false ? (
          <div className="p-4 bg-blue-50 border-t text-center text-blue-800">
            <p className="mb-2">Join this group to start chatting.</p>
            <button
              onClick={handleJoinGroup}
              disabled={joiningGroup}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {joiningGroup ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        ) : isMember === true ? (
          <ChatInput onSendMessage={handleSendMessage} />
        ) : (
          // isMember is null (still loading membership status)
          <div className="p-4 border-t text-center text-gray-400 text-sm">Checking membership...</div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={true}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
