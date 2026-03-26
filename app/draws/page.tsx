'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface DrawRound {
  DrawNumber: string;
  DrawDate: string;
  DrawDateFull: string;
  DrawName: string;
  DrawCRS: string;
  DrawSize: string;
  DrawCutOff?: string;
}

interface DrawData {
  rounds: DrawRound[];
}

export default function AllDrawsPage() {
  const [draws, setDraws] = useState<DrawRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        const res = await fetch(
          'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json',
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data: DrawData = await res.json();
        if (data?.rounds?.length > 0) {
          setDraws(data.rounds);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDraws();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(draws.map((d) => d.DrawName || 'No program specified'));
    return ['all', ...Array.from(cats).sort()];
  }, [draws]);

  const filtered = useMemo(() => {
    return draws.filter((d) => {
      const name = d.DrawName || 'No program specified';
      const matchesCategory = categoryFilter === 'all' || name === categoryFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        d.DrawNumber.toLowerCase().includes(q) ||
        (d.DrawDateFull || d.DrawDate).toLowerCase().includes(q) ||
        name.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [draws, categoryFilter, search]);

  function getCategoryBadgeColor(name: string): string {
    if (!name || name === 'No program specified') return 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300';
    if (name.toLowerCase().includes('provincial')) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
    if (name.toLowerCase().includes('canadian experience')) return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
    if (name.toLowerCase().includes('federal skilled')) return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
    if (name.toLowerCase().includes('trade')) return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300';
    return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 page-fade-in">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-sm flex items-center gap-1"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">📊 All Express Entry Draws</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Full draw history from IRCC</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6 space-y-3">
          <input
            type="text"
            placeholder="🔍 Search by draw number, date or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400 dark:placeholder-slate-500"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? '🏷️ All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        {!loading && !error && (
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Showing {filtered.length} of {draws.length} draws
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 animate-pulse border border-gray-200 dark:border-slate-700">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
                <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-5 py-4 rounded-2xl text-sm">
            Unable to load draw history. Please try again later.
          </div>
        )}

        {/* Draw cards */}
        {!loading && !error && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                No draws found matching your search.
              </div>
            ) : (
              filtered.map((draw) => {
                const programName = draw.DrawName || 'No program specified';
                return (
                  <div
                    key={draw.DrawNumber}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-xs font-medium text-gray-400 dark:text-slate-500">Draw #{draw.DrawNumber}</span>
                        <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mt-0.5">
                          📅 {draw.DrawDateFull || draw.DrawDate}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${getCategoryBadgeColor(programName)}`}>
                        {programName}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-red-50 dark:bg-slate-700/60 rounded-xl p-3">
                        <div className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">🎯 CRS Cutoff</div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{draw.DrawCRS || '—'}</div>
                      </div>
                      <div className="bg-red-50 dark:bg-slate-700/60 rounded-xl p-3">
                        <div className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">👥 Invitations</div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {draw.DrawSize ? Number(draw.DrawSize).toLocaleString() : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
