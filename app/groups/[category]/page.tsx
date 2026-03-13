'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import GroupCard from '@/components/GroupCard';
import { generateMonths } from '@/lib/months';
import { PR_CATEGORIES, getCategoryLabel, buildGroupKey } from '@/lib/categories';

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
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
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

      // Load member counts from group_members for this category
      const { data: groupMemberRows } = await supabase
        .from('group_members')
        .select('group_key')
        .like('group_key', `${decodedCategory}:%`);

      if (groupMemberRows) {
        const counts: MemberCounts = {};
        groupMemberRows.forEach(({ group_key }) => {
          // group_key format: "category:month"
          const monthPart = group_key.split(':').slice(1).join(':');
          if (monthPart) {
            counts[monthPart] = (counts[monthPart] || 0) + 1;
          }
        });
        setMemberCounts(counts);
      }

      // Load which groups the current user has joined in this category
      const { data: userMemberships } = await supabase
        .from('group_members')
        .select('group_key')
        .eq('user_id', user.id)
        .like('group_key', `${decodedCategory}:%`);

      if (userMemberships) {
        setJoinedGroups(new Set(userMemberships.map((m) => m.group_key)));
      }

      setLoadingData(false);
    };

    loadData();
  }, [user, decodedCategory]);

  const handleJoin = async (month: string) => {
    if (!user) return;
    const key = buildGroupKey(decodedCategory, month);

    // Optimistic update
    setJoinedGroups((prev) => new Set([...prev, key]));
    setMemberCounts((prev) => ({ ...prev, [month]: (prev[month] || 0) + 1 }));

    const { error } = await supabase
      .from('group_members')
      .insert({ user_id: user.id, group_key: key });

    if (error && error.code !== '23505') {
      // Rollback optimistic update on error (ignore duplicate key errors — user may already be a member)
      setJoinedGroups((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setMemberCounts((prev) => ({ ...prev, [month]: Math.max((prev[month] || 1) - 1, 0) }));
      console.error('Failed to join group:', error);
      return;
    }

    // Navigate to chat after joining
    router.push(`/chat/${decodedCategory}/${month}`);
  };

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
          {ALL_MONTHS.map(({ value, label }) => {
            const key = buildGroupKey(decodedCategory, value);
            return (
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
                isJoined={joinedGroups.has(key)}
                onJoin={() => handleJoin(value)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
