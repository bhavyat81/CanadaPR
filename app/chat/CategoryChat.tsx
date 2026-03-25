'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import UserProfileModal from '@/components/UserProfileModal';
import MembersPanel from '@/components/MembersPanel';
import TermsAcceptanceModal from '@/components/TermsAcceptanceModal';
import MessageActionSheet from '@/components/MessageActionSheet';
import ReportModal from '@/components/ReportModal';
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

  // UGC safety state
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const blockedIdsRef = useRef<Set<string>>(new Set());
  const [actionSheet, setActionSheet] = useState<{
    messageId: string;
    senderId: string;
    content: string;
  } | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    messageId: string;
    senderId: string;
    content: string;
  } | null>(null);

  const decodedCategory = decodeURIComponent(category);
  const decodedMonth = decodeURIComponent(month);

  const groupKey = buildGroupKey(decodedCategory, decodedMonth);

  const displayMonth = formatMonth(decodedMonth);
  const categoryShort = getCategoryShortLabel(decodedCategory) ?? decodedCategory;

  // Keep ref in sync with state so realtime callbacks always use latest blocked IDs
  useEffect(() => {
    blockedIdsRef.current = blockedIds;
  }, [blockedIds]);

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

  // Check if user has accepted terms
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('terms_accepted_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setTermsAccepted(!!data?.terms_accepted_at);
      });
  }, [user]);

  // Load blocked user IDs
  useEffect(() => {
    if (!user) return;
    supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id)
      .then(({ data }) => {
        if (data) {
          const ids = new Set(data.map((b: { blocked_id: string }) => b.blocked_id));
          setBlockedIds(ids);
          blockedIdsRef.current = ids;
        }
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
            // Filter out messages from blocked users (use ref to avoid stale closure)
            if (blockedIdsRef.current.has(newMsg.sender_id)) return prev;
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

    router.push(`/groups/category?cat=${encodeURIComponent(decodedCategory)}`);
  };

  const handleBlockUserFromActionSheet = async () => {
    if (!user || !actionSheet) return;
    const targetId = actionSheet.senderId;
    setActionSheet(null);

    const { error: blockError } = await supabase.from('blocks').insert({
      blocker_id: user.id,
      blocked_id: targetId,
    });

    if (blockError && blockError.code !== '23505') {
      console.error('Failed to block user:', blockError);
      return;
    }

    // Notify developer via a report entry
    await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: targetId,
      message_id: actionSheet.messageId,
      message_content: actionSheet.content,
      reason: 'User blocked',
      group_month: groupKey,
      status: 'pending',
    });

    setBlockedIds((prev) => new Set([...prev, targetId]));
    // Remove blocked user's messages immediately
    setMessages((prev) => prev.filter((m) => m.sender_id !== targetId));
  };

  const handleSendMessage = async (content: string) => {
    if (!user || !userProfile) return;

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

  if (authLoading || termsAccepted === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show terms acceptance modal before first chat access
  if (termsAccepted === false && user) {
    return (
      <TermsAcceptanceModal
        userId={user.id}
        onAccepted={() => setTermsAccepted(true)}
      />
    );
  }

  const visibleMessages = messages.filter((m) => !blockedIds.has(m.sender_id));

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
          ) : visibleMessages.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-700">No messages yet</h3>
              <p className="text-gray-500 mt-2">
                Be the first to say hello to the {displayMonth} {categoryShort} group!
              </p>
            </div>
          ) : (
            visibleMessages.map((msg) => (
              <ChatMessage
                key={msg.id}
                messageId={msg.id}
                senderId={msg.sender_id}
                senderName={msg.sender_name}
                content={msg.content}
                createdAt={msg.created_at}
                isOwnMessage={msg.sender_id === user?.id}
                onClickUsername={setSelectedUserId}
                onLongPress={(messageId, senderId, content) =>
                  setActionSheet({ messageId, senderId, content })
                }
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
          <div className="p-4 border-t text-center text-gray-400 text-sm">Checking membership...</div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={true}
          onClose={() => setSelectedUserId(null)}
          currentUserId={user?.id}
          onBlockUser={(blockedId) => {
            setBlockedIds((prev) => new Set([...prev, blockedId]));
            setMessages((prev) => prev.filter((m) => m.sender_id !== blockedId));
          }}
        />
      )}

      {/* Message Action Sheet (long-press) */}
      {actionSheet && (
        <MessageActionSheet
          isOwnMessage={actionSheet.senderId === user?.id}
          onReport={() => {
            setReportTarget(actionSheet);
            setActionSheet(null);
          }}
          onBlock={handleBlockUserFromActionSheet}
          onClose={() => setActionSheet(null)}
        />
      )}

      {/* Report Modal */}
      {reportTarget && user && (
        <ReportModal
          reporterId={user.id}
          reportedUserId={reportTarget.senderId}
          messageId={reportTarget.messageId}
          messageContent={reportTarget.content}
          groupMonth={groupKey}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
