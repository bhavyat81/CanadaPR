'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface VaultFile {
  name: string;
  url: string;
  created_at: string;
  size?: number;
}

export default function VaultPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadFiles = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: listError } = await supabase.storage
      .from('user-vault')
      .list(`${user.id}/`, { sortBy: { column: 'created_at', order: 'desc' } });

    if (listError) {
      setError('Failed to load vault files.');
      setLoading(false);
      return;
    }

    const fileList: VaultFile[] = await Promise.all(
      (data || []).filter(f => !f.name.startsWith('.')).map(async (f) => {
        const { data: urlData } = await supabase.storage
          .from('user-vault')
          .createSignedUrl(`${user.id}/${f.name}`, 3600);
        return {
          name: f.name,
          url: urlData?.signedUrl || '',
          created_at: f.created_at || '',
          size: f.metadata?.size,
        };
      })
    );

    setFiles(fileList);
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadFiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUpload = async (file: File) => {
    if (!user || !file) return;
    setUploading(true);
    setError('');

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user-vault')
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError('Upload failed. Make sure the vault bucket exists in Supabase.');
    } else {
      await loadFiles();
    }
    setUploading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleUpload(file);
    e.target.value = '';
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    const { error: deleteError } = await supabase.storage
      .from('user-vault')
      .remove([`${user.id}/${deleteTarget}`]);
    if (deleteError) {
      setError('Failed to delete file.');
    } else {
      setFiles(prev => prev.filter(f => f.name !== deleteTarget));
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleShareToChat = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(url);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch {
      setError('Could not copy URL.');
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 page-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/welcome" className="text-red-600 dark:text-red-400 hover:underline text-sm">← Back</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">🔒 My Vault</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Private storage for your immigration documents &amp; photos</p>
          </div>
        </div>

        {/* Upload buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {uploading ? '⏳ Uploading...' : '📁 Upload File'}
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-5 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            📷 Camera
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Files Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300">Your vault is empty</h3>
            <p className="text-gray-500 dark:text-slate-400 mt-2">Upload your immigration documents &amp; photos here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map(file => (
              <div key={file.name} className="relative group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm">
                <button
                  onClick={() => setLightboxUrl(file.url)}
                  className="w-full aspect-square bg-gray-50 dark:bg-slate-700 flex items-center justify-center overflow-hidden"
                >
                  {file.url && file.name.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl">📄</div>
                  )}
                </button>
                <div className="p-2">
                  <p className="text-xs text-gray-600 dark:text-slate-300 truncate">{file.name.replace(/^\d+-[a-z0-9]+\./, '')}</p>
                  {file.size && <p className="text-xs text-gray-400 dark:text-slate-500">{formatSize(file.size)}</p>}
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => handleShareToChat(file.url)}
                      title="Copy URL for chat"
                      className="flex-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      {copySuccess === file.url ? '✅ Copied!' : '🔗 Share'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(file.name)}
                      title="Delete"
                      className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Delete File?</h3>
            <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">
              This will permanently delete this file from your vault.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
