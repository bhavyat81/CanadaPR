'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
  /** Extra bottom padding (in px) injected by parent when the Capacitor keyboard is open. */
  keyboardHeight?: number;
}

export default function ChatInput({ onSendMessage, disabled, editingMessage, onCancelEdit, keyboardHeight = 0 }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // When entering edit mode, prefill the input and focus it
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
      inputRef.current?.focus();
    } else {
      setMessage('');
    }
  }, [editingMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  const isEditing = !!editingMessage;

  // When keyboard is open, shift the input above the keyboard using inline style.
  // CSS env(safe-area-inset-bottom) handles iPhone notch/home-indicator spacing.
  const bottomOffset = keyboardHeight > 0 ? keyboardHeight : undefined;

  return (
    <div
      style={bottomOffset !== undefined ? { paddingBottom: bottomOffset } : undefined}
      className="bg-white dark:bg-gray-800"
    >
      {isEditing && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 dark:bg-red-900/30 border-t border-red-100 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
          <span className="flex-1">✏️ Editing message</span>
          <button
            type="button"
            onClick={() => {
              setMessage('');
              onCancelEdit?.();
            }}
            className="font-semibold hover:text-red-900 dark:hover:text-red-300"
          >
            Cancel
          </button>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex items-center space-x-2 p-4 border-t dark:border-gray-700"
        style={{ paddingBottom: `max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))` }}
      >
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isEditing ? 'Edit your message…' : 'Type a message...'}
          disabled={disabled || sending}
          autoComplete="off"
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!message.trim() || sending || disabled}
          className={`text-white rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 ${
            isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isEditing ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
