'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ChatInputProps {
  onSendMessage: (content: string, imageUrl?: string) => Promise<void>;
  disabled?: boolean;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
}

// Delay (ms) to allow the iOS keyboard animation to complete before scrolling
const KEYBOARD_SCROLL_DELAY_MS = 300;

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

export default function ChatInput({ onSendMessage, disabled, editingMessage, onCancelEdit }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      formRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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

  const isEditing = !!editingMessage;

  return (
    <div>
      {cropSrc && (
        <CropModal src={cropSrc} onSend={handleCropSend} onCancel={() => { setCropSrc(null); }} />
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
        {/* Image picker button */}
        {!isEditing && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled || sending}
              className="text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
              aria-label="Send image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
              </svg>
            </button>
          </>
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
