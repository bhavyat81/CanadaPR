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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userCategory, setUserCategory] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({});
  const [loadingData, setLoadingData] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);

      // Load user profile to get their category
      const { data: profile } = await supabase
        .from('profiles')
        .select('pr_category')
        .eq('id', user.id)
        .single();

      setUserCategory(profile?.pr_category ?? null);

      // Load member counts per category
      const { data: profiles } = await supabase
        .from('profiles')
        .select('pr_category');

      if (profiles) {
        const counts: CategoryCounts = {};
        profiles.forEach(({ pr_category }) => {
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

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">PR Applicant Groups</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Select your PR category to find your group
          </p>
          {!userCategory && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-400 px-4 py-3 rounded-lg">
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
