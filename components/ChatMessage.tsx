import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

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
  imageUrl?: string;
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
  imageUrl,
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

  const [lightboxOpen, setLightboxOpen] = useState(false);

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
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <button
            className={`text-xs font-semibold mb-1 hover:underline focus:outline-none ${
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
                <Image
                  src={imageUrl}
                  alt="Chat image"
                  width={240}
                  height={240}
                  className="rounded-xl max-w-[240px] object-cover"
                  unoptimized
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
