"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../lib/auth";
import { PR_CATEGORIES } from "../../../constants";
import type { MemberCounts } from "../../../types";

export default function GroupsByCategoryPage({ params }) {
  const { category: encodedCategory } = params;
  const decodedCategory = decodeURIComponent(encodedCategory || "");

  const router = useRouter();
  const { user, authLoading } = useAuth();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [memberCounts, setMemberCounts] = useState<MemberCounts>({});
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(true);

  const categoryData = PR_CATEGORIES.find((c) => c.value === decodedCategory);

  // Redirect if not logged in or invalid category
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!categoryData) {
      router.push("/groups");
    }
  }, [categoryData, router]);

  // THIS IS THE ONLY PLACE GROUPS ARE FETCHED AND NOW ONLY MERGED GROUPS ARE INCLUDED!
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);

      // Load user profile to highlight their month
      const { data: profile } = await supabase
        .from("profiles")
        .select("pr_month, pr_category")
        .eq("id", user.id)
        .single();

      setUserProfile(profile);

      // ONLY LOAD MERGED GROUPS
      const { data: groupMemberRows } = await supabase
        .from("group_members")
        .select("group_key")
        .like("group_key", "pnp/non-express-entry:%");

      if (groupMemberRows) {
        const counts: MemberCounts = {};
        groupMemberRows.forEach(({ group_key }) => {
          // group_key format: "pnp/non-express-entry:YYYY-MM"
          const monthPart = group_key.split(":").slice(1).join(":");
          if (monthPart) {
            counts[monthPart] = (counts[monthPart] || 0) + 1;
          }
        });
        setMemberCounts(counts);
      }

      // Load which merged groups the current user has joined
      const { data: userMemberships } = await supabase
        .from("group_members")
        .select("group_key")
        .eq("user_id", user.id)
        .like("group_key", "pnp/non-express-entry:%");

      if (userMemberships) {
        setJoinedGroups(new Set(userMemberships.map((m) => m.group_key)));
      }

      setLoadingData(false);
    };

    loadData();
  }, [user]);

  const handleJoin = async (month: string) => {
    if (!user) return;
    const key = `pnp/non-express-entry:${month}`;

    // Optimistic update
    setJoinedGroups((prev) => new Set([...prev, key]));
    setMemberCounts((prev) => ({
      ...prev,
      [month]: (prev[month] || 0) + 1,
    }));

    const { error } = await supabase
      .from("group_members")
      .insert({ user_id: user.id, group_key: key });

    if (error && error.code !== "23505") {
      // Rollback optimistic update on error (ignore duplicate key errors)
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

    // Navigate to chat after joining
    router.push(`/chat/pnp/non-express-entry/${month}`);
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

  // Build the month list from the merged group keys
  const months = Object.keys(memberCounts).sort();

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">PNP / Non-Express Entry Groups</h1>
        <ul>
          {months.length === 0 && (
            <li className="text-gray-400">No merged groups found.</li>
          )}
          {months.map((month) => (
            <li
              key={month}
              className="mb-4 p-4 rounded border bg-white flex justify-between items-center"
            >
              <div>
                <div className="font-medium text-lg">{month}</div>
                <div className="text-sm text-gray-500">
                  {memberCounts[month]} members
                </div>
              </div>
              {joinedGroups.has(`pnp/non-express-entry:${month}`) ? (
                <button
                  className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm"
                  disabled
                >
                  Joined
                </button>
              ) : (
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  onClick={() => handleJoin(month)}
                >
                  Join
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}