'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface VaultImage {
  name: string;
  url: string;
}

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
  userId?: string;
}

const KEYBOARD_SCROLL_DELAY_MS = 300; // Allow time for the software keyboard animation to complete
const VAULT_SIGNED_URL_EXPIRY = 3600; // Signed URL expiry in seconds (1 hour)

export default function ChatInput({ onSendMessage, disabled, editingMessage, onCancelEdit, userId }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showVaultPicker, setShowVaultPicker] = useState(false);
  const [vaultImages, setVaultImages] = useState<VaultImage[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [sharingVaultImage, setSharingVaultImage] = useState<string | null>(null);
  const [vaultShareError, setVaultShareError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
    // Scroll the form into view so the keyboard doesn't hide it (WhatsApp-like behavior)
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

  const loadVaultImages = async () => {
    if (!userId) return;
    setLoadingVault(true);
    const { data, error } = await supabase.storage
      .from('vault-images')
      .list(`${userId}/`, { limit: 100 });
    if (!error && data) {
      const filtered = data.filter((f) => f.name !== '.emptyFolderPlaceholder');
      const imagePromises = filtered.map(async (f) => {
        const { data: urlData } = await supabase.storage
          .from('vault-images')
          .createSignedUrl(`${userId}/${f.name}`, VAULT_SIGNED_URL_EXPIRY);
        return { name: f.name, url: urlData?.signedUrl ?? '' };
      });
      setVaultImages(await Promise.all(imagePromises));
    } else {
      setVaultImages([]);
    }
    setLoadingVault(false);
  };

  const handleOpenVaultPicker = async () => {
    if (!userId) return;
    setVaultShareError('');
    setShowVaultPicker(true);
    await loadVaultImages();
  };

  const handleShareVaultImage = async (img: VaultImage) => {
    if (!userId || !img.url) return;
    setSharingVaultImage(img.name);
    setVaultShareError('');
    try {
      // Fetch the private vault image via the signed URL
      const response = await fetch(img.url);
      if (!response.ok) throw new Error('Failed to fetch vault image');
      const blob = await response.blob();
      const ext = img.name.split('.').pop() ?? 'jpg';
      const fileName = `${userId}/${Date.now()}.${ext}`;

      // Upload to the public chat-images bucket so all chat members can see it
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, blob);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      await onSendMessage(publicUrlData.publicUrl);
      setShowVaultPicker(false);
    } catch {
      setVaultShareError('Failed to share image. Please try again.');
    } finally {
      setSharingVaultImage(null);
    }
  };

  const isEditing = !!editingMessage;

  return (
    <div>
      {isEditing && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 border-t border-red-100 text-xs text-red-700">
          <span className="flex-1">✏️ Editing message</span>
          <button
            type="button"
            onClick={() => {
              setMessage('');
              onCancelEdit?.();
            }}
            className="font-semibold hover:text-red-900"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Vault image picker sheet */}
      {showVaultPicker && (
        <div className="border-t bg-white dark:bg-gray-900 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">🔒 Share from Vault</span>
            <button
              type="button"
              onClick={() => setShowVaultPicker(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
            >
              ✕
            </button>
          </div>
          {loadingVault ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading vault…</p>
          ) : vaultImages.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No images in your vault yet.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {vaultImages.map((img) => (
                <button
                  key={img.name}
                  type="button"
                  onClick={() => handleShareVaultImage(img)}
                  disabled={!!sharingVaultImage}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-red-400 transition-colors disabled:opacity-50"
                >
                  {img.url ? (
                    <Image
                      src={img.url}
                      alt={img.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
                      ?
                    </div>
                  )}
                  {sharingVaultImage === img.name && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs">Sharing…</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          {vaultShareError && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-2">{vaultShareError}</p>
          )}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="flex items-center space-x-2 p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
        {/* Vault button — only shown when not editing */}
        {!isEditing && userId && (
          <button
            type="button"
            onClick={handleOpenVaultPicker}
            disabled={disabled || sending}
            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50"
            aria-label="Share from vault"
            title="Share from vault"
          >
            🔒
          </button>
        )}
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={handleFocus}
          placeholder={isEditing ? 'Edit your message…' : 'Type a message...'}
          disabled={disabled || sending}
          autoComplete="off"
          className="flex-1 border border-gray-300 dark:border-gray-700 rounded-full px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
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