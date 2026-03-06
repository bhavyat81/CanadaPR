'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import UserStatusModal from '@/components/UserStatusModal';
import { formatMonth } from '@/lib/months';

// Maximum number of messages to load per chat room
const MESSAGES_LIMIT = 100;
// Prefix used to identify locally-created optimistic messages before server confirmation
const OPTIMISTIC_PREFIX = 'optimistic-';

interface Message {
  id: string;
  group_month: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface ModalUser {
  display_name: string;
  application_status: string;
  pr_stream: string;
}

export default function ChatPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfile, setUserProfile] = useState<{ display_name: string } | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [modalUser, setModalUser] = useState<ModalUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const decodedMonth = decodeURIComponent(month);
  const displayMonth = formatMonth(decodedMonth);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
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
      .then(({ data }) => setUserProfile(data));
  }, [user]);

  // Load initial messages
  useEffect(() => {
    if (!user) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('group_month', decodedMonth)
        .order('created_at', { ascending: true })
        .limit(MESSAGES_LIMIT);

      setMessages(data || []);
      setLoadingMessages(false);
    };

    loadMessages();

    // Subscribe to new messages via Supabase Realtime
    const channel = supabase
      .channel(`messages:${decodedMonth}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_month=eq.${decodedMonth}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicating optimistically-added messages
            if (prev.some((m) => m.id === incoming.id)) return prev;
            // Replace the temporary optimistic message if it exists
            const withoutOptimistic = prev.filter((m) => !m.id.startsWith(OPTIMISTIC_PREFIX));
            return [...withoutOptimistic, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, decodedMonth]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!user || !userProfile) return;

    // Optimistically add message to state immediately
    const optimisticMessage: Message = {
      id: `${OPTIMISTIC_PREFIX}${Date.now()}`,
      group_month: decodedMonth,
      sender_id: user.id,
      sender_name: userProfile.display_name,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    await supabase.from('messages').insert({
      group_month: decodedMonth,
      sender_id: user.id,
      sender_name: userProfile.display_name,
      content,
    });
  };

  const handleClickUsername = async (senderId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, application_status, pr_stream')
      .eq('id', senderId)
      .single();

    if (error || !data) return;
    setModalUser(data as ModalUser);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Chat Header */}
      <div className="bg-white border-b px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              🇨🇦 {displayMonth} Chat
            </h1>
            <p className="text-sm text-gray-500">
              {decodedMonth} applicants group
            </p>
          </div>
          <button
            onClick={() => router.push('/groups')}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            ← Back to Groups
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {loadingMessages ? (
            <div className="text-center text-gray-500 py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-700">No messages yet</h3>
              <p className="text-gray-500 mt-2">Be the first to say hello to the {displayMonth} group!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                senderId={msg.sender_id}
                senderName={msg.sender_name}
                content={msg.content}
                createdAt={msg.created_at}
                isOwnMessage={msg.sender_id === user?.id}
                onClickUsername={handleClickUsername}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="max-w-4xl mx-auto w-full">
        {!userProfile ? (
          <div className="p-4 bg-yellow-50 border-t text-center text-yellow-800">
            Please{' '}
            <a href="/profile" className="font-medium underline">
              set up your profile
            </a>{' '}
            to send messages.
          </div>
        ) : (
          <ChatInput onSendMessage={handleSendMessage} />
        )}
      </div>

      {/* User Status Modal */}
      {modalUser && (
        <UserStatusModal
          displayName={modalUser.display_name}
          prStream={modalUser.pr_stream}
          applicationStatus={modalUser.application_status}
          onClose={() => setModalUser(null)}
        />
      )}
    </div>
  );
}
