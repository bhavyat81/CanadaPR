'use client';

import { useState } from 'react';
import { AVATAR_OPTIONS } from '@/lib/avatars';

interface AvatarPickerModalProps {
  currentAvatar: string;
  onSelect: (emoji: string) => void;
  onCancel: () => void;
}

export default function AvatarPickerModal({ currentAvatar, onSelect, onCancel }: AvatarPickerModalProps) {
  const [selected, setSelected] = useState(currentAvatar);

  return (
    <div className="fixed inset-0 bg-black/60 flex flex-col items-center justify-end z-50" onClick={onCancel}>
      <div
        className="bg-white dark:bg-slate-800 rounded-t-2xl w-full max-w-lg shadow-xl flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-800 dark:text-slate-100">Choose Avatar</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3">
          <div className="grid grid-cols-7 gap-2">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelected(emoji)}
                className={`w-full aspect-square flex items-center justify-center text-2xl rounded-xl transition-all ${
                  selected === emoji
                    ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/30'
                    : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
                aria-label={`Select ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(selected)}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
