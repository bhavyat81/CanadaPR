'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface VaultItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function VaultPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const storageKey = user ? `vault_items_${user.id}` : null;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setItems(raw ? (JSON.parse(raw) as VaultItem[]) : []);
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  const saveItems = (updated: VaultItem[]) => {
    setItems(updated);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    const newItem: VaultItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    saveItems([newItem, ...items]);
    setTitle('');
    setContent('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    saveItems(items.filter((item) => item.id !== id));
    setDeleteId(null);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 px-4 py-8 page-fade-in">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push('/welcome')}
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Back"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">🔒 My Vault</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Securely store your important PR documents and notes on this device.
        </p>

        {/* Add Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-red-200/50 dark:shadow-red-900/30"
          >
            + Add New Item
          </button>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 space-y-3">
            <h2 className="font-semibold text-gray-800 dark:text-slate-100">New Vault Item</h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Passport Number)"
              className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Notes or content..."
              rows={4}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!title.trim()}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setTitle('');
                  setContent('');
                }}
                className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 py-2.5 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Items List */}
        {items.length === 0 && !showForm && (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">
            <div className="text-4xl mb-3">🔒</div>
            <p className="font-medium">Your vault is empty</p>
            <p className="text-sm mt-1">Add your first item above</p>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-xl px-4 py-4 border-l-4 border-red-500 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-slate-100 truncate">{item.title}</p>
                  {item.content && (
                    <p className="text-sm text-gray-600 dark:text-slate-300 mt-1 whitespace-pre-wrap break-words">
                      {item.content}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                  aria-label="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-gray-400 dark:text-slate-500 pb-4">
          Items are stored locally on this device only.
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 text-lg mb-2">Delete Item?</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-5">
              This item will be permanently deleted from your vault.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 py-2.5 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
