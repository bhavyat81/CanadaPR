'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import CRSCalculator from '@/components/CRSCalculator';

interface BlockedUser {
  blocked_id: string;
  display_name: string | null;
}

type SectionId = 'crs' | 'draws' | 'profile' | 'blocked';

const LATEST_DRAWS = [
  { date: 'Mar 20, 2025', type: 'General', crs: 529, invitations: '1,000' },
  { date: 'Mar 12, 2025', type: 'Category-based (Healthcare)', crs: 422, invitations: '2,000' },
  { date: 'Feb 28, 2025', type: 'General', crs: 524, invitations: '2,000' },
  { date: 'Feb 13, 2025', type: 'Category-based (STEM)', crs: 415, invitations: '3,000' },
  { date: 'Jan 30, 2025', type: 'General', crs: 518, invitations: '5,500' },
];

interface AccordionSectionProps {
  icon: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ icon, title, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-gray-800 dark:text-white">{title}</span>
        </span>
        <span
          className="text-gray-400 dark:text-gray-500 text-xs transition-transform duration-300"
          style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? '2000px' : '0px' }}
      >
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [openSection, setOpenSection] = useState<SectionId | null>(null);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

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

  useEffect(() => {
    if (openSection === 'blocked' && user) {
      loadBlockedUsers();
    }
  // loadBlockedUsers is stable (references user via closure); openSection + user are the true triggers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSection, user]);

  const loadBlockedUsers = async () => {
    if (!user) return;
    setBlockedLoading(true);

    const { data: blocksData } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);

    if (blocksData && blocksData.length > 0) {
      const ids = blocksData.map((b: { blocked_id: string }) => b.blocked_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', ids);

      const nameMap: Record<string, string | null> = {};
      (profilesData ?? []).forEach((p: { id: string; display_name: string | null }) => {
        nameMap[p.id] = p.display_name;
      });

      setBlockedUsers(
        blocksData.map((b: { blocked_id: string }) => ({
          blocked_id: b.blocked_id,
          display_name: nameMap[b.blocked_id] ?? null,
        }))
      );
    } else {
      setBlockedUsers([]);
    }

    setBlockedLoading(false);
  };

  const handleUnblock = async (blockedId: string) => {
    if (!user) return;
    await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedId);
    setBlockedUsers((prev) => prev.filter((u) => u.blocked_id !== blockedId));
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

    const { error: signOutError } = await supabase.auth.signOut();
    setShowDeleteModal(false);
    setDeleteLoading(false);

    if (signOutError) {
      setDeleteError(
        'Your data was deleted but we could not sign you out automatically. Please log out manually.'
      );
      return;
    }

    router.push('/');
  };

  const toggleSection = (id: SectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  if (authLoading || !displayName) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Greeting */}
        <div className="text-center pb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {displayName}! 🇨🇦
          </h1>
        </div>

        {/* Go to Chat Groups */}
        <Link
          href="/groups"
          className="block w-full bg-red-600 text-white text-center py-3.5 rounded-2xl font-semibold hover:bg-red-700 transition-colors shadow-sm text-base"
        >
          Go to Chat Groups →
        </Link>

        {/* CRS Calculator */}
        <AccordionSection
          icon="📊"
          title="CRS Calculator"
          isOpen={openSection === 'crs'}
          onToggle={() => toggleSection('crs')}
        >
          <CRSCalculator />
        </AccordionSection>

        {/* Latest Draws */}
        <AccordionSection
          icon="📈"
          title="Latest Draws"
          isOpen={openSection === 'draws'}
          onToggle={() => toggleSection('draws')}
        >
          <div className="overflow-x-auto -mx-1 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Date
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Draw Type
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    CRS Cut-off
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Invitations
                  </th>
                </tr>
              </thead>
              <tbody>
                {LATEST_DRAWS.map((draw, i) => (
                  <tr
                    key={i}
                    className={
                      i % 2 === 0
                        ? 'bg-white dark:bg-gray-900'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }
                  >
                    <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap text-xs">
                      {draw.date}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 text-xs">
                      {draw.type}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-red-600 dark:text-red-400">
                      {draw.crs}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-700 dark:text-gray-300 text-xs">
                      {draw.invitations}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Data is illustrative. Check IRCC for official draw results.
          </p>
        </AccordionSection>

        {/* Update My Profile */}
        <AccordionSection
          icon="👤"
          title="Update My Profile"
          isOpen={openSection === 'profile'}
          onToggle={() => toggleSection('profile')}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Update your display name, PR category, application month, and journey milestones.
          </p>
          <Link
            href="/profile"
            className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm"
          >
            Go to Profile →
          </Link>
        </AccordionSection>

        {/* Blocked Users */}
        <AccordionSection
          icon="🚫"
          title="Blocked Users"
          isOpen={openSection === 'blocked'}
          onToggle={() => toggleSection('blocked')}
        >
          {blockedLoading ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Loading...</p>
          ) : blockedUsers.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              You haven&apos;t blocked anyone.
            </p>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((u) => (
                <div
                  key={u.blocked_id}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-3"
                >
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    @{u.display_name ?? 'Unknown User'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUnblock(u.blocked_id)}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </AccordionSection>

        {/* Delete Account danger button */}
        <div className="pt-2 pb-6">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 py-3 rounded-2xl font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            🗑️ Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Delete Account
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Are you sure you want to delete your account? This will permanently delete all your
                data including your profile, messages, and group memberships. This action cannot be
                undone.
              </p>
            </div>

            {deleteError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError('');
                }}
                disabled={deleteLoading}
                className="w-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
