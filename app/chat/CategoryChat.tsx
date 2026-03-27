'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import UserProfileModal from '@/components/UserProfileModal';
import MembersPanel from '@/components/MembersPanel';
import TermsAcceptanceModal from '@/components/TermsAcceptanceModal';
import MessageActionSheet from '@/components/MessageActionSheet';
import AdminActionSheet from '@/components/AdminActionSheet';
import ReportModal from '@/components/ReportModal';
import { formatMonth } from '@/lib/months';
import { getCategoryShortLabel, buildGroupKey } from '@/lib/categories';

const MESSAGES_LIMIT = 100;
const CREATOR_EMAIL = 'bhavyat81admin@gmail.com';
const EDIT_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

interface PinnedMessage {
  id: string;
  message_id: string;
  room_key: string;
  pinned_by: string;
  pinned_at: string;
  message_content: string;
  sender_name: string;
  sender_id: string;
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

  // Admin roles state
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');
  const [senderRoles, setSenderRoles] = useState<Record<string, string>>({});
  const [adminActionTarget, setAdminActionTarget] = useState<{
    userId: string;
    userName: string;
    userRole: string;
  } | null>(null);
  const loadedSenderIdsRef = useRef<Set<string>>(new Set());

  // UGC safety state
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const blockedIdsRef = useRef<Set<string>>(new Set());
  const [actionSheet, setActionSheet] = useState<{
    messageId: string;
    senderId: string;
    content: string;
    createdAt: string;
  } | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    messageId: string;
    senderId: string;
    content: string;
  } | null>(null);
  // Edit mode for own messages
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pinned messages state
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);

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

  // Load current user's role (creator is identified by email as a safety net)
  useEffect(() => {
    if (!user) return;
    if (user.email === CREATOR_EMAIL) {
      setCurrentUserRole('creator_admin');
      return;
    }
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setCurrentUserRole(data?.role ?? 'member');
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

  // Load pinned messages for this room
  useEffect(() => {
    if (!user) return;
    supabase
      .from('pinned_messages')
      .select('*')
      .eq('room_key', groupKey)
      .order('pinned_at', { ascending: false })
      .then(({ data }) => {
        if (data) setPinnedMessages(data as PinnedMessage[]);
      });
  }, [user, groupKey]);

  // Close search on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Load roles for a list of sender IDs (skips already-loaded ones)
  const loadSenderRoles = useCallback(async (senderIds: string[]) => {
    const unloaded = senderIds.filter((id) => !loadedSenderIdsRef.current.has(id));
    if (unloaded.length === 0) return;
    unloaded.forEach((id) => loadedSenderIdsRef.current.add(id));

    const { data } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', unloaded);

    if (data) {
      setSenderRoles((prev) => {
        const next = { ...prev };
        (data as Array<{ id: string; role: string | null }>).forEach((p) => {
          next[p.id] = p.role ?? 'member';
        });
        return next;
      });
    }
  }, []);

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

      const msgs = data || [];
      setMessages(msgs);
      setLoadingMessages(false);

      // Load roles for all unique senders (fire-and-forget so messages render immediately)
      const uniqueIds = [...new Set(msgs.map((m: Message) => m.sender_id))];
      if (uniqueIds.length > 0) {
        loadSenderRoles(uniqueIds);
      }
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
          // Load role for new sender if not yet cached
          loadSenderRoles([newMsg.sender_id]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `group_month=eq.${groupKey}`,
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? { ...m, content: updatedMsg.content } : m))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `group_month=eq.${groupKey}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id?: string }).id;
          if (deletedId) {
            setMessages((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groupKey, loadSenderRoles]);

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

  // Admin: delete a specific message
  const handleAdminDeleteMessage = async (messageId: string) => {
    setActionSheet(null);
    const { error } = await supabase.rpc('admin_delete_message', {
      message_id_param: messageId,
    });
    if (error) {
      console.error('Failed to delete message:', error);
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  // Member: delete their own message (only within 24 hours)
  const handleDeleteOwnMessage = async (messageId: string) => {
    if (!user) return;
    setActionSheet(null);
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id);
    if (error) {
      console.error('Failed to delete own message:', error);
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  // Member: update their own message content (only within 24 hours)
  const handleUpdateOwnMessage = async (content: string) => {
    if (!user || !editingMessage) return;
    const messageId = editingMessage.id;
    setEditingMessage(null);
    const { error } = await supabase
      .from('messages')
      .update({ content })
      .eq('id', messageId)
      .eq('sender_id', user.id);
    if (error) {
      console.error('Failed to edit own message:', error);
      return;
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, content } : m))
    );
  };

  // Admin: kick a user from this group
  const handleKickMember = async (targetUserId: string) => {
    setAdminActionTarget(null);
    const { error } = await supabase.rpc('kick_from_group', {
      target_user_id: targetUserId,
      group_key_param: groupKey,
    });
    if (error) {
      console.error('Failed to kick user:', error);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== targetUserId));
  };

  // Admin: promote a user to admin role
  const handlePromoteToAdmin = async (targetUserId: string) => {
    setAdminActionTarget(null);
    const { error } = await supabase.rpc('update_user_role', {
      target_user_id: targetUserId,
      new_role: 'admin',
    });
    if (error) {
      console.error('Failed to promote user:', error);
      return;
    }
    setSenderRoles((prev) => ({ ...prev, [targetUserId]: 'admin' }));
  };

  // Admin: demote a user to member role
  const handleDemoteToMember = async (targetUserId: string) => {
    setAdminActionTarget(null);
    const { error } = await supabase.rpc('update_user_role', {
      target_user_id: targetUserId,
      new_role: 'member',
    });
    if (error) {
      console.error('Failed to demote user:', error);
      return;
    }
    setSenderRoles((prev) => ({ ...prev, [targetUserId]: 'member' }));
  };

  // Admin: pin a message
  const handlePinMessage = async () => {
    if (!user || !actionSheet) return;
    const { messageId, content, senderId } = actionSheet;
    const senderName = messages.find((m) => m.id === messageId)?.sender_name ?? '';
    setActionSheet(null);
    const { error, data } = await supabase
      .from('pinned_messages')
      .insert({
        message_id: messageId,
        room_key: groupKey,
        pinned_by: user.id,
        message_content: content,
        sender_name: senderName,
        sender_id: senderId,
      })
      .select()
      .single();
    if (error) {
      console.error('Failed to pin message:', error);
      return;
    }
    if (data) setPinnedMessages((prev) => [data as PinnedMessage, ...prev]);
  };

  // Admin: unpin a message
  const handleUnpinMessage = async (pinnedMessageId: string) => {
    const { error } = await supabase
      .from('pinned_messages')
      .delete()
      .eq('id', pinnedMessageId);
    if (error) {
      console.error('Failed to unpin message:', error);
      return;
    }
    setPinnedMessages((prev) => prev.filter((p) => p.id !== pinnedMessageId));
  };

  // Admin: unpin via action sheet
  const handleUnpinFromActionSheet = async () => {
    if (!actionSheet) return;
    const pinned = pinnedMessages.find((p) => p.message_id === actionSheet.messageId);
    setActionSheet(null);
    if (pinned) await handleUnpinMessage(pinned.id);
  };

  const handleSendMessage = async (content: string) => {
    // If in edit mode, route to update handler instead
    if (editingMessage) {
      await handleUpdateOwnMessage(content);
      return;
    }

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
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'creator_admin';

  // Search filtering
  const searchTrimmed = searchQuery.trim().toLowerCase();
  const searchFilteredMessages = searchTrimmed
    ? visibleMessages.filter((m) => m.content.toLowerCase().includes(searchTrimmed))
    : visibleMessages;
  const displayMessages = searchOpen ? searchFilteredMessages : visibleMessages;
  const pinnedMessageIds = new Set(pinnedMessages.map((p) => p.message_id));

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
          {/* Pinned messages button */}
          <button
            onClick={() => setShowPinnedPanel(true)}
            title="View pinned messages"
            className="text-gray-400 hover:text-yellow-500 transition-colors text-xl px-1"
          >
            📌
          </button>
          {/* Search button */}
          <button
            onClick={() => {
              setSearchOpen((prev) => {
                if (!prev) setTimeout(() => searchInputRef.current?.focus(), 50);
                return !prev;
              });
              setSearchQuery('');
            }}
            title="Search messages"
            className="text-gray-400 hover:text-red-500 transition-colors px-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
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

        {/* Search bar (shown when search is open) */}
        {searchOpen && (
          <div className="max-w-4xl mx-auto mt-2">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400"
              />
              {searchQuery && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {searchFilteredMessages.length} result{searchFilteredMessages.length !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
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
          ) : searchOpen && searchTrimmed && displayMessages.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-700">No messages found</h3>
              <p className="text-gray-500 mt-2">No messages match &ldquo;{searchQuery}&rdquo;</p>
            </div>
          ) : !searchOpen && visibleMessages.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-700">No messages yet</h3>
              <p className="text-gray-500 mt-2">
                Be the first to say hello to the {displayMonth} {categoryShort} group!
              </p>
            </div>
          ) : (
            displayMessages.map((msg) => (
              <ChatMessage
                key={msg.id}
                messageId={msg.id}
                senderId={msg.sender_id}
                senderName={msg.sender_name}
                senderRole={
                  msg.sender_id === user?.id
                    ? currentUserRole
                    : (senderRoles[msg.sender_id] ?? 'member')
                }
                content={msg.content}
                createdAt={msg.created_at}
                isOwnMessage={msg.sender_id === user?.id}
                onClickUsername={setSelectedUserId}
                onLongPressUsername={(userId, userName, userRole) => {
                  if (isAdmin && userId !== user?.id) {
                    setAdminActionTarget({ userId, userName, userRole });
                  }
                }}
                onLongPress={(messageId, senderId, content) => {
                  const foundMsg = messages.find((m) => m.id === messageId);
                  setActionSheet({ messageId, senderId, content, createdAt: foundMsg?.created_at ?? new Date().toISOString() });
                }}
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
          <ChatInput
            onSendMessage={handleSendMessage}
            editingMessage={editingMessage}
            onCancelEdit={() => setEditingMessage(null)}
          />
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

      {/* Message Action Sheet (long-press on message content) */}
      {actionSheet && (
        <MessageActionSheet
          isOwnMessage={actionSheet.senderId === user?.id}
          isAdmin={isAdmin}
          canEditOrDelete={
            actionSheet.senderId === user?.id &&
            Date.now() - new Date(actionSheet.createdAt).getTime() < EDIT_DELETE_WINDOW_MS
          }
          isPinned={pinnedMessageIds.has(actionSheet.messageId)}
          onReport={() => {
            setReportTarget(actionSheet);
            setActionSheet(null);
          }}
          onBlock={handleBlockUserFromActionSheet}
          onDeleteMessage={() => handleAdminDeleteMessage(actionSheet.messageId)}
          onEditOwnMessage={() => {
            setEditingMessage({ id: actionSheet.messageId, content: actionSheet.content });
            setActionSheet(null);
          }}
          onDeleteOwnMessage={() => handleDeleteOwnMessage(actionSheet.messageId)}
          onPinMessage={handlePinMessage}
          onUnpinMessage={handleUnpinFromActionSheet}
          onClose={() => setActionSheet(null)}
        />
      )}

      {/* Admin Action Sheet (long-press on username) */}
      {adminActionTarget && (
        <AdminActionSheet
          targetUserId={adminActionTarget.userId}
          targetUserName={adminActionTarget.userName}
          targetUserRole={adminActionTarget.userRole}
          currentUserRole={currentUserRole}
          onClose={() => setAdminActionTarget(null)}
          onKick={() => handleKickMember(adminActionTarget.userId)}
          onPromoteToAdmin={() => handlePromoteToAdmin(adminActionTarget.userId)}
          onDemoteToMember={() => handleDemoteToMember(adminActionTarget.userId)}
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

      {/* Pinned Messages Panel */}
      {showPinnedPanel && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={() => setShowPinnedPanel(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <span className="text-lg">📌</span>
                <h2 className="font-bold text-gray-800">Pinned Messages</h2>
                {pinnedMessages.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    {pinnedMessages.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPinnedPanel(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-4">
              {pinnedMessages.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">📌</div>
                  <p className="text-gray-500 font-medium">No pinned messages</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {isAdmin ? 'Long-press a message to pin it.' : 'Admins can pin important messages here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pinnedMessages.map((pinned) => (
                    <div key={pinned.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{pinned.sender_name}</p>
                          <p className="text-sm text-gray-700 mt-0.5 break-words">{pinned.message_content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Pinned {new Date(pinned.pinned_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleUnpinMessage(pinned.id)}
                            className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            Unpin
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  );
}
