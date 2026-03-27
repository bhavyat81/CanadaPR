'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import CRSCalculator from '@/components/CRSCalculator';

// ─── Latest Draws data ───────────────────────────────────────────────────────
const LATEST_DRAWS = [
  { date: 'Dec 17, 2025', type: 'CEC', crs: 515, itas: '5,000' },
  { date: 'Dec 16, 2025', type: 'PNP', crs: 731, itas: '399' },
  { date: 'Dec 11, 2025', type: 'Healthcare & Social Services', crs: 476, itas: '1,000' },
  { date: 'Dec 10, 2025', type: 'CEC', crs: 520, itas: '6,000' },
  { date: 'Nov 28, 2025', type: 'French Language', crs: 408, itas: '6,000' },
  { date: 'Nov 25, 2025', type: 'CEC', crs: 531, itas: '1,000' },
  { date: 'Nov 25, 2025', type: 'PNP', crs: 699, itas: '777' },
  { date: 'Oct 29, 2025', type: 'French Language', crs: 416, itas: '6,000' },
  { date: 'Oct 15, 2025', type: 'Healthcare & Social Services', crs: 472, itas: '2,500' },
  { date: 'Sept 18, 2025', type: 'Trade Occupations', crs: 505, itas: '1,250' },
];

interface BlockedUser {
  id: string;
  blocked_display_name: string;
}

// ─── Accordion section IDs ────────────────────────────────────────────────────
type SectionId = 'profile' | 'draws' | 'crs' | 'blocked' | 'vault' | null;

