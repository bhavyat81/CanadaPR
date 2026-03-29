'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import ReactionPicker from './ReactionPicker';

const LONG_PRESS_DURATION = 500;

function getRoleLabel(role: string): string {
  switch (role) {
    case 'creator_admin':
      return 'creator/admin';
    case 'admin':
      return 'admin';
    default:
      return 'member';
  }
}

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface ChatMessageProps {
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderAvatar?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  isOwnMessage: boolean;
  reactions?: Reaction[];
  onReact?: (messageId: string, emoji: string) => void;
  onClickUsername?: (senderId: string) => void;
  onLongPressUsername?: (senderId: string, senderName: string, senderRole: string) => void;
  onLongPress?: (messageId: string, senderId: string, content: string) => void;
}

export default function ChatMessage({
  messageId,
  senderId,
  senderName,
  senderRole = 'member',
  senderAvatar,
  content,
  imageUrl,
  createdAt,
  isOwnMessage,
  reactions,
  onReact,
  onClickUsername,
  onLongPressUsername,
  onLongPress,
}: ChatMessageProps) {
  const formattedTime = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const baseName = isOwnMessage ? 'You' : senderName;
  const roleLabel = getRoleLabel(senderRole);
  const displayName = `${baseName} - ${roleLabel}`;

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usernameLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (usernameLongPressTimer.current) clearTimeout(usernameLongPressTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!showReactionPicker) return;
    const handler = () => setShowReactionPicker(false);
    document.addEventListener('touchstart', handler, { passive: true });
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('mousedown', handler);
    };
  }, [showReactionPicker]);

  const handleTouchStart = () => {
    if (!onLongPress) return;
    longPressTimer.current = setTimeout(() => {
      onLongPress(messageId, senderId, content);
      setShowReactionPicker(true);
    }, LONG_PRESS_DURATION);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleUsernameTouchStart = () => {
    if (!onLongPressUsername) return;
    usernameLongPressTimer.current = setTimeout(() => {
      onLongPressUsername(senderId, senderName, senderRole);
    }, LONG_PRESS_DURATION);
  };

  const cancelUsernameLongPress = () => {
    if (usernameLongPressTimer.current) {
      clearTimeout(usernameLongPressTimer.current);
      usernameLongPressTimer.current = null;
    }
  };

  const handleUsernameClick = () => {
    cancelUsernameLongPress();
    onClickUsername?.(senderId);
  };

  const avatarEl = (
    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-sm flex-shrink-0 select-none">
      {senderAvatar ?? '👤'}
    </div>
  );

  return (
    <>
      {lightboxOpen && imageUrl && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setLightboxOpen(false)}
        >
          <Image
            src={imageUrl}
            alt="Full size"
            width={800}
            height={800}
            className="max-w-full max-h-full object-contain rounded-xl"
            unoptimized
          />
        </div>
      )}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} mb-3`}>
        {/* Avatar + name row */}
        <div className={`flex items-center gap-1.5 mb-0.5 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          {avatarEl}
          <button
            className={`text-xs font-semibold hover:underline focus:outline-none ${
              isOwnMessage ? 'text-red-600 dark:text-red-400 text-right' : 'text-blue-600 dark:text-blue-400 text-left'
            }`}
            onClick={handleUsernameClick}
            onTouchStart={handleUsernameTouchStart}
            onTouchEnd={cancelUsernameLongPress}
            onTouchMove={cancelUsernameLongPress}
            onContextMenu={(e) => {
              e.preventDefault();
              onLongPressUsername?.(senderId, senderName, senderRole);
            }}
          >
            {displayName}
          </button>
        </div>

        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative`}>
          {/* Reaction picker floating above message */}
          {showReactionPicker && onReact && (
            <div className={`absolute bottom-full mb-1 z-20 ${isOwnMessage ? 'right-0' : 'left-0'}`}>
              <ReactionPicker
                onReact={(emoji) => onReact(messageId, emoji)}
                onClose={() => setShowReactionPicker(false)}
              />
            </div>
          )}

          <div
            className={`max-w-[75%] rounded-2xl shadow-sm cursor-pointer select-none ${
              isOwnMessage
                ? 'bg-red-600 dark:bg-red-900 text-white rounded-br-none'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-100 rounded-bl-none'
            } ${imageUrl && !content ? 'p-1' : 'px-4 py-2.5'}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            onContextMenu={(e) => {
              e.preventDefault();
              onLongPress?.(messageId, senderId, content);
            }}
          >
            {imageUrl && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="block rounded-xl overflow-hidden"
              >
                {!imageLoaded && (
                  <div className="w-[240px] h-[160px] bg-gray-200 dark:bg-slate-600 animate-pulse rounded-xl" />
                )}
                <Image
                  src={imageUrl}
                  alt="Chat image"
                  width={240}
                  height={0}
                  style={{ height: 'auto' }}
                  className={`rounded-xl max-w-[240px] object-contain ${imageLoaded ? '' : 'hidden'}`}
                  unoptimized
                  onLoad={() => setImageLoaded(true)}
                />
              </button>
            )}
            {content && <p className="text-sm">{content}</p>}
          </div>

          {/* Reaction pills */}
          {reactions && reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {reactions.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => onReact?.(messageId, r.emoji)}
                  className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    r.reacted
                      ? 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                      : 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300'
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span className="font-medium">{r.count}</span>
                </button>
              ))}
            </div>
          )}

          <span className="text-xs text-gray-400 dark:text-slate-500 mt-1">{formattedTime}</span>
        </div>
      </div>
    </>
  );
}
