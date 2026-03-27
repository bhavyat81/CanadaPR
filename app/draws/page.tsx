'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface Draw {
  drawNumber: number;
  date: string;
  program: string;
  crsScore: number;
  invitations: number;
}

interface DrawsData {
  lastUpdated: string;
  draws: Draw[];
}

function getProgramBadgeColor(program: string): string {
  if (program.includes('Canadian Experience')) return 'bg-blue-100 text-blue-800';
  if (program.includes('Federal Skilled Worker')) return 'bg-green-100 text-green-800';
  if (program.includes('Provincial Nominee')) return 'bg-purple-100 text-purple-800';
  if (program.includes('Federal Skilled Trades')) return 'bg-orange-100 text-orange-800';
  if (program.includes('STEM')) return 'bg-cyan-100 text-cyan-800';
  if (program.includes('Healthcare')) return 'bg-pink-100 text-pink-800';
  return 'bg-gray-100 text-gray-800';
}

function getProgramShort(program: string): string {
  if (program.includes('Canadian Experience')) return 'CEC';
  if (program.includes('Federal Skilled Worker')) return 'FSW';
  if (program.includes('Provincial Nominee')) return 'PNP';
  if (program.includes('Federal Skilled Trades')) return 'FST';
  if (program.includes('STEM')) return 'STEM';
  if (program.includes('Healthcare')) return 'Healthcare';
  if (program.includes('No Limits')) return 'All Programs';
  return program;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DrawsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        const res = await fetch('/draws.json');
        if (!res.ok) throw new Error('Failed to load draws data');
        const data: DrawsData = await res.json();
        setDraws(data.draws);
        setLastUpdated(data.lastUpdated);
      } catch {
        setError('Unable to load draw data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchDraws();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
      {/* Page Header */}
      <div className="bg-white border-b shadow-sm px-4 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">📊</span>
            <h1 className="text-2xl font-bold text-gray-900">Express Entry Draws</h1>
          </div>
          <p className="text-sm text-gray-500 ml-11">
            Latest IRCC Express Entry invitation rounds
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 ml-11 mt-1">
              Last updated: {formatDate(lastUpdated)}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading draws...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : draws.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-600 font-medium">No draws available</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon for the latest Express Entry draws.</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Latest CRS</p>
                <p className="text-2xl font-bold text-red-600">{draws[0].crsScore}</p>
                <p className="text-xs text-gray-500 mt-0.5">Draw #{draws[0].drawNumber}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Latest Invites</p>
                <p className="text-2xl font-bold text-gray-800">{draws[0].invitations.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(draws[0].date)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Lowest CRS (recent)</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.min(...draws.map((d) => d.crsScore))}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Last 20 draws</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Total Draws Shown</p>
                <p className="text-2xl font-bold text-gray-800">{draws.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Most recent first</p>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Draw #</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Program</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CRS Score</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Invitations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {draws.map((draw, idx) => (
                    <tr key={draw.drawNumber} className={idx === 0 ? 'bg-red-50' : 'hover:bg-gray-50 transition-colors'}>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-700">#{draw.drawNumber}</span>
                        {idx === 0 && <span className="ml-2 text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-medium">Latest</span>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-sm">{formatDate(draw.date)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getProgramBadgeColor(draw.program)}`}>
                          {getProgramShort(draw.program)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-800">{draw.crsScore}</td>
                      <td className="px-5 py-3.5 text-right text-gray-600">{draw.invitations.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {draws.map((draw, idx) => (
                <div
                  key={draw.drawNumber}
                  className={`bg-white rounded-xl shadow-sm border p-4 ${idx === 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-bold text-gray-800">Draw #{draw.drawNumber}</span>
                      {idx === 0 && <span className="ml-2 text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-medium">Latest</span>}
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(draw.date)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getProgramBadgeColor(draw.program)}`}>
                      {getProgramShort(draw.program)}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-400">CRS Score</p>
                      <p className="text-xl font-bold text-red-600">{draw.crsScore}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Invitations</p>
                      <p className="text-xl font-bold text-gray-800">{draw.invitations.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              Data sourced from IRCC Express Entry draws. Updated manually.{' '}
              <a
                href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/submit-profile/rounds-invitations.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:underline"
              >
                Official IRCC source ↗
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