// ─── Chevron icon ─────────────────────────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function WelcomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [openSection, setOpenSection] = useState<SectionId>(null);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  // Vault
  const [vaultImages, setVaultImages] = useState<{ name: string; url: string }[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [uploadingVault, setUploadingVault] = useState(false);
  const vaultFileInputRef = useRef<HTMLInputElement | null>(null);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
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
      } finally {
        setDataLoading(false);
      }
    };

    loadProfile();
  }, [user, router]);

  // Load blocked users when that section is opened
  useEffect(() => {
    if (openSection !== 'blocked' || !user) return;
    if (blockedUsers.length > 0) return; // already loaded

    const loadBlockedUsers = async () => {
      setLoadingBlocked(true);
      const { data: blocks } = await supabase
        .from('blocks')
        .select('id, blocked_id')
        .eq('blocker_id', user.id);

      if (!blocks || blocks.length === 0) {
        setBlockedUsers([]);
        setLoadingBlocked(false);
        return;
      }

      const blockedUserIds = blocks.map((b: { id: string; blocked_id: string }) => b.blocked_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', blockedUserIds);

      const profileMap: Record<string, string> = {};
      if (profiles) {
        (profiles as Array<{ id: string; display_name: string }>).forEach((p) => {
          profileMap[p.id] = p.display_name;
        });
      }

      setBlockedUsers(
        blocks.map((b: { id: string; blocked_id: string }) => ({
          id: b.id,
          blocked_display_name: profileMap[b.blocked_id] ?? 'Unknown User',
        }))
      );
      setLoadingBlocked(false);
    };

    loadBlockedUsers();
  }, [openSection, user, blockedUsers.length]);

  // Load vault images when that section is opened
  const loadVaultImages = async () => {
    if (!user) return;
    setLoadingVault(true);
    const { data, error } = await supabase.storage
      .from('vault-images')
      .list(`${user.id}/`, { limit: 100 });
    if (!error && data) {
      const images = data
        .filter((f) => f.name !== '.emptyFolderPlaceholder')
        .map((f) => {
          const { data: urlData } = supabase.storage
            .from('vault-images')
            .getPublicUrl(`${user.id}/${f.name}`);
          return { name: f.name, url: urlData.publicUrl };
        });
      setVaultImages(images);
    } else {
      setVaultImages([]);
    }
    setLoadingVault(false);
  };

  useEffect(() => {
    if (openSection === 'vault') {
      loadVaultImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSection, user]);

  const handleVaultUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';

    setUploadingVault(true);
    const mimeExt = file.type.split('/')[1]?.toLowerCase().replace('jpeg', 'jpg') ?? '';
    const allowedExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic']);
    const nameExt = file.name.split('.').pop()?.toLowerCase() ?? '';
    const ext = allowedExts.has(mimeExt) ? mimeExt : allowedExts.has(nameExt) ? nameExt : 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('vault-images')
      .upload(path, file, { upsert: false });

    setUploadingVault(false);

    if (uploadError) {
      console.error('Failed to upload vault image:', uploadError);
      return;
    }

    await loadVaultImages();
  };

  const handleVaultDelete = async (imageName: string) => {
    if (!user) return;
    const path = `${user.id}/${imageName}`;
    const { error } = await supabase.storage.from('vault-images').remove([path]);
    if (error) {
      console.error('Failed to delete vault image:', error);
      return;
    }
    setVaultImages((prev) => prev.filter((img) => img.name !== imageName));
  };

  const handleUnblock = async (blockId: string) => {
    if (!user || unblockingId) return;
    setUnblockingId(blockId);

    const { error: unblockError } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId)
      .eq('blocker_id', user.id);

    if (unblockError) {
      console.error('Failed to unblock user:', unblockError);
      setUnblockingId(null);
      return;
    }

    setBlockedUsers((prev) => prev.filter((b) => b.id !== blockId));
    setUnblockingId(null);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteLoading(true);
    setDeleteError('');

    const { error: membersError } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', user.id);

    if (membersError) {
      setDeleteError(membersError.message);
      setDeleteLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      setDeleteError(profileError.message);
      setDeleteLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setShowDeleteModal(false);
    setDeleteLoading(false);
    router.push('/');
  };

  const toggleSection = (id: SectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const sectionCardClass =
    'bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden';
  const sectionHeaderClass =
    'w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none';

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 space-y-4"
      style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-lg mx-auto space-y-4">

        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 text-center">
          <div className="text-4xl mb-2">🇨🇦</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Welcome, {displayName}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Your Canada PR journey hub
          </p>
          <Link
            href="/groups"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Go to Chat Groups →
          </Link>
        </div>

        {/* ── 1. Update My Profile ──────────────────────────────────────── */}
        <div className={sectionCardClass}>
          <button
            onClick={() => toggleSection('profile')}
            className={sectionHeaderClass}
            aria-expanded={openSection === 'profile'}
          >
            <span className="flex items-center gap-3 text-gray-800 dark:text-white font-semibold">
              <span className="text-xl">👤</span> Update My Profile
            </span>
            <Chevron open={openSection === 'profile'} />
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              openSection === 'profile' ? 'max-h-40' : 'max-h-0'
            }`}
          >
            <div className="px-5 pb-5 space-y-3 border-t dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 pt-3">
                Update your display name, PR category, application month, and journey milestones.
              </p>
              <Link
                href="/profile"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Go to Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* ── 2. Latest Draws ────────────────────────────────────────────── */}
        <div className={sectionCardClass}>
          <button
            onClick={() => toggleSection('draws')}
            className={sectionHeaderClass}
            aria-expanded={openSection === 'draws'}
          >
            <span className="flex items-center gap-3 text-gray-800 dark:text-white font-semibold">
              <span className="text-xl">📈</span> Latest Draws
            </span>
            <Chevron open={openSection === 'draws'} />
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              openSection === 'draws' ? 'max-h-[600px]' : 'max-h-0'
            }`}
          >
            <div className="px-4 pb-5 border-t dark:border-gray-700">
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400">
                      <th className="pb-2 font-semibold pr-2">Date</th>
                      <th className="pb-2 font-semibold pr-2">Type</th>
                      <th className="pb-2 font-semibold text-right pr-2">CRS</th>
                      <th className="pb-2 font-semibold text-right">ITAs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LATEST_DRAWS.map((draw, i) => (
                      <tr
                        key={i}
                        className={`border-t dark:border-gray-700 ${
                          i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : ''
                        }`}
                      >
                        <td className="py-2 pr-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {draw.date}
                        </td>
                        <td className="py-2 pr-2 text-gray-800 dark:text-gray-200">
                          {draw.type}
                        </td>
                        <td className="py-2 pr-2 text-right font-bold text-gray-900 dark:text-white">
                          {draw.crs}
                        </td>
                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">
                          {draw.itas}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Historical 2025 data for reference only. Always verify with the{' '}
                <a
                  href="https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  official IRCC draw results
                </a>.
              </p>
              <Link
                href="/draws"
                className="mt-3 inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                View All Draws →
              </Link>
            </div>
          </div>
        </div>

        {/* ── 3. CRS Score Calculator ───────────────────────────────────── */}
        <div className={sectionCardClass}>
          <button
            onClick={() => toggleSection('crs')}
            className={sectionHeaderClass}
            aria-expanded={openSection === 'crs'}
          >
            <span className="flex items-center gap-3 text-gray-800 dark:text-white font-semibold">
              <span className="text-xl">📊</span> CRS Score Calculator
            </span>
            <Chevron open={openSection === 'crs'} />
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              openSection === 'crs' ? 'max-h-[9999px]' : 'max-h-0'
            }`}
          >
            <div className="px-5 pb-5 border-t dark:border-gray-700 pt-4">
              <CRSCalculator />
            </div>
          </div>
        </div>

        {/* ── 4. Blocked Users ──────────────────────────────────────────── */}
        <div className={sectionCardClass}>
          <button
            onClick={() => toggleSection('blocked')}
            className={sectionHeaderClass}
            aria-expanded={openSection === 'blocked'}
          >
            <span className="flex items-center gap-3 text-gray-800 dark:text-white font-semibold">
              <span className="text-xl">🚫</span> Blocked Users
            </span>
            <Chevron open={openSection === 'blocked'} />
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              openSection === 'blocked' ? 'max-h-[600px]' : 'max-h-0'
            }`}
          >
            <div className="px-5 pb-5 border-t dark:border-gray-700 pt-4">
              {loadingBlocked ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
              ) : blockedUsers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You haven&apos;t blocked anyone.
                </p>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((bu) => (
                    <div
                      key={bu.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3"
                    >
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {bu.blocked_display_name}
                      </span>
                      <button
                        onClick={() => handleUnblock(bu.id)}
                        disabled={unblockingId === bu.id}
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
                      >
                        {unblockingId === bu.id ? 'Unblocking...' : 'Unblock'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 5. My Vault ───────────────────────────────────────────────── */}
        {/* Hidden file input for vault uploads */}
        <input
          ref={vaultFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleVaultUpload}
        />
        <div className={sectionCardClass}>
          <button
            onClick={() => toggleSection('vault')}
            className={sectionHeaderClass}
            aria-expanded={openSection === 'vault'}
          >
            <span className="flex items-center gap-3 text-gray-800 dark:text-white font-semibold">
              <span className="text-xl">🔒</span> My Vault
            </span>
            <Chevron open={openSection === 'vault'} />
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              openSection === 'vault' ? 'max-h-[9999px]' : 'max-h-0'
            }`}
          >
            <div className="px-5 pb-5 border-t dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Store private photos here. Only you can see them.
              </p>
              <button
                onClick={() => vaultFileInputRef.current?.click()}
                disabled={uploadingVault}
                className="mb-4 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {uploadingVault ? 'Uploading…' : '+ Add Photo'}
              </button>

              {loadingVault ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
              ) : vaultImages.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No photos yet. Tap &quot;+ Add Photo&quot; to add one.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {vaultImages.map((img) => (
                    <div key={img.name} className="relative group aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt="Vault photo"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        onClick={() => handleVaultDelete(img.name)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Delete Account ─────────────────────────────────────────────── */}
        <div className="pt-2">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            🗑️ Delete Account
          </button>
        </div>
      </div>

      {/* ── Delete confirmation modal ──────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Delete Account?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will permanently delete your profile, remove you from all groups, and sign you
              out. This action cannot be undone.
            </p>
            {deleteError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError('');
                }}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
