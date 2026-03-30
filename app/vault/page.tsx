'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface VaultPhoto {
  id: string;
  dataUrl: string;
  name: string;
  createdAt: string;
}

export default function VaultPage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError } = useAuth();
  const [photos, setPhotos] = useState<VaultPhoto[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<VaultPhoto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const storageKey = user ? `vault_photos_${user.id}` : null;

  useEffect(() => {
    if (!authLoading && !authError && !user && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      router.push('/login');
    }
  }, [user, authLoading, authError, router]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setPhotos(raw ? (JSON.parse(raw) as VaultPhoto[]) : []);
    } catch {
      setPhotos([]);
    }
  }, [storageKey]);

  const savePhotos = (updated: VaultPhoto[]) => {
    setPhotos(updated);
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // localStorage full — notify user
      alert('Storage full. Unable to save photo. Please delete some photos first.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';

    Promise.all(
      files.map(
        (file) =>
          new Promise<VaultPhoto>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: crypto.randomUUID(),
                dataUrl: reader.result as string,
                name: file.name,
                createdAt: new Date().toISOString(),
              });
            };
            reader.readAsDataURL(file);
          })
      )
    ).then((newPhotos) => {
      savePhotos([...newPhotos, ...photos]);
    });
  };

  const handleDelete = (id: string) => {
    savePhotos(photos.filter((p) => p.id !== id));
    setDeleteId(null);
    if (lightboxPhoto?.id === id) setLightboxPhoto(null);
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
          Securely store your important PR document photos on this device.
        </p>

        {/* Add Photo Button */}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-red-200/50 dark:shadow-red-900/30"
        >
          + Add Photo
        </button>

        {/* Count */}
        {photos.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'} stored
          </p>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">
            <div className="text-4xl mb-3">🖼️</div>
            <p className="font-medium">No photos yet</p>
            <p className="text-sm mt-1">Tap &quot;+ Add Photo&quot; to pick from your gallery</p>
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-200 dark:bg-slate-700 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.dataUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxPhoto(photo)}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(photo.id); }}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-center text-gray-400 dark:text-slate-500 pb-4">
          Your photos are stored locally on this device.
        </p>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50"
          onClick={() => setLightboxPhoto(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxPhoto.dataUrl}
            alt={lightboxPhoto.name}
            className="max-w-full max-h-[80vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-4 flex items-center gap-4">
            <p className="text-white/70 text-sm truncate max-w-[200px]">{lightboxPhoto.name}</p>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteId(lightboxPhoto.id); }}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-800 dark:text-slate-100 text-lg mb-2">Delete Photo?</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-5">
              This photo will be permanently deleted from your vault.
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
