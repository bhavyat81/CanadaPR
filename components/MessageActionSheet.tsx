'use client';

interface MessageActionSheetProps {
  isOwnMessage: boolean;
  isAdmin?: boolean;
  canEditOrDelete?: boolean;
  onReport: () => void;
  onBlock: () => void;
  onDeleteMessage?: () => void;
  onEditOwnMessage?: () => void;
  onDeleteOwnMessage?: () => void;
  onClose: () => void;
}

export default function MessageActionSheet({
  isOwnMessage,
  isAdmin,
  canEditOrDelete,
  onReport,
  onBlock,
  onDeleteMessage,
  onEditOwnMessage,
  onDeleteOwnMessage,
  onClose,
}: MessageActionSheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl w-full max-w-md pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-4" />

        {isOwnMessage && canEditOrDelete && onEditOwnMessage && (
          <>
            <button
              onClick={onEditOwnMessage}
              className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-xl">✏️</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Edit Message</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Change what you wrote</div>
              </div>
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-6" />
          </>
        )}

        {isOwnMessage && canEditOrDelete && onDeleteOwnMessage && (
          <>
            <button
              onClick={onDeleteOwnMessage}
              className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-xl">🗑️</span>
              <div>
                <div className="text-sm font-semibold text-red-700 dark:text-red-400">Delete Message</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Remove this message for everyone</div>
              </div>
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-6" />
          </>
        )}

        {isAdmin && !isOwnMessage && onDeleteMessage && (
          <>
            <button
              onClick={onDeleteMessage}
              className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-xl">🗑️</span>
              <div>
                <div className="text-sm font-semibold text-red-700 dark:text-red-400">Delete Message</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Remove this message for everyone</div>
              </div>
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-6" />
          </>
        )}

        {!isOwnMessage && (
          <>
            <button
              onClick={onReport}
              className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-xl">🚩</span>
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Report Message</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Flag this message for review</div>
              </div>
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-6" />

            <button
              onClick={onBlock}
              className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-xl">🚫</span>
              <div>
                <div className="text-sm font-semibold text-red-600 dark:text-red-400">Block User</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Hide all messages from this user
                </div>
              </div>
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-6" />
          </>
        )}

        <button
          onClick={onClose}
          className="w-full px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>

        <div className="h-6" />
      </div>
    </div>
  );
}
