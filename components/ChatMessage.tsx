'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

const LONG_PRESS_DURATION = 500;
const SWIPE_THRESHOLD = 60; // px to trigger reply
const SWIPE_MOVE_CANCEL_PX = 8; // movement before cancelling long press
const SWIPE_DIRECTIONALITY_RATIO = 1.5; // horizontal must exceed vertical by this factor
const MAX_SWIPE_MULTIPLIER = 1.5; // max translateX = SWIPE_THRESHOLD * this

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

interface ReplyPreview {
  messageId: string;
  senderName: string;
  content: string;
}

interface ChatMessageProps {
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  isOwnMessage: boolean;
  replyToMessage?: ReplyPreview | null;
  onReply?: (messageId: string, senderName: string, content: string) => void;
  onScrollToMessage?: (messageId: string) => void;
  onClickUsername?: (senderId: string) => void;
  onLongPressUsername?: (senderId: string, senderName: string, senderRole: string) => void;
  onLongPress?: (messageId: string, senderId: string, content: string) => void;
}

export default function ChatMessage({
  messageId,
  senderId,
  senderName,
  senderRole = 'member',
  content,
  imageUrl,
  createdAt,
  isOwnMessage,
  replyToMessage,
  onReply,
  onScrollToMessage,
  onClickUsername,
  onLongPressUsername,
  onLongPress,
}: ChatMessageProps) {
  const formattedTime = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Swipe-to-reply state
  const [swipeX, setSwipeX] = useState(0);
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const swipeTriggered = useRef(false);
  const swipeActive = useRef(false);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeStartX.current = touch.clientX;
    swipeStartY.current = touch.clientY;
    swipeTriggered.current = false;
    swipeActive.current = false;

    if (!onLongPress) return;
    longPressTimer.current = setTimeout(() => {
      onLongPress(messageId, senderId, content);
    }, LONG_PRESS_DURATION);
  };

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (swipeStartX.current === null || swipeStartY.current === null) return;
      const touch = e.touches[0];
      const dx = touch.clientX - swipeStartX.current;
      const dy = touch.clientY - swipeStartY.current;

      // Cancel long press if significant movement
      if (Math.abs(dx) > SWIPE_MOVE_CANCEL_PX || Math.abs(dy) > SWIPE_MOVE_CANCEL_PX) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }

      // Only track right-swipe (dx > 0) and mostly horizontal
      if (dx > 0 && Math.abs(dx) > Math.abs(dy) * SWIPE_DIRECTIONALITY_RATIO) {
        swipeActive.current = true;
        const clamped = Math.min(dx, SWIPE_THRESHOLD * MAX_SWIPE_MULTIPLIER);
        setSwipeX(clamped);

        if (!swipeTriggered.current && dx >= SWIPE_THRESHOLD) {
          swipeTriggered.current = true;
          onReply?.(messageId, senderName, content);
        }
      }
    },
    [messageId, senderName, content, onReply]
  );

  const handleTouchEnd = () => {
    swipeStartX.current = null;
    swipeStartY.current = null;
    swipeActive.current = false;
    setSwipeX(0);
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
    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-sm flex-shrink-0 self-end" aria-label="User avatar">
      👤
    </div>
  );

  // Show reply icon when swiping
  const showReplyIcon = swipeX > 10;
  const replyIconOpacity = Math.min(swipeX / SWIPE_THRESHOLD, 1);

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

      <div
        className={`relative flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swipeActive.current ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {/* Reply arrow icon — appears during swipe */}
        {showReplyIcon && (
          <div
            className="absolute -left-8 flex items-center justify-center text-blue-500 dark:text-blue-400 self-center"
            style={{
              opacity: replyIconOpacity,
              transform: `scale(${0.6 + replyIconOpacity * 0.4})`,
              transition: 'opacity 0.1s, transform 0.1s',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Avatar on the left for other people's messages */}
        {!isOwnMessage && (
          <div className="mr-2 flex-shrink-0">{avatarEl}</div>
        )}

        {/* Bubble column — max 75% width mirrors WhatsApp/iMessage convention */}
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
          {/* Sender name above bubble (only for others) */}
          {!isOwnMessage && (
            <button
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none mb-0.5 text-left"
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
          )}

          {/* Quoted reply bubble */}
          {replyToMessage && (
            <button
              type="button"
              onClick={() => onScrollToMessage?.(replyToMessage.messageId)}
              className={`mb-1 px-3 py-1.5 rounded-xl text-xs border-l-4 border-blue-400 dark:border-blue-500 max-w-full text-left ${
                isOwnMessage
                  ? 'bg-red-700/60 dark:bg-red-800/60 text-white/90'
                  : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300'
              }`}
            >
              <p className="font-semibold text-blue-300 dark:text-blue-300 truncate">{replyToMessage.senderName}</p>
              <p className="truncate opacity-80">{replyToMessage.content || '📷 Image'}</p>
            </button>
          )}

          <div
            className={`rounded-2xl shadow-sm cursor-pointer select-none ${
              isOwnMessage
                ? 'bg-red-600 dark:bg-red-900 text-white rounded-br-none'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-100 rounded-bl-none'
            } ${imageUrl && !content ? 'p-1' : 'px-4 py-2.5'}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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

          <span className="text-xs text-gray-400 dark:text-slate-500 mt-1">{formattedTime}</span>
        </div>
      </div>
    </>
  );
}
