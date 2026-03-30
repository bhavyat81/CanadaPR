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
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatMonth } from '@/lib/months';
import { getCategoryShortLabel, buildGroupKey } from '@/lib/categories';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { hapticMedium, hapticHeavy, hapticSuccess, hapticLight } from '@/lib/haptics';
import { isMuted, toggleMute } from '@/lib/muteUtils';

const MESSAGES_LIMIT = 100;
const CREATOR_EMAIL = 'bhavyat81admin@gmail.com';
const EDIT_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SCROLL_HIGHLIGHT_COLOR = 'rgba(99,102,241,0.2)';
const SCROLL_HIGHLIGHT_DURATION_MS = 1200;

interface Message {
  id: string;
  group_month: string;
  sender_id: string;
  sender_name: string;
  content: string;
  image_url?: string;
  created_at: string;
  // reply_to references messages.id — requires DB migration:
  // ALTER TABLE messages ADD COLUMN reply_to uuid REFERENCES messages(id);
  reply_to?: string | null;
}

interface Member {
  id: string;
  display_name: string;
}

type ProfileData = { id: string; display_name: string };

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
  const messageRefsMap = useRef<Record<string, HTMLDivElement | null>>({});
  // Measured height of the fixed <nav> element above this component
  const [navbarHeight, setNavbarHeight] = useState(64);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  // Measure the actual navbar height (includes safe-area-inset-top on iOS).
  useEffect(() => {
    const nav = document.querySelector('nav');
    if (nav) setNavbarHeight(nav.offsetHeight);
  }, []);

  // Track keyboard height using Capacitor's native Keyboard plugin events.
  // Falls back to visualViewport on web.
  const keyboardHeight = useKeyboardHeight();

  // Scroll to bottom when keyboard opens so the latest messages stay visible.
  useEffect(() => {
    if (keyboardHeight > 0) {
      scrollToBottom();
    }
  }, [keyboardHeight, scrollToBottom]);

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

  // Swipe-to-reply state
  const [replyingTo, setReplyingTo] = useState<{ senderName: string; content: string; messageId: string } | null>(null);

  // Mute state (persisted in localStorage)
  const [muted, setMuted] = useState(false);

  // Map of messageId -> Message for reply lookups
  const [replyMessages, setReplyMessages] = useState<Record<string, Message>>({});

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
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

  // Load mute state from localStorage when user + groupKey are known
  useEffect(() => {
    if (!user) return;
    setMuted(isMuted(user.id, groupKey));
  }, [user, groupKey]);

  const handleToggleMute = () => {
    if (!user) return;
    hapticLight();
    const nowMuted = toggleMute(user.id, groupKey);
    setMuted(nowMuted);
  };

  const scrollToMessage = useCallback((targetId: string) => {
    const el = messageRefsMap.current[targetId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Brief highlight
      el.style.transition = 'background-color 0.3s';
      el.style.backgroundColor = SCROLL_HIGHLIGHT_COLOR;
      setTimeout(() => { el.style.backgroundColor = ''; }, SCROLL_HIGHLIGHT_DURATION_MS);
    }
  }, []);

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

  // Load roles and avatars for a list of sender IDs (skips already-loaded ones)
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
      profiles: ProfileData | ProfileData[] | null;
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
          .filter((p): p is ProfileData => !!p && !!p.display_name)
          .map((p) => ({ id: p.id, display_name: p.display_name }));
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

      const msgs: Message[] = data || [];
      setMessages(msgs);
      setLoadingMessages(false);
      scrollToBottom();

      // Load roles for all unique senders (fire-and-forget so messages render immediately)
      const uniqueIds = [...new Set(msgs.map((m: Message) => m.sender_id))];
      if (uniqueIds.length > 0) {
        loadSenderRoles(uniqueIds);
      }

      // Load reply-to messages that are not already in the current batch
      const replyIds = [...new Set(msgs.map((m) => m.reply_to).filter(Boolean))] as string[];
      const missingReplyIds = replyIds.filter((id) => !msgs.some((m) => m.id === id));
      if (missingReplyIds.length > 0) {
        const { data: replyData } = await supabase
          .from('messages')
          .select('*')
          .in('id', missingReplyIds);
        if (replyData) {
          const map: Record<string, Message> = {};
          (replyData as Message[]).forEach((m) => { map[m.id] = m; });
          setReplyMessages(map);
        }
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
          scrollToBottom();
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
  }, [user, groupKey, loadSenderRoles, scrollToBottom]);

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

    hapticSuccess();
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

    hapticMedium();
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
    const actionSheetSnapshot = actionSheet;
    setActionSheet(null);

    setConfirmDialog({
      title: 'Block User',
      message: 'Are you sure you want to block this user? You will no longer see their messages.',
      confirmLabel: 'Block',
      onConfirm: async () => {
        setConfirmDialog(null);
        hapticHeavy();
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
          message_id: actionSheetSnapshot.messageId,
          message_content: actionSheetSnapshot.content,
          reason: 'User blocked',
          group_month: groupKey,
          status: 'pending',
        });

        setBlockedIds((prev) => new Set([...prev, targetId]));
        // Remove blocked user's messages immediately
        setMessages((prev) => prev.filter((m) => m.sender_id !== targetId));
      },
    });
  };

  // Admin: delete a specific message
  const handleAdminDeleteMessage = (messageId: string) => {
    setActionSheet(null);
    setConfirmDialog({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message as admin? This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setConfirmDialog(null);
        hapticHeavy();
        const { error } = await supabase.rpc('admin_delete_message', {
          message_id_param: messageId,
        });
        if (error) {
          console.error('Failed to delete message:', error);
          return;
        }
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      },
    });
  };

  // Member: delete their own message (only within 24 hours)
  const handleDeleteOwnMessage = (messageId: string) => {
    if (!user) return;
    setActionSheet(null);
    setConfirmDialog({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message? This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setConfirmDialog(null);
        hapticHeavy();
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
      },
    });
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
  const handleKickMember = (targetUserId: string) => {
    setAdminActionTarget(null);
    setConfirmDialog({
      title: 'Remove User',
      message: 'Are you sure you want to remove this user from the group?',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        setConfirmDialog(null);
        const { error } = await supabase.rpc('kick_from_group', {
          target_user_id: targetUserId,
          group_key_param: groupKey,
        });
        if (error) {
          console.error('Failed to kick user:', error);
          return;
        }
        setMembers((prev) => prev.filter((m) => m.id !== targetUserId));
      },
    });
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

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    // If in edit mode, route to update handler instead
    if (editingMessage) {
      await handleUpdateOwnMessage(content);
      return;
    }

    if (!user || !userProfile) return;

    const currentReplyingTo = replyingTo;
    setReplyingTo(null);

    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      group_month: groupKey,
      sender_id: user.id,
      sender_name: userProfile.display_name,
      content,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      reply_to: currentReplyingTo?.messageId ?? null,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setSendError(null);
    scrollToBottom();

    const insertPayload: Record<string, unknown> = {
      group_month: groupKey,
      sender_id: user.id,
      sender_name: userProfile.display_name,
      content,
    };
    if (imageUrl) insertPayload.image_url = imageUrl;
    if (currentReplyingTo?.messageId) insertPayload.reply_to = currentReplyingTo.messageId;

    const { error, data } = await supabase
      .from('messages')
      .insert(insertPayload)
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">Loading...</div>
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
  const filteredMessages = visibleMessages;
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'creator_admin';

  return (
    <div
      className="flex flex-col dark:bg-slate-900"
      style={{
        position: 'fixed',
        top: `${navbarHeight}px`,
        left: 0,
        right: 0,
        bottom: `${keyboardHeight}px`,
      }}
    >
      {/* Chat Header — single clean line: ← | Group Name | 👥N | 🚪 */}
      <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 px-4 py-2 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {/* Back arrow */}
          <button
            onClick={() => router.push(`/groups/category?cat=${encodeURIComponent(decodedCategory)}`)}
            className="text-red-600 dark:text-red-400 hover:text-red-700 text-xl font-bold leading-none flex-shrink-0 px-1"
            aria-label="Back"
          >
            ←
          </button>

          {/* Group name — centered, fills remaining space */}
          <h1 className="flex-1 text-center text-sm sm:text-base font-bold text-gray-800 dark:text-slate-100 truncate px-1">
            {displayMonth} {categoryShort}
            {muted && <span className="ml-1 text-xs font-normal text-gray-400 dark:text-slate-500">🔇</span>}
          </h1>

          {/* Members count — tappable, opens dropdown */}
          <MembersPanel members={members} />

          {/* Mute/unmute toggle */}
          {isMember && (
            <button
              onClick={handleToggleMute}
              title={muted ? 'Unmute group' : 'Mute group'}
              className="text-gray-400 hover:text-yellow-500 transition-colors text-xl px-1 flex-shrink-0"
              aria-label={muted ? 'Unmute group' : 'Mute group'}
            >
              {muted ? '🔔' : '🔇'}
            </button>
          )}

          {/* Leave group */}
          {isMember && (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              title="Leave group"
              className="text-gray-400 hover:text-red-500 transition-colors text-xl px-1 flex-shrink-0"
              aria-label="Leave group"
            >
              🚪
            </button>
          )}
        </div>
      </div>

      {/* Leave Group Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border border-transparent dark:border-slate-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Leave this group?</h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm mb-6">
              Are you sure you want to leave this group? You can always rejoin later.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
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
      <div
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 bg-gray-50 dark:bg-slate-900"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="max-w-4xl mx-auto">
          {loadingMessages ? (
            <div className="text-center text-gray-500 dark:text-slate-400 py-8">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300">
                No messages yet
              </h3>
              <p className="text-gray-500 dark:text-slate-400 mt-2">
                {`Be the first to say hello to the ${displayMonth} ${categoryShort} group!`}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              // Resolve the replied-to message for display
              const replyToMsg = msg.reply_to
                ? (messages.find((m) => m.id === msg.reply_to) ?? replyMessages[msg.reply_to] ?? null)
                : null;
              return (
                <div
                  key={msg.id}
                  ref={(el) => { messageRefsMap.current[msg.id] = el; }}
                >
                  <ChatMessage
                    messageId={msg.id}
                    senderId={msg.sender_id}
                    senderName={msg.sender_name}
                    senderRole={
                      msg.sender_id === user?.id
                        ? currentUserRole
                        : (senderRoles[msg.sender_id] ?? 'member')
                    }
                    content={msg.content}
                    imageUrl={msg.image_url}
                    createdAt={msg.created_at}
                    isOwnMessage={msg.sender_id === user?.id}
                    replyToMessage={replyToMsg ? { messageId: replyToMsg.id, senderName: replyToMsg.sender_name, content: replyToMsg.content } : null}
                    onReply={(msgId, name, text) => setReplyingTo({ messageId: msgId, senderName: name, content: text })}
                    onScrollToMessage={scrollToMessage}
                    onClickUsername={setSelectedUserId}
                    onLongPressUsername={(userId, userName, userRole) => {
                      if (isAdmin && userId !== user?.id) {
                        setAdminActionTarget({ userId, userName, userRole });
                      }
                    }}
                    onLongPress={(messageId, senderId, content) => {
                      hapticMedium();
                      const foundMsg = messages.find((m) => m.id === messageId);
                      setActionSheet({ messageId, senderId, content, createdAt: foundMsg?.created_at ?? new Date().toISOString() });
                    }}
                  />
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="max-w-4xl mx-auto w-full">
        {sendError && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
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
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t dark:border-slate-700 text-center text-yellow-800 dark:text-yellow-300">
            Please{' '}
            <a href="/profile" className="font-medium underline">
              set up your profile
            </a>{' '}
            to send messages.
          </div>
        ) : isMember === false ? (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t dark:border-slate-700 text-center text-blue-800 dark:text-blue-300">
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
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            userId={user?.id}
            onKeyboardOpen={scrollToBottom}
          />
        ) : (
          <div className="p-4 border-t dark:border-slate-700 text-center text-gray-400 dark:text-slate-500 text-sm">Checking membership...</div>
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

      {/* Confirmation Dialog for destructive actions */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          confirmVariant="danger"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
