'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import GroupCard from '@/components/GroupCard';

// Generate months from January 2025 to December 2026
const generateMonths = () => {
  const months = [];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  for (let year = 2025; year <= 2026; year++) {
    for (let month = 1; month <= 12; month++) {
      const value = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${monthNames[month - 1]} ${year}`;
      months.push({ value, label });
    }
  }
  return months;
};

const ALL_MONTHS = generateMonths();

interface MemberCounts {
  [month: string]: number;
}

export default function GroupsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{ pr_month: string } | null>(null);
  const [memberCounts, setMemberCounts] = useState<MemberCounts>({});
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

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('pr_month')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      // Load member counts for all months
      const { data: profiles } = await supabase
        .from('profiles')
        .select('pr_month');

      if (profiles) {
        const counts: MemberCounts = {};
        profiles.forEach(({ pr_month }) => {
          counts[pr_month] = (counts[pr_month] || 0) + 1;
        });
        setMemberCounts(counts);
      }

      setLoadingData(false);
    };

    loadData();
  }, [user]);

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">PR Applicant Groups</h1>
          <p className="text-gray-600 mt-2">
            Connect with applicants who applied in the same month as you
          </p>
          {!userProfile && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <span>Set up your </span>
              <a href="/profile" className="font-medium underline">profile</a>
              <span> to highlight your application month group!</span>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ALL_MONTHS.map(({ value, label }) => (
            <GroupCard
              key={value}
              month={value}
              displayName={label}
              memberCount={memberCounts[value] || 0}
              isUserGroup={userProfile?.pr_month === value}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
