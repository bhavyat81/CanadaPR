'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import GroupCard from '@/components/GroupCard';
import { generateMonths } from '@/lib/months';
import { PR_CATEGORIES, getCategoryLabel } from '@/lib/categories';

const ALL_MONTHS = generateMonths();

interface MemberCounts {
  [month: string]: number;
}

export default function CategoryGroupsPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{ pr_month: string; pr_category: string } | null>(null);
  const [memberCounts, setMemberCounts] = useState<MemberCounts>({});
  const [loadingData, setLoadingData] = useState(true);

  const decodedCategory = decodeURIComponent(category);
  const categoryLabel = getCategoryLabel(decodedCategory);
  const categoryData = PR_CATEGORIES.find((c) => c.value === decodedCategory);

  // Redirect if not logged in or invalid category
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!categoryData) {
      router.push('/groups');
    }
  }, [categoryData, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);

      // Load user profile to highlight their month
      const { data: profile } = await supabase
        .from('profiles')
        .select('pr_month, pr_category')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      // Load member counts for this category broken down by month
      const { data: profiles } = await supabase
        .from('profiles')
        .select('pr_month')
        .eq('pr_category', decodedCategory);

      if (profiles) {
        const counts: MemberCounts = {};
        profiles.forEach(({ pr_month }) => {
          if (pr_month) {
            counts[pr_month] = (counts[pr_month] || 0) + 1;
          }
        });
        setMemberCounts(counts);
      }

      setLoadingData(false);
    };

    loadData();
  }, [user, decodedCategory]);

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading groups...</div>
      </div>
    );
  }

  if (!categoryData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/groups')}
            className="text-red-600 hover:text-red-700 font-medium text-sm mb-4 flex items-center gap-1"
          >
            ← All Categories
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{categoryLabel}</h1>
          <p className="text-gray-600 mt-2">
            Select your application month to join the group chat
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ALL_MONTHS.map(({ value, label }) => (
            <GroupCard
              key={value}
              month={value}
              displayName={label}
              memberCount={memberCounts[value] || 0}
              isUserGroup={
                userProfile?.pr_category === decodedCategory &&
                userProfile?.pr_month === value
              }
              category={decodedCategory}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
