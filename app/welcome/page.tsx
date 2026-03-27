'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export default function WelcomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push('/profile');
        return;
      }

      setDisplayName(profile.display_name);
    };

    loadProfile();
  }, [user, router]);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await supabase.rpc('delete_user');
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      setDeleting(false);
      setShowDeleteModal(false);
      alert('Failed to delete account. Please try again or contact support.');
    }
  };

  if (authLoading || !displayName) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  const dashboardCards = [
    { emoji: '👤', label: 'Update My Profile', href: '/profile' },
    { emoji: '📊', label: 'Express Entry Draws', href: '/draws' },
    { emoji: '📈', label: 'CRS Score Calculator', href: '/calculator' },
    { emoji: '🔒', label: 'My Vault', href: '/vault' },
    { emoji: '💬', label: 'Chat Groups', href: '/groups' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 px-4 py-8 page-fade-in">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Welcome Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
            Welcome back, {displayName}! 🇨🇦
          </h1>
        </div>

        {/* Dashboard Cards */}
        <div className="space-y-3">
          {dashboardCards.map((card) => (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              className="w-full flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl px-4 py-4 border-l-4 border-red-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
            >
              <span className="text-2xl">{card.emoji}</span>
              <span className="flex-1 font-semibold text-gray-800 dark:text-slate-100">{card.label}</span>
              <span className="text-gray-400 dark:text-slate-500 text-lg">→</span>
            </button>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="mt-8 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3 px-1">
            ⚠️ Danger Zone
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl px-4 py-4 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
          >
            <span className="text-2xl">🗑️</span>
            <span className="flex-1 font-semibold">Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">Delete Account</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6 text-sm">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
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
