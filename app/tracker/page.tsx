'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { JOURNEY_STEP_EMOJIS, formatStepDate } from '@/lib/categories';
import { formatMonth } from '@/lib/months';

// Table columns to display (subset of JOURNEY_STEPS with shorter header labels)
const TABLE_COLUMNS: { step: string; header: string }[] = [
  { step: 'Filed PR Application', header: 'Filed PR' },
  { step: 'Waiting AOR', header: 'Waiting AOR' },
  { step: 'Received AOR', header: 'Received AOR' },
  { step: 'AOR', header: 'AOR' },
  { step: 'BIL Date', header: 'BIL Date' },
  { step: 'Biometrics Completed', header: 'Biometrics' },
  { step: 'Medical Completed', header: 'Medical' },
  { step: 'PVO (Inland)', header: 'PVO' },
  { step: 'SVO (Inland)', header: 'SVO' },
  { step: 'PAL', header: 'PAL' },
  { step: 'Info Sharing', header: 'Info Sharing' },
  { step: 'Criminality', header: 'Criminality' },
  { step: 'Security', header: 'Security' },
  { step: 'Final Decision', header: 'Final Decision' },
  { step: 'P1', header: 'P1' },
  { step: 'P2', header: 'P2' },
  { step: 'PPR', header: 'PPR' },
  { step: 'ECOPR', header: 'ECOPR' },
  { step: 'PR Card', header: 'PR Card' },
];

// These steps store a visa office name (text), not a date
const VISA_OFFICE_STEPS = ['PVO (Inland)', 'SVO (Inland)'];

function daysBetween(dateA: string, dateB: string): number {
  const [ay, am, ad] = dateA.split('-').map(Number);
  const [by, bm, bd] = dateB.split('-').map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

interface MemberRow {
  id: string;
  display_name: string;
  pr_category: string;
  steps: Record<string, string>;
}

interface FilledStep {
  col: typeof TABLE_COLUMNS[number];
  value: string;
  days: number | null;
  isVisaOffice: boolean;
}

export default function TrackerPage() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();
  const [prMonth, setPrMonth] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noMonth, setNoMonth] = useState(false);

  useEffect(() => {
    if (!authLoading && !authError && !user && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      router.push('/login');
    }
  }, [user, authLoading, authError, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get current user's pr_month
        const { data: myProfile, error: profileError } = await supabase
          .from('profiles')
          .select('pr_month, pr_category')
          .eq('id', user.id)
          .single();

        if (profileError || !myProfile) {
          setError('Failed to load your profile.');
          setLoading(false);
          return;
        }

        if (!myProfile.pr_month) {
          setNoMonth(true);
          setLoading(false);
          return;
        }

        setPrMonth(myProfile.pr_month);

        // Get all profiles with the same pr_month (all categories)
        const { data: groupProfiles, error: groupError } = await supabase
          .from('profiles')
          .select('id, display_name, pr_category, pvo, svo')
          .eq('pr_month', myProfile.pr_month);

        if (groupError || !groupProfiles) {
          setError('Failed to load group members.');
          setLoading(false);
          return;
        }

        const userIds = groupProfiles.map((p) => p.id);

        // Get journey steps for all users in the group
        const { data: allSteps, error: stepsError } = await supabase
          .from('journey_steps')
          .select('user_id, step_name, step_date')
          .in('user_id', userIds);

        if (stepsError) {
          setError('Failed to load journey steps.');
          setLoading(false);
          return;
        }

        // Build member rows merging journey_steps + PVO/SVO from profiles
        const rows: MemberRow[] = groupProfiles.map((profile) => {
          const steps: Record<string, string> = {};

          // PVO/SVO are stored as text columns on profiles, not in journey_steps
          if (profile.pvo) steps['PVO (Inland)'] = profile.pvo;
          if (profile.svo) steps['SVO (Inland)'] = profile.svo;

          // Add all journey step dates for this user
          (allSteps || [])
            .filter((s) => s.user_id === profile.id && s.step_date)
            .forEach((s) => {
              steps[s.step_name] = s.step_date;
            });

          return {
            id: profile.id,
            display_name: profile.display_name || 'Unknown',
            pr_category: profile.pr_category || '',
            steps,
          };
        });

        setMembers(rows);
      } catch (err) {
        console.error('Tracker load error:', err);
        setError('An unexpected error occurred.');
      }

      setLoading(false);
    };

    loadData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error</p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">{error}</p>
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

  if (noMonth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-800 dark:text-slate-100 font-semibold mb-2">PR Application Month Not Set</p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
            Please update your profile with your PR application month to use the Group Journey Tracker.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Update Profile
          </button>
        </div>
      </div>
    );
  }

  const formattedMonth = prMonth ? formatMonth(prMonth) : '';

  // Sort members alphabetically by display_name (case-insensitive)
  const sortedMembers = [...members].sort((a, b) =>
    a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' })
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-6 px-4 page-fade-in">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <div className="mb-3">
          <button
            onClick={() => router.push('/welcome')}
            className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100 transition-colors text-sm font-medium"
          >
            ← Back
          </button>
        </div>

        {/* Page header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">
            📊 Group Journey Tracker — {formattedMonth}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Showing {members.length} applicant{members.length !== 1 ? 's' : ''} from {formattedMonth}
          </p>
        </div>

        {/* Member cards */}
        <div className="space-y-3">
          {sortedMembers.length === 0 && (
            <p className="text-center text-gray-400 dark:text-slate-500 py-8">
              No members found for this month.
            </p>
          )}
          {sortedMembers.map((member, idx) => {
            // Build list of filled steps with day gaps
            let prevDate: string | null = null;
            const filledSteps = TABLE_COLUMNS.reduce<FilledStep[]>((acc, col) => {
              const isVisaOffice = VISA_OFFICE_STEPS.includes(col.step);
              const value = member.steps[col.step] || null;
              if (!value) return acc;

              let days: number | null = null;
              if (!isVisaOffice && prevDate) {
                const d = daysBetween(prevDate, value);
                if (d > 0) days = d;
              }
              if (!isVisaOffice) prevDate = value;

              acc.push({ col, value, days, isVisaOffice });
              return acc;
            }, []);

            const isEven = idx % 2 === 0;
            const cardBg = isEven
              ? 'bg-white dark:bg-slate-900'
              : 'bg-gray-50 dark:bg-slate-800/50';

            return (
              <div
                key={member.id}
                className={`${cardBg} rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden`}
              >
                {/* Card header — member name */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                  <p className="font-semibold text-gray-800 dark:text-slate-100">
                    {member.display_name}
                  </p>
                </div>

                {/* Journey steps */}
                {filledSteps.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400 dark:text-slate-500 italic">
                    No milestones recorded yet
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-slate-700/50">
                    {filledSteps.map(({ col, value, days, isVisaOffice }) => (
                      <li key={col.step} className="flex items-center gap-2 px-4 py-2 text-sm">
                        <span className="text-base w-6 text-center shrink-0">
                          {JOURNEY_STEP_EMOJIS[col.step]}
                        </span>
                        <span className="flex-1 text-gray-700 dark:text-slate-300">
                          {col.header}
                        </span>
                        <span className="text-gray-600 dark:text-slate-300 font-medium">
                          {isVisaOffice ? value : formatStepDate(value)}
                        </span>
                        {days !== null && (
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            ({days}d)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
