"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import GroupCard from "@/components/GroupCard";
import { formatMonth } from "@/lib/months";
import { PR_CATEGORIES } from "@/lib/categories";

// PNP and Non-EE share a merged group view
const MERGED_CATEGORIES = ["pnp", "non-ee"];

export default function GroupsByCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [userPrMonth, setUserPrMonth] = useState<string | null>(null);
  const [userPrCategory, setUserPrCategory] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const decodedCategory = decodeURIComponent(category);
  const isMergedView = MERGED_CATEGORIES.includes(decodedCategory);

  const categoryInfo = PR_CATEGORIES.find((c) => c.value === decodedCategory);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);

      // Load user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("pr_month, pr_category")
        .eq("id", user.id)
        .single();

      setUserPrMonth(profile?.pr_month ?? null);
      setUserPrCategory(profile?.pr_category ?? null);

      // Load group members for all relevant categories
      const cats = MERGED_CATEGORIES.includes(decodedCategory)
        ? MERGED_CATEGORIES
        : [decodedCategory];
      let allRows: { group_key: string }[] = [];
      for (const cat of cats) {
        const { data } = await supabase
          .from("group_members")
          .select("group_key")
          .like("group_key", `${cat}:%`);
        if (data) allRows = allRows.concat(data);
      }

      // Count members per month (aggregate across merged categories)
      const counts: Record<string, number> = {};
      allRows.forEach(({ group_key }) => {
        const colonIdx = group_key.indexOf(":");
        if (colonIdx !== -1) {
          const month = group_key.slice(colonIdx + 1);
          counts[month] = (counts[month] || 0) + 1;
        }
      });
      setMemberCounts(counts);

      // Load all of the user's joined groups
      const { data: userMemberships } = await supabase
        .from("group_members")
        .select("group_key")
        .eq("user_id", user.id);
      if (userMemberships) {
        setJoinedGroups(new Set(userMemberships.map((m: { group_key: string }) => m.group_key)));
      }

      setLoadingData(false);
    };

    loadData();
  }, [user, decodedCategory]);

  // Determine which category key to use when joining/chatting for a given month
  const resolveJoinCategory = (): string => {
    if (isMergedView && userPrCategory && MERGED_CATEGORIES.includes(userPrCategory)) {
      return userPrCategory;
    }
    return decodedCategory;
  };

  const handleJoin = async (month: string) => {
    if (!user) return;
    const joinCategory = resolveJoinCategory();
    const key = `${joinCategory}:${month}`;

    setJoinedGroups((prev) => new Set([...prev, key]));
    setMemberCounts((prev) => ({
      ...prev,
      [month]: (prev[month] || 0) + 1,
    }));

    const { error } = await supabase
      .from("group_members")
      .insert({ user_id: user.id, group_key: key });

    if (error && error.code !== "23505") {
      setJoinedGroups((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setMemberCounts((prev) => ({
        ...prev,
        [month]: Math.max((prev[month] || 1) - 1, 0),
      }));
      console.error("Failed to join group:", error);
      return;
    }

    router.push(`/chat/${joinCategory}/${month}`);
  };

  // Whether the user has joined a group for this month (checking all merged categories)
  const isMonthJoined = (month: string): boolean => {
    if (isMergedView) {
      return MERGED_CATEGORIES.some((cat) => joinedGroups.has(`${cat}:${month}`));
    }
    return joinedGroups.has(`${decodedCategory}:${month}`);
  };

  // Determine the category to use for the chat link (the one the user actually joined)
  const getChatCategory = (month: string): string => {
    if (isMergedView) {
      for (const cat of MERGED_CATEGORIES) {
        if (joinedGroups.has(`${cat}:${month}`)) return cat;
      }
      return resolveJoinCategory();
    }
    return decodedCategory;
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading groups...</div>
      </div>
    );
  }

  // Months are stored as "YYYY-MM" strings; lexicographic sort is chronologically correct.
  // Sort descending (newest first) so the most recent groups appear at the top.
  const months = Object.keys(memberCounts).sort((a, b) => b.localeCompare(a));

  const pageTitle = isMergedView
    ? "PNP / Non-Express Entry Groups"
    : categoryInfo
    ? `${categoryInfo.label} Groups`
    : `${decodedCategory} Groups`;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/groups")}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            ← Back to Categories
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{pageTitle}</h1>
        {months.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-700">No groups yet</h3>
            <p className="text-gray-500 mt-2">
              Be the first to join a group for this category!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map((month) => (
              <GroupCard
                key={month}
                month={month}
                displayName={formatMonth(month)}
                memberCount={memberCounts[month]}
                isUserGroup={
                  month === userPrMonth &&
                  (isMergedView
                    ? MERGED_CATEGORIES.includes(userPrCategory ?? "")
                    : userPrCategory === decodedCategory)
                }
                category={getChatCategory(month)}
                isJoined={isMonthJoined(month)}
                onJoin={() => handleJoin(month)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
