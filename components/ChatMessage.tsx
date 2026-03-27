import { useRef, useEffect } from 'react';
import Image from 'next/image';

const LONG_PRESS_DURATION = 500;

/** Returns true if the string looks like a Supabase storage image URL */
function isImageUrl(content: string): boolean {
  try {
    const url = new URL(content);
    const lower = url.pathname.toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|heic|heif)(\?|$)/.test(lower);
  } catch {
    return false;
  }
}

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

interface ChatMessageProps {
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  createdAt: string;
  isOwnMessage: boolean;
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
  createdAt,
  isOwnMessage,
  onClickUsername,
  onLongPressUsername,
  onLongPress,
}: ChatMessageProps) {
  const formattedTime = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const baseName = isOwnMessage ? 'You' : senderName;
  const roleLabel = getRoleLabel(senderRole);
  const displayName = `${baseName} - ${roleLabel}`;

  // Long-press support for message bubble
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Long-press support for username button
  const usernameLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (usernameLongPressTimer.current) clearTimeout(usernameLongPressTimer.current);
    };
  }, []);

  const handleTouchStart = () => {
    if (!onLongPress) return;
    longPressTimer.current = setTimeout(() => {
      onLongPress(messageId, senderId, content);
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

  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} mb-4`}>
      <button
        className={`text-xs font-semibold mb-1 mx-1 hover:underline focus:outline-none ${
          isOwnMessage ? 'text-red-600 text-right' : 'text-blue-600 text-left'
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
      <div
        className={`max-w-[75%] rounded-2xl cursor-pointer select-none overflow-hidden ${
          isImageUrl(content)
            ? ''
            : isOwnMessage
            ? 'px-4 py-2 bg-red-600 text-white rounded-br-none'
            : 'px-4 py-2 bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onContextMenu={(e) => {
          e.preventDefault();
          onLongPress?.(messageId, senderId, content);
        }}
      >
        {isImageUrl(content) ? (
          <div className="relative w-48 h-48">
            <Image
              src={content}
              alt="Shared image"
              fill
              className="object-cover rounded-2xl"
              sizes="192px"
            />
          </div>
        ) : (
          <p className="text-sm">{content}</p>
        )}
      </div>
      <span className="text-xs text-gray-400 mt-1 mx-1">{formattedTime}</span>
    </div>
  );
}