'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { generateMonths } from '@/lib/months';
import { PR_CATEGORIES, JOURNEY_STEPS, JOURNEY_STEP_EMOJIS, VISA_OFFICE_STEPS, VISA_OFFICES, formatStepDate } from '@/lib/categories';
import { getDefaultAvatar } from '@/lib/avatars';
import AvatarPickerModal from '@/components/AvatarPickerModal';
import { hapticSuccess, hapticError } from '@/lib/haptics';

const PR_MONTHS = generateMonths();


export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [prMonth, setPrMonth] = useState('');
  const [prStream, setPrStream] = useState('');
  const [prCategory, setPrCategory] = useState('');
  const [stepDates, setStepDates] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const [profileResult, stepsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('journey_steps').select('step_name, step_date').eq('user_id', user.id),
      ]);

      if (profileResult.data) {
        const data = profileResult.data;
        setDisplayName(data.display_name || '');
        setPrMonth(data.pr_month || '');
        setPrStream(data.pr_stream || '');
        setPrCategory(data.pr_category || '');
        setAvatarEmoji(data.avatar_emoji || getDefaultAvatar(user.id));

        // Load PVO/SVO from profiles text columns into stepDates
        const visaOfficeValues: Record<string, string> = {};
        if (data.pvo) visaOfficeValues['PVO (Inland)'] = data.pvo;
        if (data.svo) visaOfficeValues['SVO (Inland)'] = data.svo;
        setStepDates((prev) => ({ ...prev, ...visaOfficeValues }));
      }

      if (!stepsResult.error && stepsResult.data) {
        const dates: Record<string, string> = {};
        stepsResult.data.forEach(({ step_name, step_date }) => {
          // Skip visa office steps – they are stored in profiles.pvo / profiles.svo
          if (!VISA_OFFICE_STEPS.includes(step_name) && step_date) {
            dates[step_name] = step_date;
          }
        });
        setStepDates((prev) => ({ ...prev, ...dates }));
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');

    // Determine latest step for backwards-compatible application_status
    const latestStep = [...JOURNEY_STEPS].reverse().find((s) => stepDates[s]);
    const applicationStatus = latestStep
      ? `${latestStep} (${stepDates[latestStep]})`
      : '';

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName,
      pr_month: prMonth,
      pr_stream: prStream,
      pr_category: prCategory,
      application_status: applicationStatus,
      avatar_emoji: avatarEmoji,
      pvo: stepDates['PVO (Inland)'] || null,
      svo: stepDates['SVO (Inland)'] || null,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      setError(profileError.message);
      hapticError();
      setLoading(false);
      return;
    }

    // Upsert journey steps for each non-visa-office step that has a date
    const stepsToUpsert = JOURNEY_STEPS.filter((step) => !VISA_OFFICE_STEPS.includes(step) && stepDates[step]).map((step) => ({
      user_id: user.id,
      step_name: step,
      step_date: stepDates[step],
      updated_at: new Date().toISOString(),
    }));

    if (stepsToUpsert.length > 0) {
      const { error: stepsError } = await supabase
        .from('journey_steps')
        .upsert(stepsToUpsert, { onConflict: 'user_id,step_name' });

      if (stepsError) {
        setError(stepsError.message);
        setLoading(false);
        return;
      }
    }

    setSuccess('Profile saved successfully!');
    hapticSuccess();
    setTimeout(() => router.push('/groups'), 1500);
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteLoading(true);
    setDeleteError('');

    // Delete from group_members
    const { error: membersError } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', user.id);

    if (membersError) {
      setDeleteError(membersError.message);
      setDeleteLoading(false);
      return;
    }

    // Delete from profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      setDeleteError(profileError.message);
      setDeleteLoading(false);
      return;
    }

    // Sign out the user
    const { error: signOutError } = await supabase.auth.signOut();

    setShowDeleteModal(false);
    setDeleteLoading(false);

    if (signOutError) {
      setDeleteError('Your data was deleted but we could not sign you out automatically. Please log out manually.');
      return;
    }

    // Show confirmation message then redirect
    setSuccess(
      'Your account data has been deleted. Your authentication account will be fully removed within 30 days. You have been signed out.'
    );
    setTimeout(() => router.push('/'), 3000);
  };

  const handleStepDate = (step: string, value: string) => {
    setStepDates((prev) => ({ ...prev, [step]: value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-4 page-fade-in">
      <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-slate-900/50 p-8 border border-transparent dark:border-slate-700">
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={() => setShowAvatarPicker(true)}
            className="text-5xl mb-2 block mx-auto hover:scale-110 transition-transform"
            aria-label="Change avatar"
          >
            {avatarEmoji || '👤'}
          </button>
          <button
            type="button"
            onClick={() => setShowAvatarPicker(true)}
            className="text-xs text-red-600 dark:text-red-400 hover:underline mb-2"
          >
            Change Avatar
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Your Profile</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Tell us about your PR application</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-gray-900 dark:text-slate-100 dark:bg-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">PR Application Month</label>
            <select
              value={prMonth}
              onChange={(e) => setPrMonth(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select your application month</option>
              {PR_MONTHS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">PR Category</label>
            <select
              value={prCategory}
              onChange={(e) => setPrCategory(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select your PR category</option>
              {PR_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Journey Step Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              PR Journey Milestones <span className="text-gray-400 font-normal">(tap a milestone to set its value)</span>
            </label>
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-slate-700 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden">
              {JOURNEY_STEPS.map((step) => {
                const isVisaOfficeStep = VISA_OFFICE_STEPS.includes(step);
                return (
                  <div key={step}>
                    <button
                      type="button"
                      onClick={() => setActiveStep(activeStep === step ? null : step)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base w-6 text-center">{JOURNEY_STEP_EMOJIS[step] ?? '📌'}</span>
                        <span className="text-sm text-gray-800 dark:text-slate-200">{step}</span>
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400 ml-2 shrink-0">
                        {stepDates[step] ? (isVisaOfficeStep ? stepDates[step] : formatStepDate(stepDates[step])) : <span className="text-gray-300 dark:text-slate-600">—</span>}
                      </span>
                    </button>
                    {activeStep === step && (
                      <div className="px-4 pb-3 pt-1 flex items-center gap-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
                        {isVisaOfficeStep ? (
                          <select
                            value={stepDates[step] || ''}
                            onChange={(e) => handleStepDate(step, e.target.value)}
                            autoFocus
                            className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="">Select visa office</option>
                            {VISA_OFFICES.map((office) => (
                              <option key={office} value={office}>{office}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="date"
                            value={stepDates[step] || ''}
                            onChange={(e) => handleStepDate(step, e.target.value)}
                            autoFocus
                            className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        )}
                        {stepDates[step] && (
                          <button
                            type="button"
                            onClick={() => handleStepDate(step, '')}
                            className="text-gray-400 hover:text-red-500 text-sm"
                            aria-label={`Clear ${step}`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {/* Delete Account Section */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Danger Zone</h2>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 py-3 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete My Account
          </button>
        </div>
      </div>


      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md border border-transparent dark:border-slate-700">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">Delete Account</h2>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Are you sure you want to delete your account? This will permanently delete all your
                data including your profile, messages, and group memberships. This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}
                disabled={deleteLoading}
                className="w-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <AvatarPickerModal
          currentAvatar={avatarEmoji || getDefaultAvatar(user?.id ?? '')}
          onSelect={(emoji) => { setAvatarEmoji(emoji); setShowAvatarPicker(false); }}
          onCancel={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
}
