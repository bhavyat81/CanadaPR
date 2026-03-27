'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface VaultImage {
  name: string;
  url: string;
}

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
}

const ALLOWED_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic']);

function safeImageExt(file: File): string {
  const mimeExt = file.type.split('/')[1]?.toLowerCase().replace('jpeg', 'jpg') ?? '';
  if (ALLOWED_IMAGE_EXTS.has(mimeExt)) return mimeExt;
  const nameExt = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_IMAGE_EXTS.has(nameExt) ? nameExt : 'jpg';
}

const KEYBOARD_SCROLL_DELAY_MS = 300;

export default function ChatInput({ onSendMessage, disabled, editingMessage, onCancelEdit }: ChatInputProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attachment sheet state
  const [showAttachSheet, setShowAttachSheet] = useState(false);
  // Vault picker state
  const [showVaultPicker, setShowVaultPicker] = useState(false);
  const [vaultImages, setVaultImages] = useState<VaultImage[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  // Uploading state
  const [uploading, setUploading] = useState(false);

  // When entering edit mode, prefill the input and focus it
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
      inputRef.current?.focus();
    } else {
      setMessage('');
    }
  }, [editingMessage]);

  const handleFocus = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, KEYBOARD_SCROLL_DELAY_MS);
  };

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

  const handleAttachPress = () => {
    setShowAttachSheet(true);
  };

  const handleOpenVault = async () => {
    setShowAttachSheet(false);
    setShowVaultPicker(true);
    if (!user) return;
    setLoadingVault(true);
    const { data, error } = await supabase.storage
      .from('vault-images')
      .list(`${user.id}/`, { limit: 100 });
    if (!error && data) {
      const images: VaultImage[] = data
        .filter((f) => f.name !== '.emptyFolderPlaceholder')
        .map((f) => {
          const { data: urlData } = supabase.storage
            .from('vault-images')
            .getPublicUrl(`${user.id}/${f.name}`);
          return { name: f.name, url: urlData.publicUrl };
        });
      setVaultImages(images);
    } else {
      setVaultImages([]);
    }
    setLoadingVault(false);
  };

  const handleSelectVaultImage = async (imageUrl: string) => {
    setShowVaultPicker(false);
    setSending(true);
    try {
      await onSendMessage(`[image:${imageUrl}]`);
    } finally {
      setSending(false);
    }
  };

  const handleOpenGallery = () => {
    setShowAttachSheet(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // Reset the input so the same file can be re-selected
    e.target.value = '';

    setUploading(true);
    const ext = safeImageExt(file);
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(path, file, { upsert: false });

    if (uploadError) {
      console.error('Failed to upload image:', uploadError);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(path);

    setUploading(false);
    setSending(true);
    try {
      await onSendMessage(`[image:${urlData.publicUrl}]`);
    } finally {
      setSending(false);
    }
  };

  const isEditing = !!editingMessage;
  const isDisabled = disabled || sending || uploading;

  return (
    <div className="bg-white dark:bg-gray-800">
      {/* Hidden file input for gallery access */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

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
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex items-center space-x-2 p-4 border-t dark:border-gray-700"
        style={{ paddingBottom: `max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))` }}
      >
        {/* Attachment (+) button — hidden in edit mode */}
        {!isEditing && (
          <button
            type="button"
            onClick={handleAttachPress}
            disabled={isDisabled}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 flex-shrink-0 transition-colors"
            aria-label="Attach media"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={handleFocus}
          placeholder={
            uploading ? 'Uploading image…' : isEditing ? 'Edit your message…' : 'Type a message...'
          }
          disabled={isDisabled}
          autoComplete="off"
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!message.trim() || isDisabled}
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

      {/* ── Attachment action sheet ───────────────────────────────────── */}
      {showAttachSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowAttachSheet(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowAttachSheet(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Send media"
          tabIndex={-1}
        >
          <div
            className="w-full bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl px-4 pt-4 pb-8"
            style={{ paddingBottom: `calc(2rem + env(safe-area-inset-bottom))` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
            <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Send Media
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleOpenVault}
                className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-3xl">🔒</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Vault</span>
              </button>
              <button
                onClick={handleOpenGallery}
                className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Gallery</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Vault image picker ────────────────────────────────────────── */}
      {showVaultPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowVaultPicker(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowVaultPicker(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="My Vault"
          tabIndex={-1}
        >
          <div
            className="w-full bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl px-4 pt-4"
            style={{
              maxHeight: '70vh',
              paddingBottom: `calc(1.5rem + env(safe-area-inset-bottom))`,
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 flex-shrink-0" />
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                🔒 My Vault
              </p>
              <button
                onClick={() => setShowVaultPicker(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingVault ? (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                  Loading vault…
                </p>
              ) : vaultImages.length === 0 ? (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                  Your vault is empty. Add photos from the Home page.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 pb-4">
                  {vaultImages.map((img) => (
                    <button
                      key={img.name}
                      onClick={() => handleSelectVaultImage(img.url)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 hover:opacity-80 transition-opacity"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt="Vault image"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
