'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DrawRound {
  DrawNumber: string;
  DrawDate: string;
  DrawDateFull: string;
  DrawName: string;
  DrawCRS: string;
  DrawSize: string;
}

export default function DrawsPage() {
  const [draws, setDraws] = useState<DrawRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        const res = await fetch(
          'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json',
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setDraws(data.rounds || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDraws();
  }, []);

  const drawTypes = Array.from(new Set(draws.map(d => d.DrawName).filter(Boolean)));

  const filtered = draws.filter(d => {
    const matchesSearch = !search ||
      d.DrawName?.toLowerCase().includes(search.toLowerCase()) ||
      d.DrawNumber?.includes(search) ||
      d.DrawCRS?.includes(search);
    const matchesType = !filterType || d.DrawName === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 page-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/welcome" className="text-red-600 dark:text-red-400 hover:underline text-sm">← Back</Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">📊 All Express Entry Draws</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            placeholder="Search by program, draw #, or CRS..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="">All Programs</option>
            {drawTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            <p className="text-lg">⚠️ Could not load draws. Please try again later.</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Showing {filtered.length} of {draws.length} draws
            </p>
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-red-50 dark:bg-slate-700 text-left">
                      <th className="px-4 py-3 font-semibold text-gray-700 dark:text-slate-200">Draw #</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 dark:text-slate-200">Date</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 dark:text-slate-200">Program</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 dark:text-slate-200 text-right">CRS Cutoff</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 dark:text-slate-200 text-right">Invitations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((draw, i) => (
                      <tr
                        key={draw.DrawNumber}
                        className={`border-t border-gray-100 dark:border-slate-700 ${i === 0 ? 'bg-red-50/50 dark:bg-slate-700/30' : ''}`}
                      >
                        <td className="px-4 py-3 font-mono text-gray-600 dark:text-slate-300">#{draw.DrawNumber}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-slate-200 whitespace-nowrap">{draw.DrawDateFull || draw.DrawDate}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-slate-200">{draw.DrawName || 'General'}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">{draw.DrawCRS || '—'}</td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-200">
                          {draw.DrawSize ? Number(draw.DrawSize).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <p className="text-xs text-gray-400 dark:text-slate-500 text-center mt-4">
          Data sourced from IRCC open data — updates automatically
        </p>
      </div>
    </div>
  );
}
