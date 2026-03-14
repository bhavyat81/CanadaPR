"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../components/AuthProvider";

export default function GroupsByCategoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // ONLY LOAD MERGED GROUPS
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);

      const { data: groupMemberRows } = await supabase
        .from("group_members")
        .select("group_key")
        .like("group_key", "pnp/non-express-entry:%");

      if (groupMemberRows) {
        const counts: Record<string, number> = {};
        groupMemberRows.forEach(({ group_key }: { group_key: string }) => {
          const monthPart = group_key.split(":").slice(1).join(":");
          if (monthPart) {
            counts[monthPart] = (counts[monthPart] || 0) + 1;
          }
        });
        setMemberCounts(counts);
      }

      const { data: userMemberships } = await supabase
        .from("group_members")
        .select("group_key")
        .eq("user_id", user.id)
        .like("group_key", "pnp/non-express-entry:%");

      if (userMemberships) {
        setJoinedGroups(
          new Set(userMemberships.map((m: { group_key: string }) => m.group_key))
        );
      }

      setLoadingData(false);
    };

    loadData();
  }, [user]);

  const handleJoin = async (month: string) => {
    if (!user) return;
    const key = `pnp/non-express-entry:${month}`;

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

    router.push(`/chat/pnp/non-express-entry/${month}`);
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading groups...</div>
      </div>
    );
  }

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