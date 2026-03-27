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
  DrawCutOff?: string;
}

interface DrawData {
  rounds: DrawRound[];
}

export default function LatestDrawCard() {
  const [draw, setDraw] = useState<DrawRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDraw = async () => {
      try {
        const res = await fetch(
          'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json',
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data: DrawData = await res.json();
        if (data?.rounds?.length > 0) {
          setDraw(data.rounds[0]);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDraw();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
      </div>
    );
  }

  if (error || !draw) {
    return null;
  }

  return (
    <div className="rounded-2xl p-[2px] bg-gradient-to-r from-red-500 via-red-400 to-orange-400 shadow-lg shadow-red-100/50 dark:shadow-red-900/30">
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-base">
            📊 Latest Express Entry Draw
          </h3>
          <span className="text-xs text-gray-400 dark:text-slate-400">Auto-updated</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 dark:bg-slate-700/60 rounded-xl p-3">
            <div className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">📊 CRS Cutoff</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{draw.DrawCRS || '—'}</div>
          </div>
          <div className="bg-red-50 dark:bg-slate-700/60 rounded-xl p-3">
            <div className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">👥 Invitations</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {draw.DrawSize ? Number(draw.DrawSize).toLocaleString() : '—'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700/40 rounded-xl p-3">
            <div className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">📅 Date</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-slate-200">{draw.DrawDateFull || draw.DrawDate}</div>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700/40 rounded-xl p-3">
            <div className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">🏷️ Program</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-slate-200 truncate">{draw.DrawName || 'General'}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-slate-500">Draw #{draw.DrawNumber}</span>
          <Link href="/draws" className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium">
            View all draws →
          </Link>
        </div>
      </div>
    </div>
  );
}
