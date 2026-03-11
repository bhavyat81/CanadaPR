'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

const UPDATE_TYPES = [
  'PPR (Passport Request)',
  'Background Check',
  'Medical Request',
  'Biometrics Request',
  'AOR (Acknowledgement of Receipt)',
  'COPR (Confirmation of Permanent Residence)',
  'Other',
];

type Step = 'welcome' | 'select-update' | 'select-date' | 'success';

export default function WelcomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [step, setStep] = useState<Step>('welcome');
  const [selectedUpdate, setSelectedUpdate] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()
        .then(({ data, error: fetchError }) => {
          if (!fetchError && data?.display_name) {
            setDisplayName(data.display_name);
          }
        });
    }
  }, [user]);

  const handleSubmitUpdate = async () => {
    if (!user || !selectedUpdate) return;
    setSaving(true);
    setError('');

    const statusValue = selectedDate
      ? `${selectedUpdate} (${selectedDate})`
      : selectedUpdate;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        application_status: statusValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStep('success');
    setTimeout(() => router.push('/groups'), 1500);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <div className="text-center">
            <div className="text-4xl mb-4">🇨🇦</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome back{displayName ? `, ${displayName}` : ''}!
            </h1>
            <p className="text-gray-600 mb-8">
              Is there any new update you want to share?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep('select-update')}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => router.push('/groups')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Update Type */}
        {step === 'select-update' && (
          <div>
            <button
              onClick={() => setStep('welcome')}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Which update did you receive?</h2>
            <p className="text-gray-500 text-sm mb-6">Select the update that best describes your news</p>
            <div className="space-y-3">
              {UPDATE_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedUpdate === type
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="update-type"
                    value={type}
                    checked={selectedUpdate === type}
                    onChange={() => setSelectedUpdate(type)}
                    className="accent-red-600 w-4 h-4"
                  />
                  <span className="text-gray-800 font-medium">{type}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setStep('select-date')}
              disabled={!selectedUpdate}
              className="mt-6 w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 3: Select Date */}
        {step === 'select-date' && (
          <div>
            <button
              onClick={() => setStep('select-update')}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-2">When did you receive this update?</h2>
            <p className="text-gray-500 text-sm mb-6">
              Selected: <span className="font-medium text-red-600">{selectedUpdate}</span>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date received <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <button
              onClick={handleSubmitUpdate}
              disabled={saving || !selectedDate}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Submit'}
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Profile updated!</h2>
            <p className="text-gray-500">Redirecting you to your groups...</p>
          </div>
        )}

      </div>
    </div>
  );
}
