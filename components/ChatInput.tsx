'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface VaultItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ChatInputProps {
  onSendMessage: (content: string, imageUrl?: string) => Promise<void>;
  disabled?: boolean;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
  userId?: string;
}

// ─── Simple CSS crop modal ─────────────────────────────────────────────────
interface CropModalProps {
  src: string;
  onSend: (blob: Blob) => void;
  onCancel: () => void;
}

function CropModal({ src, onSend, onCancel }: CropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const SIZE = 300;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, offset.x, offset.y, w, h);
  }, [scale, offset]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const s = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
      setScale(s);
      setOffset({ x: (SIZE - img.naturalWidth * s) / 2, y: (SIZE - img.naturalHeight * s) / 2 });
    };
    img.src = src;
  }, [src]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    setOffset({ x: dragStart.current.ox + e.clientX - dragStart.current.x, y: dragStart.current.oy + e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    const t = e.touches[0];
    dragStart.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || !dragStart.current) return;
    const t = e.touches[0];
    setOffset({ x: dragStart.current.ox + t.clientX - dragStart.current.x, y: dragStart.current.oy + t.clientY - dragStart.current.y });
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => { if (blob) onSend(blob); }, 'image/jpeg', 0.85);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 w-full max-w-sm shadow-xl">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 text-center">Drag to reposition · Scroll to zoom</h3>
        <div className="relative overflow-hidden rounded-xl mx-auto" style={{ width: SIZE, height: SIZE, cursor: dragging ? 'grabbing' : 'grab' }}>
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onWheel={(e) => setScale((s) => Math.max(0.2, Math.min(5, s - e.deltaY * 0.001)))}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-slate-500">Zoom</span>
          <input type="range" min={0.2} max={5} step={0.05} value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1 accent-red-600" />
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 py-2.5 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
          <button onClick={handleSend} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700">Send</button>
        </div>
      </div>
    </div>
  );
}

// ─── Vault picker modal ────────────────────────────────────────────────────
interface VaultPickerModalProps {
  userId: string;
  onSelect: (content: string) => void;
  onCancel: () => void;
}

function VaultPickerModal({ userId, onSelect, onCancel }: VaultPickerModalProps) {
  const [items, setItems] = useState<VaultItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`vault_items_${userId}`);
      setItems(raw ? (JSON.parse(raw) as VaultItem[]) : []);
    } catch {
      setItems([]);
    }
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black/60 flex flex-col items-center justify-end z-50" onClick={onCancel}>
      <div
        className="bg-white dark:bg-slate-800 rounded-t-2xl w-full max-w-lg shadow-xl p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800 dark:text-slate-100">🔒 Upload from Vault</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-slate-500">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-sm">No vault items found.</p>
            <p className="text-xs mt-1">Save items in your Vault to share them here.</p>
          </div>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSelect(item.content)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-slate-600 transition-colors"
                >
                  <p className="font-medium text-sm text-gray-800 dark:text-slate-100 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{item.content}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ChatInput({ onSendMessage, disabled, editingMessage, onCancelEdit, userId }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showVaultPicker, setShowVaultPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
      inputRef.current?.focus();
    } else {
      setMessage('');
    }
  }, [editingMessage]);

  // Close popup when clicking outside
  useEffect(() => {
    if (!showPopup) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showPopup]);

  const handleFocus = () => {
    // Use requestAnimationFrame + delay to wait for the iOS keyboard animation
    // to complete (~400-500 ms) before scrolling the input into view.
    requestAnimationFrame(() => {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 450);
    });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    e.target.value = '';
  };

  const handleCropSend = async (blob: Blob) => {
    setCropSrc(null);
    setSending(true);
    try {
      const filename = `chat-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: false });
      if (error || !data) {
        console.error('Image upload failed', error);
        return;
      }
      const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(data.path);
      await onSendMessage('', urlData.publicUrl);
    } finally {
      setSending(false);
    }
  };

  const handleVaultSelect = async (content: string) => {
    setShowVaultPicker(false);
    setSending(true);
    try {
      await onSendMessage(content);
    } finally {
      setSending(false);
    }
  };

  const isEditing = !!editingMessage;

  return (
    <div>
      {cropSrc && (
        <CropModal src={cropSrc} onSend={handleCropSend} onCancel={() => { setCropSrc(null); }} />
      )}

      {showVaultPicker && userId && (
        <VaultPickerModal
          userId={userId}
          onSelect={handleVaultSelect}
          onCancel={() => setShowVaultPicker(false)}
        />
      )}

      {isEditing && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
          <span className="flex-1">✏️ Editing message</span>
          <button
            type="button"
            onClick={() => { setMessage(''); onCancelEdit?.(); }}
            className="font-semibold hover:text-red-900 dark:hover:text-red-100"
          >
            Cancel
          </button>
        </div>
      )}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex items-center space-x-2 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-t border-gray-200 dark:border-slate-700"
      >
        {/* "+" button with popup menu */}
        {!isEditing && (
          <div className="relative flex-shrink-0" ref={popupRef}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => setShowPopup((v) => !v)}
              disabled={disabled || sending}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-50 transition-colors flex-shrink-0 shadow-sm"
              aria-label="Attach"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Popup menu */}
            {showPopup && (
              <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden min-w-[180px] z-10">
                <button
                  type="button"
                  onClick={() => { setShowPopup(false); fileRef.current?.click(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="text-base">📷</span>
                  <span>Upload from Gallery</span>
                </button>
                <div className="h-px bg-gray-100 dark:bg-slate-700" />
                <button
                  type="button"
                  onClick={() => { setShowPopup(false); setShowVaultPicker(true); }}
                  disabled={!userId}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
                >
                  <span className="text-base">🔒</span>
                  <span>Upload from Vault</span>
                </button>
              </div>
            )}
          </div>
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
          className="flex-1 border border-gray-300 dark:border-slate-600 rounded-full px-4 py-2 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!message.trim() || sending || disabled}
          className={`text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0 flex-shrink-0 shadow-sm ${
            isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isEditing ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
