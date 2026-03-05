'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  display_name: string;
  pr_month: string | null;
  pr_stream: string | null;
  application_status: string | null;
}

interface UserJourneyModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserJourneyModal({ userId, isOpen, onClose }: UserJourneyModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    setLoading(true);
    supabase
      .from('profiles')
      .select('display_name, pr_month, pr_stream, application_status')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setProfile(null);
        setLoading(false);
      });
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">🗺️ PR Journey</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading profile...</div>
        ) : !profile ? (
          <div className="text-center text-gray-500 py-8">Profile not found.</div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-1">👤</div>
              <p className="text-xl font-semibold text-gray-800">{profile.display_name}</p>
            </div>

            <div className="border-t pt-4 space-y-3">
              {profile.pr_month && (
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📅</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">PR Month</p>
                    <p className="text-sm font-semibold text-gray-800">{profile.pr_month}</p>
                  </div>
                </div>
              )}

              {profile.pr_stream && (
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🛤️</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">PR Stream</p>
                    <p className="text-sm font-semibold text-gray-800">{profile.pr_stream}</p>
                  </div>
                </div>
              )}

              {profile.application_status && (
                <div className="flex items-center space-x-3">
                  <span className="text-lg">✅</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Application Status</p>
                    <span className="inline-block mt-1 px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                      {profile.application_status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
