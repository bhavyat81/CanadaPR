import { useRef, useEffect } from 'react';

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
        className={`max-w-[75%] px-4 py-2 rounded-2xl cursor-pointer select-none ${
          isOwnMessage
            ? 'bg-red-600 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onContextMenu={(e) => {
          e.preventDefault();
          onLongPress?.(messageId, senderId, content);
        }}
      >
        <p className="text-sm">{content}</p>
      </div>
      <span className="text-xs text-gray-400 mt-1 mx-1">{formattedTime}</span>
    </div>
  );
}