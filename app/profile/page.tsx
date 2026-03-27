'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { generateMonths } from '@/lib/months';
import { requestNotificationPermission, getNotificationPermission } from '@/lib/notifications';
import { PR_CATEGORIES, JOURNEY_STEPS, JOURNEY_STEP_EMOJIS, VISA_OFFICE_STEPS, VISA_OFFICES, formatStepDate } from '@/lib/categories';

const PR_MONTHS = generateMonths();

// ─── Avatar definitions ───────────────────────────────────────────────────────
const AVATAR_LIST = [
  // adventurer – diverse skin tones (28 total)
  { style: 'adventurer', seed: 'Anna',    skinColor: 'f2d3b1' },
  { style: 'adventurer', seed: 'Raj',     skinColor: 'c68642' },
  { style: 'adventurer', seed: 'Amara',   skinColor: '8d5524' },
  { style: 'adventurer', seed: 'Mike',    skinColor: 'e0ac69' },
  { style: 'adventurer', seed: 'Priya',   skinColor: 'c68642' },
  { style: 'adventurer', seed: 'Chen',    skinColor: 'f2d3b1' },
  { style: 'adventurer', seed: 'Sofia',   skinColor: 'd6a27d' },
  { style: 'adventurer', seed: 'Kali',    skinColor: '8d5524' },
  { style: 'adventurer', seed: 'Tariq',   skinColor: 'a0522d' },
  { style: 'adventurer', seed: 'Mei',     skinColor: 'ffd5b8' },
  { style: 'adventurer', seed: 'Hassan',  skinColor: '4a2c0a' },
  { style: 'adventurer', seed: 'Ingrid',  skinColor: 'f2d3b1' },
  { style: 'adventurer', seed: 'Yara',    skinColor: 'e0ac69' },
  { style: 'adventurer', seed: 'Kwame',   skinColor: '4a2c0a' },
  { style: 'adventurer', seed: 'Elena',   skinColor: 'd6a27d' },
  { style: 'adventurer', seed: 'Lior',    skinColor: 'c68642' },
  { style: 'adventurer', seed: 'Nadia',   skinColor: '8d5524' },
  { style: 'adventurer', seed: 'Omar',    skinColor: 'a0522d' },
  { style: 'adventurer', seed: 'Zoe',     skinColor: 'ffd5b8' },
  { style: 'adventurer', seed: 'Diego',   skinColor: 'c68642' },
  { style: 'adventurer', seed: 'Fatima',  skinColor: '8d5524' },
  { style: 'adventurer', seed: 'Sven',    skinColor: 'f2d3b1' },
  { style: 'adventurer', seed: 'Layla',   skinColor: 'e0ac69' },
  { style: 'adventurer', seed: 'Kofi',    skinColor: '4a2c0a' },
  { style: 'adventurer', seed: 'Rina',    skinColor: 'ffd5b8' },
  { style: 'adventurer', seed: 'Pedro',   skinColor: 'd6a27d' },
  { style: 'adventurer', seed: 'Asel',    skinColor: 'c68642' },
  { style: 'adventurer', seed: 'Binta',   skinColor: '4a2c0a' },
  // big-ears (20 total)
  { style: 'big-ears', seed: 'Felix' },
  { style: 'big-ears', seed: 'Luna' },
  { style: 'big-ears', seed: 'Coco' },
  { style: 'big-ears', seed: 'Milo' },
  { style: 'big-ears', seed: 'Nova' },
  { style: 'big-ears', seed: 'Zara' },
  { style: 'big-ears', seed: 'Oscar' },
  { style: 'big-ears', seed: 'Bella' },
  { style: 'big-ears', seed: 'Max' },
  { style: 'big-ears', seed: 'Ivy' },
  { style: 'big-ears', seed: 'Finn' },
  { style: 'big-ears', seed: 'Aria' },
  { style: 'big-ears', seed: 'Leo' },
  { style: 'big-ears', seed: 'Nora' },
  { style: 'big-ears', seed: 'Sam' },
  { style: 'big-ears', seed: 'Tara' },
  { style: 'big-ears', seed: 'Hugo' },
  { style: 'big-ears', seed: 'Vera' },
  { style: 'big-ears', seed: 'Jack' },
  { style: 'big-ears', seed: 'Mia' },
  // fun-emoji (20 total)
  { style: 'fun-emoji', seed: 'Happy' },
  { style: 'fun-emoji', seed: 'Cool' },
  { style: 'fun-emoji', seed: 'Silly' },
  { style: 'fun-emoji', seed: 'Brave' },
  { style: 'fun-emoji', seed: 'Spark' },
  { style: 'fun-emoji', seed: 'Blaze' },
  { style: 'fun-emoji', seed: 'Jolly' },
  { style: 'fun-emoji', seed: 'Cheery' },
  { style: 'fun-emoji', seed: 'Sunny' },
  { style: 'fun-emoji', seed: 'Goofy' },
  { style: 'fun-emoji', seed: 'Zippy' },
  { style: 'fun-emoji', seed: 'Breezy' },
  { style: 'fun-emoji', seed: 'Quirky' },
  { style: 'fun-emoji', seed: 'Zesty' },
  { style: 'fun-emoji', seed: 'Peppy' },
  { style: 'fun-emoji', seed: 'Nifty' },
  { style: 'fun-emoji', seed: 'Dandy' },
  { style: 'fun-emoji', seed: 'Snappy' },
  { style: 'fun-emoji', seed: 'Fizzy' },
  { style: 'fun-emoji', seed: 'Wacky' },
  // avataaars (28 total)
  { style: 'avataaars', seed: 'John' },
  { style: 'avataaars', seed: 'Emily' },
  { style: 'avataaars', seed: 'Carlos' },
  { style: 'avataaars', seed: 'Mei' },
  { style: 'avataaars', seed: 'Aisha' },
  { style: 'avataaars', seed: 'Luca' },
  { style: 'avataaars', seed: 'Yuki' },
  { style: 'avataaars', seed: 'Omar' },
  { style: 'avataaars', seed: 'Sara' },
  { style: 'avataaars', seed: 'Ravi' },
  { style: 'avataaars', seed: 'Nadia' },
  { style: 'avataaars', seed: 'Ben' },
  { style: 'avataaars', seed: 'Fatima' },
  { style: 'avataaars', seed: 'Tom' },
  { style: 'avataaars', seed: 'Zoe' },
  { style: 'avataaars', seed: 'Diego' },
  { style: 'avataaars', seed: 'Hana' },
  { style: 'avataaars', seed: 'Ivan' },
  { style: 'avataaars', seed: 'Lily' },
  { style: 'avataaars', seed: 'Marcus' },
  { style: 'avataaars', seed: 'Nina' },
  { style: 'avataaars', seed: 'Otto' },
  { style: 'avataaars', seed: 'Paula' },
  { style: 'avataaars', seed: 'Quinn' },
  { style: 'avataaars', seed: 'Rose' },
  { style: 'avataaars', seed: 'Steve' },
  { style: 'avataaars', seed: 'Tina' },
  { style: 'avataaars', seed: 'Ulric' },
  // bottts – robots (20 total)
  { style: 'bottts', seed: 'Robot1' },
  { style: 'bottts', seed: 'Robot2' },
  { style: 'bottts', seed: 'Robot3' },
  { style: 'bottts', seed: 'Robot4' },
  { style: 'bottts', seed: 'Robot5' },
  { style: 'bottts', seed: 'Robot6' },
  { style: 'bottts', seed: 'Cyborg' },
  { style: 'bottts', seed: 'Droid' },
  { style: 'bottts', seed: 'Android' },
  { style: 'bottts', seed: 'Nexus' },
  { style: 'bottts', seed: 'Pixel' },
  { style: 'bottts', seed: 'Byte' },
  { style: 'bottts', seed: 'Chip' },
  { style: 'bottts', seed: 'Circuit' },
  { style: 'bottts', seed: 'Nano' },
  { style: 'bottts', seed: 'Omega' },
  { style: 'bottts', seed: 'Sigma' },
  { style: 'bottts', seed: 'Delta' },
  { style: 'bottts', seed: 'Alpha' },
  { style: 'bottts', seed: 'Beta' },
  // lorelei (12 total)
  { style: 'lorelei', seed: 'Grace' },
  { style: 'lorelei', seed: 'Hope' },
  { style: 'lorelei', seed: 'Joy' },
  { style: 'lorelei', seed: 'Faith' },
  { style: 'lorelei', seed: 'Dawn' },
  { style: 'lorelei', seed: 'Iris' },
  { style: 'lorelei', seed: 'Ruby' },
  { style: 'lorelei', seed: 'Pearl' },
  { style: 'lorelei', seed: 'Jade' },
  { style: 'lorelei', seed: 'Opal' },
  { style: 'lorelei', seed: 'Amber' },
  { style: 'lorelei', seed: 'Coral' },
  // pixel-art (12 total)
  { style: 'pixel-art', seed: 'Pixel1' },
  { style: 'pixel-art', seed: 'Pixel2' },
  { style: 'pixel-art', seed: 'Pixel3' },
  { style: 'pixel-art', seed: 'Pixel4' },
  { style: 'pixel-art', seed: 'Pixel5' },
  { style: 'pixel-art', seed: 'Pixel6' },
  { style: 'pixel-art', seed: 'Pixel7' },
  { style: 'pixel-art', seed: 'Pixel8' },
  { style: 'pixel-art', seed: 'Pixel9' },
  { style: 'pixel-art', seed: 'Pixel10' },
  { style: 'pixel-art', seed: 'Pixel11' },
  { style: 'pixel-art', seed: 'Pixel12' },
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [blockedUsers, setBlockedUsers] = useState<{id: string; blocked_user_id: string; display_name: string}[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

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
        setNotificationsEnabled(data.notifications_enabled ?? false);

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

      setNotifPermission(getNotificationPermission());
    };

    loadProfile();

    const loadBlockedUsers = async () => {
      setLoadingBlocked(true);
      const { data, error: blockedError } = await supabase
        .from('blocked_users')
        .select('id, blocked_user_id, profiles!blocked_users_blocked_user_id_fkey(display_name)')
        .eq('user_id', user.id);
      if (blockedError) {
        // Table may not exist yet — silently ignore
        setLoadingBlocked(false);
        return;
      }
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setBlockedUsers(data.map((b: any) => ({
          id: b.id,
          blocked_user_id: b.blocked_user_id,
          display_name: Array.isArray(b.profiles)
            ? (b.profiles[0]?.display_name || '')
            : (b.profiles?.display_name || ''),
        })));
      }
      setLoadingBlocked(false);
    };

    loadBlockedUsers().catch(() => setLoadingBlocked(false));
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
      notifications_enabled: notificationsEnabled,
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

        {/* Notifications */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 mt-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4">🔔 Notifications</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700 dark:text-slate-200">Push Notifications</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {notifPermission === 'unsupported' ? 'Not supported on this device' :
                 notifPermission === 'denied' ? 'Blocked — enable in browser settings' :
                 'Show notifications for new messages'}
              </p>
            </div>
            <button
              type="button"
              disabled={notifPermission === 'unsupported' || notifPermission === 'denied'}
              onClick={async () => {
                if (!notificationsEnabled) {
                  const granted = await requestNotificationPermission();
                  if (granted) {
                    setNotificationsEnabled(true);
                    setNotifPermission('granted');
                  }
                } else {
                  setNotificationsEnabled(false);
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationsEnabled ? 'bg-red-600' : 'bg-gray-200 dark:bg-slate-600'
              } disabled:opacity-40`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Blocked Users */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 mt-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4">🚫 Blocked Users</h2>
          {loadingBlocked ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">Loading…</p>
          ) : blockedUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">You haven&apos;t blocked anyone.</p>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map(bu => (
                <div key={bu.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
                  <span className="text-gray-700 dark:text-slate-200 text-sm">{bu.display_name || bu.blocked_user_id.slice(0, 8)}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.from('blocked_users').delete().eq('id', bu.id);
                      setBlockedUsers(prev => prev.filter(b => b.id !== bu.id));
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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
