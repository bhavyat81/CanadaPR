'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import CategoryCard from '@/components/CategoryCard';
import { PR_CATEGORIES } from '@/lib/categories';

interface CategoryCounts {
  [category: string]: number;
}

export default function GroupsPage() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const router = useRouter();
  const [userCategory, setUserCategory] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({});
  const [loadingData, setLoadingData] = useState(true);
  const [hasPrApplicationDate, setHasPrApplicationDate] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [saveDateError, setSaveDateError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !authError && !user) {
      router.push('/login');
    }
  }, [user, authLoading, authError, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);

      const [profileResult, journeyStepResult, profilesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('pr_category')
          .eq('id', user.id)
          .single(),
        supabase
          .from('journey_steps')
          .select('step_date')
          .eq('user_id', user.id)
          .eq('step_name', 'Filed PR Application')
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('pr_category'),
      ]);

      setUserCategory(profileResult.data?.pr_category ?? null);

      setHasPrApplicationDate(!!(journeyStepResult.data?.step_date));

      if (profilesResult.data) {
        const counts: CategoryCounts = {};
        profilesResult.data.forEach(({ pr_category }) => {
          if (pr_category) {
            counts[pr_category] = (counts[pr_category] || 0) + 1;
          }
        });
        setCategoryCounts(counts);
      }

      setLoadingData(false);
    };

    loadData();
  }, [user]);

  const handleSavePrDate = async () => {
    if (!user || !selectedDate) return;
    setSavingDate(true);
    setSaveDateError('');
    const { error } = await supabase
      .from('journey_steps')
      .upsert({ user_id: user.id, step_name: 'Filed PR Application', step_date: selectedDate });
    setSavingDate(false);
    if (error) {
      setSaveDateError('Failed to save your date. Please try again.');
    } else {
      setHasPrApplicationDate(true);
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

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">Loading groups...</div>
      </div>
    );
  }

  if (!hasPrApplicationDate) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <p className="text-4xl mb-4">📋</p>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-3">One quick step before joining</h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            Before joining a group, please tell us when you submitted your PR application. This helps us show accurate PR journey data for all members.
          </p>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 text-left">
            When did you submit your PR application?
          </label>
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 mb-4 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {saveDateError && (
            <p className="text-red-600 dark:text-red-400 text-sm mb-3">{saveDateError}</p>
          )}
          <button
            onClick={handleSavePrDate}
            disabled={!selectedDate || savingDate}
            className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingDate ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-10 px-4 page-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">PR Applicant Groups</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Select your PR category to find your group
          </p>
          {!userCategory && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 px-4 py-3 rounded-lg">
              <span>Set up your </span>
              <a href="/profile" className="font-medium underline">profile</a>
              <span> to highlight your category!</span>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PR_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.value}
              category={category}
              memberCount={categoryCounts[category.value] || 0}
              isUserCategory={userCategory === category.value}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
