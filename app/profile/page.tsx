'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { generateMonths } from '@/lib/months';
import { PR_CATEGORIES, JOURNEY_STEPS } from '@/lib/categories';

const PR_MONTHS = generateMonths();

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [prMonth, setPrMonth] = useState('');
  const [prStream, setPrStream] = useState('');
  const [prCategory, setPrCategory] = useState('');
  const [stepDates, setStepDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const [profileResult, stepsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('journey_steps').select('step_name, step_date').eq('user_id', user.id),
      ]);

      if (profileResult.data) {
        const data = profileResult.data;
        setDisplayName(data.display_name || '');
        setPrMonth(data.pr_month || '');
        setPrStream(data.pr_stream || '');
        setPrCategory(data.pr_category || '');
      }

      if (!stepsResult.error && stepsResult.data) {
        const dates: Record<string, string> = {};
        stepsResult.data.forEach(({ step_name, step_date }) => {
          if (step_date) dates[step_name] = step_date;
        });
        setStepDates(dates);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');

    // Determine latest step for backwards-compatible application_status
    const latestStep = JOURNEY_STEPS.slice().reverse().find((s) => stepDates[s]);
    const applicationStatus = latestStep
      ? `${latestStep} (${stepDates[latestStep]})`
      : '';

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName,
      pr_month: prMonth,
      pr_stream: prStream,
      pr_category: prCategory,
      application_status: applicationStatus,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    // Upsert journey steps for each step that has a date
    const stepsToUpsert = JOURNEY_STEPS.filter((step) => stepDates[step]).map((step) => ({
      user_id: user.id,
      step_name: step,
      step_date: stepDates[step],
      updated_at: new Date().toISOString(),
    }));

    if (stepsToUpsert.length > 0) {
      const { error: stepsError } = await supabase
        .from('journey_steps')
        .upsert(stepsToUpsert, { onConflict: 'user_id,step_name' });

      if (stepsError) {
        setError(stepsError.message);
        setLoading(false);
        return;
      }
    }

    setSuccess('Profile saved successfully!');
    setTimeout(() => router.push('/groups'), 1500);
    setLoading(false);
  };

  const handleStepDate = (step: string, value: string) => {
    setStepDates((prev) => ({ ...prev, [step]: value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">👤</div>
          <h1 className="text-2xl font-bold text-gray-800">Your Profile</h1>
          <p className="text-gray-500 mt-1">Tell us about your PR application</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PR Application Month</label>
            <select
              value={prMonth}
              onChange={(e) => setPrMonth(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select your application month</option>
              {PR_MONTHS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PR Category</label>
            <select
              value={prCategory}
              onChange={(e) => setPrCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select your PR category</option>
              {PR_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Journey Step Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              PR Journey Dates <span className="text-gray-400 font-normal">(optional — fill in dates you have received)</span>
            </label>
            <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
              {JOURNEY_STEPS.map((step) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="text-sm w-40 text-gray-700 flex-shrink-0">{step}</span>
                  <input
                    type="date"
                    value={stepDates[step] || ''}
                    onChange={(e) => handleStepDate(step, e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {stepDates[step] && (
                    <button
                      type="button"
                      onClick={() => handleStepDate(step, '')}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                      aria-label={`Clear ${step} date`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}