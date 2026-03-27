'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface Draw {
  drawNumber: string;
  drawDate: string;
  programType: string;
  invitations: number;
  crsScore: number;
}

/** All filter options shown in the "Filter By Type" dropdown. */
const FILTER_OPTIONS = [
  'All',
  'Canadian Experience Class',
  'Provincial Nominee Program',
  'French-Language proficiency',
  'No program specified',
  'STEM occupations',
  'Healthcare occupations',
  'Trade occupations',
  'Transport occupations',
  'Agriculture and agri-food occupations',
  'Education occupations',
  'General',
];

/**
 * Format a YYYY-MM-DD date string as DD-MMM-YY (e.g. "18-Mar-26").
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-CA', { month: 'short', timeZone: 'UTC' });
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export default function DrawsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetch('/draws.json')
      .then((res) => res.json())
      .then((data: Draw[]) => {
        // Sort by drawNumber descending (newest first)
        const sorted = [...data].sort((a, b) => Number(b.drawNumber) - Number(a.drawNumber));
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

  /** Filter draws by the selected type (partial match on programType). */
  const filteredDraws =
    selectedFilter === 'All'
      ? draws
      : draws.filter((d) => d.programType.toLowerCase().includes(selectedFilter.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      {/* ── Header / Summary ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Express Entry Draws</h1>

        {latest && (
          <div className="grid grid-cols-3 gap-3">
            {/* Calculate Your Score */}
            <a
              href="https://www.cic.gc.ca/english/immigrate/skilled/crs-tool.asp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center active:opacity-70"
            >
              <svg className="w-7 h-7 text-red-600 dark:text-red-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className="text-xs font-semibold text-red-700 dark:text-red-400 leading-tight">Calculate Your Score</span>
            </a>

            {/* Latest draw date + invitations */}
            <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Latest Draw</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{formatDate(latest.drawDate)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{latest.invitations.toLocaleString()} invited</p>
            </div>

            {/* Min CRS Score (large) */}
            <div className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Min ITA Score</p>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{latest.crsScore}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Filter By Type ───────────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="relative">
          <button
            onClick={() => setFilterOpen((prev) => !prev)}
            className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filter By Type
            {selectedFilter !== 'All' && (
              <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs px-2 py-0.5 rounded-full font-medium">
                {selectedFilter}
              </span>
            )}
            <svg
              className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {filterOpen && (
            <div className="absolute left-0 mt-2 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 overflow-hidden w-72">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setSelectedFilter(opt);
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    selectedFilter === opt
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Draws Table ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-3">
        {filteredDraws.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-4">📊</div>
            <p>No draws match the selected filter.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[90px_1fr_80px] gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-right">Min ITA</span>
            </div>

            {/* Table rows */}
            {filteredDraws.map((draw, idx) => (
              <div
                key={draw.drawNumber}
                className={`grid grid-cols-[90px_1fr_80px] gap-2 px-4 py-3 items-start border-b dark:border-gray-700 last:border-0 ${
                  idx === 0 ? 'bg-red-50 dark:bg-red-900/10' : ''
                }`}
              >
                {/* Date */}
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(draw.drawDate)}</span>
                  {idx === 0 && (
                    <span className="block text-xs text-red-600 dark:text-red-400 font-semibold mt-0.5">Latest</span>
                  )}
                </div>

                {/* Full type name + invited count */}
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{draw.programType}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{draw.invitations.toLocaleString()} invited</p>
                </div>

                {/* Min ITA Score — bold */}
                <div className="text-right">
                  <span className="text-base font-bold text-gray-900 dark:text-white">{draw.crsScore}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          Data sourced from IRCC Express Entry draws
          {draws.length > 0 ? ` · Last updated ${formatDate(draws[0].drawDate)}` : ''}
        </p>
      </div>
    </div>
  );
}
