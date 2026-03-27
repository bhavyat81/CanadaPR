'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { JOURNEY_STEPS, VISA_OFFICE_STEPS, VISA_OFFICES } from '@/lib/categories';

const SUCCESS_REDIRECT_DELAY = 1500;

interface BlockedUser {
  id: string;
  blocked_display_name: string;
}

export default function WelcomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [selectedStep, setSelectedStep] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

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

  // Load blocked users with their display names
  useEffect(() => {
    if (!user) return;

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
  }, [user]);

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

  const isVisaOfficeStep = VISA_OFFICE_STEPS.includes(selectedStep);

  const handleSave = async () => {
    if (!user || !selectedStep || !selectedValue) return;

    // Validate date is not in the future (only for regular date steps, not visa office steps)
    if (!isVisaOfficeStep) {
      const today = new Date().toISOString().split('T')[0];
      if (selectedValue > today) {
        setError('Date cannot be in the future.');
        return;
      }
    }

    setSaving(true);
    setError('');

    if (isVisaOfficeStep) {
      // Save PVO/SVO as text to profiles table (not journey_steps)
      const fieldKey =
        selectedStep === 'PVO (Inland)' ? 'pvo' :
        selectedStep === 'SVO (Inland)' ? 'svo' :
        null;

      if (!fieldKey) {
        setSaving(false);
        setError('Unrecognised visa office step.');
        return;
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ [fieldKey]: selectedValue, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (profileUpdateError) {
        setSaving(false);
        setError('Failed to save update. Please try again.');
        return;
      }
    } else {
      // Save to journey_steps table
      const { error: stepsError } = await supabase.from('journey_steps').upsert(
        {
          user_id: user.id,
          step_name: selectedStep,
          step_date: selectedValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,step_name' }
      );

      if (stepsError) {
        setSaving(false);
        setError('Failed to save update. Please try again.');
        return;
      }

      // Also update application_status for backwards compatibility
      const statusWithDate = `${selectedStep} (${selectedValue})`;
      await supabase
        .from('profiles')
        .update({
          application_status: statusWithDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    setSaving(false);
    setStep(4);
    setTimeout(() => {
      router.push('/groups');
    }, SUCCESS_REDIRECT_DELAY);
  };

  if (authLoading || !displayName) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
      <div className="max-w-md mx-auto space-y-6">

        {/* Journey Update Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">

          {/* Step 1: Welcome + Yes/No */}
          {step === 1 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🇨🇦</div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Welcome back, {displayName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Is there any new update you want to share?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => router.push('/groups')}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  No
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select journey step */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 text-sm flex items-center gap-1"
              >
                ← Back
              </button>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Which step did you complete?</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Select the step in your PR journey</p>
              <div className="space-y-3">
                {JOURNEY_STEPS.map((journeyStep, index) => (
                  <button
                    key={journeyStep}
                    onClick={() => {
                      setSelectedStep(journeyStep);
                      setSelectedValue('');
                      setStep(3);
                    }}
                    className="w-full text-left border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 font-medium w-5">{index + 1}.</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{journeyStep}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Date/office picker */}
          {step === 3 && (
            <div>
              <button
                onClick={() => setStep(2)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 text-sm flex items-center gap-1"
              >
                ← Back
              </button>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {isVisaOfficeStep ? 'Which visa office?' : 'When did you receive this update?'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                Step: <span className="font-medium text-red-600">{selectedStep}</span>
              </p>
              <div className="mb-6 mt-4">
                {isVisaOfficeStep ? (
                  <>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visa office</label>
                    <select
                      value={selectedValue}
                      onChange={(e) => setSelectedValue(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select visa office</option>
                      {VISA_OFFICES.map((office) => (
                        <option key={office} value={office}>{office}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date received</label>
                    <input
                      type="date"
                      value={selectedValue}
                      onChange={(e) => setSelectedValue(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </>
                )}
              </div>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={!selectedValue || saving}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Profile updated!</h2>
              <p className="text-gray-500 dark:text-gray-400">Redirecting you to the groups...</p>
            </div>
          )}
        </div>

        {/* Blocked Users Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span>🚫</span> Blocked Users
          </h2>
          {loadingBlocked ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : blockedUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">You haven&apos;t blocked anyone.</p>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((bu) => (
                <div key={bu.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{bu.blocked_display_name}</span>
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
  );
}
