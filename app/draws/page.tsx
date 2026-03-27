'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface Draw {
  drawNumber: string;
  drawDate: string;
  drawName: string;
  invitations: number;
  crsScore: number;
  category: string;
}

const FILTER_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'CEC', label: 'Canadian Experience Class' },
  { value: 'PNP', label: 'Provincial Nominee Program' },
  { value: 'French', label: 'French-Language proficiency' },
  { value: 'General', label: 'No program specified' },
  { value: 'Category', label: 'Category-based (Healthcare, STEM, Trade, etc.)' },
];

function formatDDMMMYY(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mon = months[d.getUTCMonth()];
  const yr = String(d.getUTCFullYear()).slice(2);
  return `${day}-${mon}-${yr}`;
}

export default function DrawsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetch('/draws.json')
      .then((res) => res.json())
      .then((data: Draw[]) => {
        const sorted = [...data].sort((a, b) => Number(b.drawNumber) - Number(a.drawNumber));
        setDraws(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading draws...</div>
      </div>
    );
  }

  const latest = draws[0];
  const filtered = filter === 'All' ? draws : draws.filter((d) => d.category === filter);
  const activeFilterLabel = FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? 'All';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-5">

        {/* Page title */}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Express Entry Draws</h1>

        {/* Top summary row */}
        {latest && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Calculate score */}
            <a
              href="https://www.cic.gc.ca/english/immigrate/skilled/crs-tool.asp"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 flex flex-col items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-red-600 text-center leading-tight">Calculate Your Score</span>
            </a>

            {/* Latest draw info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Latest Draw</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{formatDDMMMYY(latest.drawDate)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{latest.invitations.toLocaleString()} invited</p>
            </div>

            {/* Min ITA score */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Min ITA Score</p>
              <p className="text-3xl font-extrabold text-red-600 mt-1">{latest.crsScore}</p>
            </div>
          </div>
        )}

        {/* Filter by type */}
        <div ref={filterRef} className="relative mb-4">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filter By Type
            {filter !== 'All' && (
              <span className="ml-1 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                {activeFilterLabel}
              </span>
            )}
            <svg className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {filterOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-30 overflow-hidden">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setFilter(opt.value); setFilterOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                    filter === opt.value
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                  {filter === opt.value && (
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Draws table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-4">📊</div>
            <p>No draws found for this filter.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[80px_1fr_56px] sm:grid-cols-[90px_1fr_80px_80px] border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</span>
              <span className="hidden sm:block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-right">Invited</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-right">Score</span>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((draw, idx) => (
                <div
                  key={draw.drawNumber}
                  className="grid grid-cols-[80px_1fr_56px] sm:grid-cols-[90px_1fr_80px_80px] px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                >
                  {/* Date */}
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatDDMMMYY(draw.drawDate)}</span>
                    {idx === 0 && (
                      <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-semibold mt-0.5 w-fit">
                        Latest
                      </span>
                    )}
                  </div>

                  {/* Draw name */}
                  <div className="flex items-center min-w-0 pr-2">
                    <span className="text-xs text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">{draw.drawName}</span>
                  </div>

                  {/* Invited (hidden on mobile) */}
                  <span className="hidden sm:flex items-center justify-end text-xs text-gray-600 dark:text-gray-400">
                    {draw.invitations.toLocaleString()}
                  </span>

                  {/* CRS score */}
                  <span className="flex items-center justify-end text-sm font-bold text-gray-900 dark:text-white">
                    {draw.crsScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-5">
          Data sourced from IRCC Express Entry draws · {draws.length > 0 ? `Last updated ${formatDDMMMYY(draws[0].drawDate)}` : '—'}
        </p>
      </div>
    </div>
  );
}
