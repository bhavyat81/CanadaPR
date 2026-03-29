'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import GroupCard from '@/components/GroupCard';
import { formatMonth, generateMonths } from '@/lib/months';
import { PR_CATEGORIES } from '@/lib/categories';

export default function CategoryClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const category = searchParams.get('cat') ?? '';
  const decodedCategory = decodeURIComponent(category);

  const categoryInfo = PR_CATEGORIES.find((c) => c.value === decodedCategory);

  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [userPrMonth, setUserPrMonth] = useState<string | null>(null);
  const [userPrCategory, setUserPrCategory] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([new Date().getFullYear()]));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !category) {
      router.push('/groups');
    }
  }, [category, authLoading, router]);

  useEffect(() => {
    if (!user || !category) return;

    const loadData = async () => {
      setLoadingData(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('pr_month, pr_category')
        .eq('id', user.id)
        .single();

      setUserPrMonth(profile?.pr_month ?? null);
      setUserPrCategory(profile?.pr_category ?? null);

      const { data } = await supabase
        .from('group_members')
        .select('group_key')
        .like('group_key', `${decodedCategory}:%`);

      const counts: Record<string, number> = {};
      if (data) {
        data.forEach(({ group_key }) => {
          const colonIdx = group_key.indexOf(':');
          if (colonIdx !== -1) {
            const month = group_key.slice(colonIdx + 1);
            counts[month] = (counts[month] || 0) + 1;
          }
        });
      }
      setMemberCounts(counts);

      const { data: userMemberships } = await supabase
        .from('group_members')
        .select('group_key')
        .eq('user_id', user.id);
      if (userMemberships) {
        setJoinedGroups(new Set(userMemberships.map((m: { group_key: string }) => m.group_key)));
      }

      setLoadingData(false);
    };

    loadData();
  }, [user, decodedCategory, category]);

  const handleJoin = async (month: string) => {
    if (!user) return;
    const key = `${decodedCategory}:${month}`;

    setJoinedGroups((prev) => new Set([...prev, key]));
    setMemberCounts((prev) => ({
      ...prev,
      [month]: (prev[month] || 0) + 1,
    }));

    const { error } = await supabase
      .from('group_members')
      .insert({ user_id: user.id, group_key: key });

    if (error && error.code !== '23505') {
      setJoinedGroups((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setMemberCounts((prev) => ({
        ...prev,
        [month]: Math.max((prev[month] || 1) - 1, 0),
      }));
      console.error('Failed to join group:', error);
      return;
    }

    router.push(`/chat?category=${encodeURIComponent(decodedCategory)}&month=${encodeURIComponent(month)}`);
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">Loading groups...</div>
      </div>
    );
  }

  const allMonths = generateMonths();

  // Group months by year
  const monthsByYear = allMonths.reduce<Record<number, string[]>>((acc, { value: month }) => {
    const year = parseInt(month.split('-')[0], 10);
    if (!acc[year]) acc[year] = [];
    acc[year].push(month);
    return acc;
  }, {});

  const years = Object.keys(monthsByYear).map(Number).sort();

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const pageTitle = categoryInfo
    ? `${categoryInfo.label} Groups`
    : `${decodedCategory} Groups`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/groups')}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm"
          >
            ← Back to Categories
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">{pageTitle}</h1>
        <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-5">
          📅 Application Filing Month
        </p>

        <div className="space-y-4">
          {years.map((year) => {
            const expanded = expandedYears.has(year);
            return (
              <div key={year} className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-bold text-gray-800 dark:text-slate-100 text-lg"
                >
                  <span>{year}</span>
                  <span className="text-gray-500 dark:text-slate-400 text-base">{expanded ? '▲' : '▼'}</span>
                </button>
                {expanded && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-slate-900">
                    {monthsByYear[year].map((month) => (
                      <GroupCard
                        key={month}
                        month={month}
                        displayName={formatMonth(month)}
                        memberCount={memberCounts[month] || 0}
                        isUserGroup={
                          month === userPrMonth && userPrCategory === decodedCategory
                        }
                        category={decodedCategory}
                        isJoined={joinedGroups.has(`${decodedCategory}:${month}`)}
                        onJoin={() => handleJoin(month)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
