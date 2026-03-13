'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatMonth } from '@/lib/months';
import { getCategoryLabel } from '@/lib/categories';
import StatusTimeline, { JourneyStep } from './StatusTimeline';

interface UserProfile {
  display_name: string;
  pr_month: string | null;
  pr_category: string | null;
  application_status: string | null;
}

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    setLoading(true);
    setError(null);
    setProfile(null);
    setJourneySteps([]);

    const load = async () => {
      const [profileResult, stepsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, pr_month, pr_category, application_status')
          .eq('id', userId)
          .single(),
        supabase
          .from('journey_steps')
          .select('step_name, step_date')
          .eq('user_id', userId),
      ]);

      if (cancelled) return;

      if (profileResult.error) {
        setError('Could not load user profile.');
        console.error('Failed to load profile:', profileResult.error);
      } else {
        setProfile(profileResult.data);
      }

      if (!stepsResult.error && stepsResult.data) {
        setJourneySteps(stepsResult.data);
      }

      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, isOpen]);

  if (!isOpen) return null;

  const categoryLabel = profile?.pr_category ? getCategoryLabel(profile.pr_category) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-800 truncate">
                  @{profile?.display_name ?? 'Unknown User'}&apos;s PR Journey
                </h2>
                {categoryLabel && (
                  <p className="text-sm text-gray-500 mt-0.5">{categoryLabel}</p>
                )}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 mt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <>
            {profile?.pr_month && (
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium text-gray-700">Application Month:</span>{' '}
                {formatMonth(profile.pr_month)}
              </p>
            )}
            <StatusTimeline
              journeySteps={journeySteps}
              applicationStatus={profile?.application_status ?? ''}
            />
          </>
        )}
      </div>
    </div>
  );
}
