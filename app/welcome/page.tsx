'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { initPushNotifications } from '@/lib/pushNotifications';
import { hapticLight } from '@/lib/haptics';

const HOW_TO_STEPS = [
  {
    title: '1. Set Up Your Profile',
    body: 'Go to "Update My Profile" → set your display name, PR application month, PR category, and fill in your journey milestones as they happen.',
  },
  {
    title: '2. Journey Step Abbreviations',
    items: [
      { abbr: 'Filed PR Application', desc: 'Date you submitted your PR application' },
      { abbr: 'Waiting AOR', desc: 'Period waiting for Acknowledgement of Receipt' },
      { abbr: 'Received AOR', desc: 'Date you received your AOR' },
      { abbr: 'AOR', desc: 'Acknowledgement of Receipt' },
      { abbr: 'BIL', desc: 'Biometrics Instruction Letter' },
      { abbr: 'ADR', desc: 'Additional Document Request' },
      { abbr: 'PVO', desc: 'Primary Visa Office (Inland)' },
      { abbr: 'SVO', desc: 'Secondary Visa Office (Inland)' },
      { abbr: 'PAL', desc: 'Pre Arrival Letter' },
      { abbr: 'PPR', desc: 'Passport Request' },
      { abbr: 'ECOPR', desc: 'Electronic Confirmation of Permanent Residence' },
      { abbr: 'P1', desc: 'Portal 1 (first IRCC portal update)' },
      { abbr: 'P2', desc: 'Portal 2 (second IRCC portal update)' },
    ],
  },
  {
    title: '3. Join Chat Groups',
    body: 'Go to "Chat Groups" → pick your PR category → join your application month\'s group to chat with others at the same stage.',
  },
  {
    title: '4. View Member Progress',
    body: 'In any chat group, tap on a member\'s username to see their current PR journey steps and dates.',
  },
  {
    title: '5. Group Journey Tracker',
    body: 'Use "Group Journey Tracker" from the home page to see a merged table of all members in your PR month group showing each person\'s journey step dates and day counts between steps.',
  },
];

export default function WelcomePage() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const pushInitRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !authError && !user) {
      router.push('/login');
    }
  }, [user, authLoading, authError, router]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (error) {
          // PGRST116 = no rows found = new user without a profile
          if (error.code === 'PGRST116') {
            router.push('/profile');
            return;
          }
          console.error('Profile load error:', error);
          setProfileError('Failed to load profile. Please try again.');
          return;
        }

        if (!profile || !profile.display_name?.trim()) {
          // Profile exists but display_name is not set — send to profile setup
          router.push('/profile');
          return;
        }

        setDisplayName(profile.display_name);
        // Initialize push notifications only once
        if (!pushInitRef.current) {
          pushInitRef.current = true;
          initPushNotifications(user.id);
        }
      } catch (err) {
        console.error('Profile load failed:', err);
        setProfileError('Failed to load profile. Please try again.');
      }
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

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Connection Error</p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Profile Error</p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">{profileError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (authLoading || !displayName) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  const handleShare = async () => {
    hapticLight();
    const shareUrl = 'https://apps.apple.com/ca/app/canadapr/id6760606035';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Canada PR Chat',
          text: 'Connect with fellow Canada PR applicants!',
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // clipboard not available
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  const dashboardCards = [
    { emoji: '👤', label: 'Update My Profile', href: '/profile' },
    { emoji: '💬', label: 'Chat Groups', href: '/groups' },
    { emoji: '📊', label: 'Express Entry Draws', href: '/draws' },
    { emoji: '📈', label: 'CRS Score Calculator', href: '/calculator' },
    { emoji: '🔒', label: 'My Vault', href: '/vault' },
    { emoji: '📊', label: 'Group Journey Tracker', href: '/tracker' },
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
          {/* Share App Card */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl px-4 py-4 border-l-4 border-green-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
          >
            <span className="text-2xl">📲</span>
            <span className="flex-1 font-semibold text-gray-800 dark:text-slate-100">Share App</span>
            <span className="text-gray-400 dark:text-slate-500 text-lg">↗</span>
          </button>
        </div>

        {/* How to Use This App */}
        <div className="mt-2">
          <button
            onClick={() => setShowGuide((v) => !v)}
            className="w-full flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl px-4 py-4 border-l-4 border-blue-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
          >
            <span className="text-2xl">📖</span>
            <span className="flex-1 font-semibold text-gray-800 dark:text-slate-100">How to Use This App</span>
            <span className="text-gray-400 dark:text-slate-500 text-lg">{showGuide ? '▲' : '▼'}</span>
          </button>

          {showGuide && (
            <div className="bg-white dark:bg-slate-800 rounded-b-xl border border-t-0 border-gray-200 dark:border-slate-700 px-4 pb-5 pt-4 space-y-4 text-sm text-gray-700 dark:text-slate-300">
              {HOW_TO_STEPS.map((step) => (
                <div key={step.title}>
                  <p className="font-semibold text-gray-800 dark:text-slate-100 mb-1">{step.title}</p>
                  {'body' in step && step.body && (
                    <p className="text-gray-600 dark:text-slate-400">{step.body}</p>
                  )}
                  {'items' in step && step.items && (
                    <ul className="space-y-1 mt-1">
                      {step.items.map((item) => (
                        <li key={item.abbr} className="flex gap-2">
                          <span className="font-medium text-gray-800 dark:text-slate-200 shrink-0">{item.abbr}</span>
                          <span className="text-gray-500 dark:text-slate-400">— {item.desc}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
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

      {/* Share toast */}
      {shareToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-slate-700 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50 animate-fade-in">
          🔗 Link copied!
        </div>
      )}

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
