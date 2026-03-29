'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

const ADMIN_EMAIL = 'bhavyat81admin@gmail.com';

type Tab = 'reports' | 'users' | 'stats';

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  message_id: string | null;
  message_content: string | null;
  reason: string;
  group_month: string | null;
  status: string;
  created_at: string;
  reporter_name?: string;
  reported_name?: string;
}

interface UserProfile {
  id: string;
  display_name: string;
  pr_category: string | null;
  pr_month: string | null;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  totalMessages: number;
  totalReports: number;
  reportsByStatus: Record<string, number>;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('reports');

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Stats state
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Access control
  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      router.replace('/welcome');
    }
  }, [user, authLoading, router]);

  // Load data when tab changes
  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;

    if (tab === 'reports') loadReports();
    else if (tab === 'users') loadUsers();
    else if (tab === 'stats') loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user]);

  const loadReports = async () => {
    setReportsLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch display names for reporters and reported users
      const reporterIds = [...new Set((data as Report[]).map((r) => r.reporter_id))];
      const reportedIds = [...new Set((data as Report[]).map((r) => r.reported_user_id))];
      const allIds = [...new Set([...reporterIds, ...reportedIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', allIds);

      const nameMap: Record<string, string> = {};
      (profiles ?? []).forEach((p: { id: string; display_name: string }) => {
        nameMap[p.id] = p.display_name;
      });

      const enriched = (data as Report[]).map((r) => ({
        ...r,
        reporter_name: nameMap[r.reporter_id] ?? r.reporter_id.slice(0, 8),
        reported_name: nameMap[r.reported_user_id] ?? r.reported_user_id.slice(0, 8),
      }));
      setReports(enriched);
    }
    setReportsLoading(false);
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, pr_category, pr_month, created_at')
      .order('display_name', { ascending: true });
    setUsers((data as UserProfile[]) ?? []);
    setUsersLoading(false);
  };

  const loadStats = async () => {
    setStatsLoading(true);
    const [{ count: userCount }, { count: reportCount }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }),
    ]);

    const { data: reportRows } = await supabase.from('reports').select('status');
    const byStatus: Record<string, number> = {};
    (reportRows ?? []).forEach((r: { status: string }) => {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    });

    setStats({
      totalUsers: userCount ?? 0,
      totalMessages: 0, // requires service role to count messages
      totalReports: reportCount ?? 0,
      reportsByStatus: byStatus,
    });
    setStatsLoading(false);
  };

  const handleDismissReport = async (reportId: string) => {
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: 'dismissed' } : r));
  };

  const handleActionReport = async (reportId: string, reportedUserId: string) => {
    await supabase.from('reports').update({ status: 'actioned' }).eq('id', reportId);
    // Remove all messages by the reported user
    await supabase.from('messages').delete().eq('sender_id', reportedUserId);
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: 'actioned' } : r));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) return null;

  const filteredUsers = users.filter((u) =>
    u.display_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    dismissed: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400',
    actioned: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push('/welcome')}
            className="text-red-600 dark:text-red-400 font-bold text-lg"
            aria-label="Back"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">🛡️ Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['reports', 'users', 'stats'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? 'bg-red-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Reports Tab */}
        {tab === 'reports' && (
          <div className="space-y-3">
            {reportsLoading ? (
              <p className="text-center text-gray-400 dark:text-slate-500 py-8">Loading reports...</p>
            ) : reports.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-slate-500 py-8">No reports found.</p>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm text-gray-800 dark:text-slate-100">
                      <span className="font-semibold">{r.reporter_name}</span>
                      <span className="text-gray-500 dark:text-slate-400"> reported </span>
                      <span className="font-semibold">{r.reported_name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor[r.status] ?? statusColor.pending}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    <span className="font-medium">Reason:</span> {r.reason}
                  </p>
                  {r.message_content && (
                    <p className="text-xs text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700 rounded-lg px-3 py-2 mb-2 line-clamp-2">
                      &ldquo;{r.message_content}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
                    <span>{r.group_month ?? '—'}</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleDismissReport(r.id)}
                        className="flex-1 py-2 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleActionReport(r.id, r.reported_user_id)}
                        className="flex-1 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Ban User &amp; Delete Messages
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 px-1">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </p>
            </div>
            {usersLoading ? (
              <p className="text-center text-gray-400 dark:text-slate-500 py-8">Loading users...</p>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-sm flex-shrink-0">👤</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{u.display_name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {u.pr_category ?? '—'} · {u.pr_month ?? '—'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">
                      {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div>
            {statsLoading ? (
              <p className="text-center text-gray-400 dark:text-slate-500 py-8">Loading stats...</p>
            ) : stats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.totalUsers}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Total Users</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.totalReports}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Total Reports</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">Reports by Status</h3>
                  {Object.entries(stats.reportsByStatus).length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-slate-500">No reports yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(stats.reportsByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[status] ?? statusColor.pending}`}>
                            {status}
                          </span>
                          <span className="text-sm font-bold text-gray-800 dark:text-slate-100">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
