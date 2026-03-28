'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface DrawRound {
  drawNumber: string;
  drawDate: string;
  drawName: string;
  drawCRS: string;
  drawSize: string;
}

const IRCC_DRAWS_URL =
  'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json';

const NO_PROGRAM_LABEL = 'No Program Specified';

const PROGRAM_FILTERS = ['All', 'CEC', 'French', 'PNP', 'STEM', 'Trade', NO_PROGRAM_LABEL];

function getProgramLabel(drawName: string): string {
  const lower = drawName.toLowerCase();
  if (lower.includes('canadian experience')) return 'CEC';
  if (lower.includes('french')) return 'French';
  if (lower.includes('provincial')) return 'PNP';
  if (lower.includes('stem')) return 'STEM';
  if (lower.includes('trade')) return 'Trade';
  if (lower.includes('no program') || lower.trim() === '') return NO_PROGRAM_LABEL;
  return drawName;
}

function matchesFilter(drawName: string, filter: string): boolean {
  if (filter === 'All') return true;
  const label = getProgramLabel(drawName);
  if (filter === NO_PROGRAM_LABEL) return label === NO_PROGRAM_LABEL;
  return label === filter || drawName.toLowerCase().includes(filter.toLowerCase());
}

export default function DrawsPage() {
  const router = useRouter();
  const [draws, setDraws] = useState<DrawRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        const res = await fetch(IRCC_DRAWS_URL);
        if (!res.ok) throw new Error('Failed to fetch draws');
        const json = await res.json();
        const rounds: DrawRound[] = (json.rounds ?? []).map((r: Record<string, string>) => ({
          drawNumber: r.drawNumber ?? r.DrawNumber ?? '',
          drawDate: r.drawDate ?? r.DrawDate ?? r.DrawDateFull ?? '',
          drawName: r.drawName ?? r.DrawName ?? '',
          drawCRS: r.drawCRS ?? r.DrawCRS ?? '',
          drawSize: r.drawSize ?? r.DrawSize ?? '',
        }));
        // Sort by most recent first (drawNumber descending)
        rounds.sort((a, b) => parseInt(b.drawNumber, 10) - parseInt(a.drawNumber, 10));
        setDraws(rounds);
      } catch {
        setError('Could not load draw data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchDraws();
  }, []);

  const filtered = useMemo(() => {
    return draws.filter((d) => {
      const matchesProgram = matchesFilter(d.drawName, filter);
      const matchesSearch =
        !search ||
        d.drawName.toLowerCase().includes(search.toLowerCase()) ||
        d.drawNumber.includes(search) ||
        d.drawDate.includes(search);
      return matchesProgram && matchesSearch;
    });
  }, [draws, filter, search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 px-4 py-6 page-fade-in">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/welcome')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Back"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">📊 Express Entry Draws</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">All rounds from IRCC open data</p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, draw #, or date..."
          className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 mb-4 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />

        {/* Program Filter */}
        <div className="flex flex-wrap gap-2 mb-5">
          {PROGRAM_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-red-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-600 hover:border-red-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">Loading draws...</div>
        )}
        {error && (
          <div className="text-center py-12 text-red-600 dark:text-red-400">{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">No draws found.</div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((draw) => (
              <div
                key={draw.drawNumber}
                className="bg-white dark:bg-slate-800 rounded-xl px-4 py-4 border border-gray-100 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">
                        #{draw.drawNumber}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">{draw.drawDate}</span>
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm leading-snug truncate">
                      {draw.drawName || NO_PROGRAM_LABEL}
                    </p>
                  </div>
                  <div className="flex gap-4 flex-shrink-0 text-right">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">CRS Cutoff</p>
                      <p className="font-bold text-red-600 dark:text-red-400">{draw.drawCRS}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Invitations</p>
                      <p className="font-semibold text-gray-700 dark:text-slate-200">
                        {Number(draw.drawSize).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
