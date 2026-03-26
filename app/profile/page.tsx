'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { generateMonths } from '@/lib/months';
import { PR_CATEGORIES, JOURNEY_STEPS, JOURNEY_STEP_EMOJIS, VISA_OFFICE_STEPS, VISA_OFFICES, formatStepDate } from '@/lib/categories';

const PR_MONTHS = generateMonths();

// ─── Avatar definitions ───────────────────────────────────────────────────────
const AVATAR_LIST = [
  // adventurer – diverse skin tones
  { style: 'adventurer', seed: 'Anna',    skinColor: 'f2d3b1' },
  { style: 'adventurer', seed: 'Raj',     skinColor: 'c68642' },
  { style: 'adventurer', seed: 'Amara',   skinColor: '8d5524' },
  { style: 'adventurer', seed: 'Mike',    skinColor: 'e0ac69' },
  { style: 'adventurer', seed: 'Priya',   skinColor: 'c68642' },
  { style: 'adventurer', seed: 'Chen',    skinColor: 'f2d3b1' },
  { style: 'adventurer', seed: 'Sofia',   skinColor: 'd6a27d' },
  { style: 'adventurer', seed: 'Kali',    skinColor: '8d5524' },
  // big-ears
  { style: 'big-ears', seed: 'Felix' },
  { style: 'big-ears', seed: 'Luna' },
  { style: 'big-ears', seed: 'Coco' },
  { style: 'big-ears', seed: 'Milo' },
  { style: 'big-ears', seed: 'Nova' },
  { style: 'big-ears', seed: 'Zara' },
  // fun-emoji
  { style: 'fun-emoji', seed: 'Happy' },
  { style: 'fun-emoji', seed: 'Cool' },
  { style: 'fun-emoji', seed: 'Silly' },
  { style: 'fun-emoji', seed: 'Brave' },
  { style: 'fun-emoji', seed: 'Spark' },
  { style: 'fun-emoji', seed: 'Blaze' },
  // avataaars
  { style: 'avataaars', seed: 'John' },
  { style: 'avataaars', seed: 'Emily' },
  { style: 'avataaars', seed: 'Carlos' },
  { style: 'avataaars', seed: 'Mei' },
  { style: 'avataaars', seed: 'Aisha' },
  { style: 'avataaars', seed: 'Luca' },
  { style: 'avataaars', seed: 'Yuki' },
  { style: 'avataaars', seed: 'Omar' },
  // bottts – robots
  { style: 'bottts', seed: 'Robot1' },
  { style: 'bottts', seed: 'Robot2' },
  { style: 'bottts', seed: 'Robot3' },
  { style: 'bottts', seed: 'Robot4' },
  { style: 'bottts', seed: 'Robot5' },
  { style: 'bottts', seed: 'Robot6' },
];

function avatarUrl({ style, seed, skinColor }: { style: string; seed: string; skinColor?: string }) {
  const base = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
  return skinColor ? `${base}&skinColor=${skinColor}` : base;
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/adventurer/svg?seed=default';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [prMonth, setPrMonth] = useState('');
  const [prStream, setPrStream] = useState('');
  const [prCategory, setPrCategory] = useState('');
  const [avatarUrl_state, setAvatarUrl] = useState('');
  const [stepDates, setStepDates] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

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
        setAvatarUrl(data.avatar_url || '');

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
      avatar_url: avatarUrl_state || null,
      application_status: applicationStatus,
      pvo: stepDates['PVO (Inland)'] || null,
      svo: stepDates['SVO (Inland)'] || null,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      setError(profileError.message);
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
          {/* Avatar with glow ring */}
          <button
            type="button"
            onClick={() => setShowAvatarModal(true)}
            className="mx-auto block mb-3 relative group"
            aria-label="Change avatar"
          >
            <div className="w-20 h-20 rounded-full ring-4 ring-red-300 dark:ring-red-700 ring-offset-2 dark:ring-offset-slate-800 overflow-hidden bg-gray-100 dark:bg-slate-700 group-hover:ring-red-500 transition-all shadow-md">
              <Image
                src={avatarUrl_state || DEFAULT_AVATAR}
                alt="Avatar"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <span className="absolute bottom-0 right-0 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow">✏️</span>
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

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center px-4 z-50" onClick={() => setShowAvatarModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Choose Your Avatar</h2>
              <button onClick={() => setShowAvatarModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">✕</button>
            </div>
            <div className="overflow-y-auto p-4">
              <div className="grid grid-cols-5 gap-3">
                {AVATAR_LIST.map((av) => {
                  const url = avatarUrl(av);
                  const selected = avatarUrl_state === url;
                  return (
                    <button
                      key={url}
                      onClick={() => { setAvatarUrl(url); setShowAvatarModal(false); }}
                      className={`aspect-square rounded-full overflow-hidden border-4 transition-all hover:scale-110 ${selected ? 'border-red-500 shadow-lg shadow-red-200/50' : 'border-transparent hover:border-red-300'}`}
                    >
                      <Image src={url} alt="avatar option" width={64} height={64} className="w-full h-full object-cover" unoptimized />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
