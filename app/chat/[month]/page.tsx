'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import UserProfileModal from '@/components/UserProfileModal';
import { formatMonth } from '@/lib/months';

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

export default function ChatPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfile, setUserProfile] = useState<{ display_name: string } | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load profile:', error);
          return;
        }
        setUserProfile(data);
      });
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
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicating our own optimistic messages
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
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

    // Optimistic update — show message immediately
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      group_month: decodedMonth,
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
        group_month: decodedMonth,
        sender_id: user.id,
        sender_name: userProfile.display_name,
        content,
      })
      .select()
      .single();

    if (error) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      console.error('Failed to send message:', error);
      setSendError('Failed to send message. Please check your connection and try again.');
    } else if (data) {
      // Replace optimistic message with real one
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
              🇨🇦 {displayMonth} Chat
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              {decodedMonth} applicants group
            </p>
          </div>
          <button
            onClick={() => router.push('/groups')}
            className="text-red-600 hover:text-red-700 font-medium text-sm ml-2 whitespace-nowrap"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-3 sm:px-4 py-4">
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
            <button onClick={() => setSendError(null)} className="ml-2 text-red-500 hover:text-red-700 font-bold">✕</button>
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
        ) : (
          <ChatInput onSendMessage={handleSendMessage} />
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