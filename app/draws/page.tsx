'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface Draw {
  drawNumber: number;
  date: string;
  program: string;
  crsScore: number;
  invitations: number;
  category: string;
}

const CATEGORY_STYLES: Record<string, { badge: string; label: string }> = {
  CEC: {
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    label: 'Canadian Experience Class',
  },
  PNP: {
    badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    label: 'Provincial Nominee Program',
  },
  FSW: {
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    label: 'Federal Skilled Worker',
  },
  General: {
    badge: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    label: 'No program specified',
  },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function DrawsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetch('/draws.json')
      .then((res) => res.json())
      .then((data: Draw[]) => {
        const sorted = [...data].sort((a, b) => b.drawNumber - a.drawNumber);
        setDraws(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading draws...</div>
      </div>
    );
  }

  const latest = draws[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6">
      <div className="max-w-4xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Express Entry Draws</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Latest IRCC Express Entry invitation rounds
          </p>
        </div>

        {/* Summary stats */}
        {latest && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Latest CRS</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{latest.crsScore}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Invitations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{latest.invitations.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Latest Draw</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">#{latest.drawNumber}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Draw Date</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{formatDate(latest.date)}</p>
            </div>
          </div>
        )}

        {/* Desktop table */}
        {draws.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-4">📊</div>
            <p>No draws data available.</p>
          </div>
        ) : (
          <>
            {/* Desktop table view */}
            <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Draw #</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Program</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">CRS Score</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Invitations</th>
                  </tr>
                </thead>
                <tbody>
                  {draws.map((draw, idx) => {
                    const style = CATEGORY_STYLES[draw.category] ?? CATEGORY_STYLES.General;
                    return (
                      <tr
                        key={draw.drawNumber}
                        className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-white">#{draw.drawNumber}</span>
                            {idx === 0 && (
                              <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">
                                Latest
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(draw.date)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
                            {draw.category === 'General' ? 'No program' : draw.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-gray-900 dark:text-white">{draw.crsScore}</td>
                        <td className="px-5 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{draw.invitations.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="sm:hidden space-y-3">
              {draws.map((draw, idx) => {
                const style = CATEGORY_STYLES[draw.category] ?? CATEGORY_STYLES.General;
                return (
                  <div key={draw.drawNumber} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">Draw #{draw.drawNumber}</span>
                        {idx === 0 && (
                          <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">
                            Latest
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
                        {draw.category === 'General' ? 'No program' : draw.category}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">{formatDate(draw.date)}</div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">CRS Score</p>
                        <p className="text-lg font-bold text-red-600">{draw.crsScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Invitations</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{draw.invitations.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Last updated note */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Data sourced from IRCC Express Entry draws · Last updated {draws.length > 0 ? formatDate(draws[0].date) : '—'}
        </p>
      </div>
    </div>
  );
}
