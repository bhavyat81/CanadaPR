'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface VaultImage {
  name: string;
  url: string;
}

export default function VaultPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<VaultImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<VaultImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VaultImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadImages = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: listError } = await supabase.storage
        .from('vault-images')
        .list(`${user.id}/`, { limit: 200 });

      if (listError) throw listError;

      const files = (data ?? []).filter((f) => f.name !== '.emptyFolderPlaceholder');

      const signedImages: VaultImage[] = await Promise.all(
        files.map(async (f) => {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('vault-images')
            .createSignedUrl(`${user.id}/${f.name}`, 3600);
          return {
            name: f.name,
            url: urlError || !urlData ? '' : urlData.signedUrl,
          };
        })
      );

      setImages(signedImages.filter((img) => img.url !== ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('vault-images')
          .upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
      }
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !user) return;
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase.storage
        .from('vault-images')
        .remove([`${user.id}/${deleteTarget.name}`]);
      if (deleteError) throw deleteError;
      setImages((prev) => prev.filter((img) => img.name !== deleteTarget.name));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 px-4 py-6 page-fade-in">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/welcome')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Back"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">🔒 My Vault</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Securely store your PR documents</p>
          </div>
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <span className="text-lg">📎</span> Upload Image
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">Loading images...</div>
        )}

        {/* Empty state */}
        {!loading && !error && images.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📂</div>
            <p className="text-gray-500 dark:text-slate-400 font-medium">No images yet</p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
              Tap &ldquo;Upload Image&rdquo; to add your first document
            </p>
          </div>
        )}

        {/* Image Grid */}
        {!loading && images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img) => (
              <div
                key={img.name}
                className="relative group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm aspect-square"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxImage(img)}
                />
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(img);
                  }}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label="Delete image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImage.url}
            alt={lightboxImage.name}
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">Delete Image</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6 text-sm">
              Are you sure you want to delete this image? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
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
