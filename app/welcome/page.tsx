'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { JOURNEY_STEPS, VISA_OFFICE_STEPS, VISA_OFFICES } from '@/lib/categories';
import { initPushNotifications } from '@/lib/notifications';

const SUCCESS_REDIRECT_DELAY = 1500;

export default function WelcomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [selectedStep, setSelectedStep] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, notifications_enabled')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push('/profile');
        return;
      }

      setDisplayName(profile.display_name);
      setNotificationsEnabled(profile.notifications_enabled !== false);
    };

    loadProfile();
  }, [user, router]);

  const isVisaOfficeStep = VISA_OFFICE_STEPS.includes(selectedStep);

  const handleNotificationsToggle = async () => {
    if (!user || savingNotif) return;
    const newValue = !notificationsEnabled;
    setSavingNotif(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ notifications_enabled: newValue })
      .eq('id', user.id);
    if (!updateError) {
      setNotificationsEnabled(newValue);
      // If turning on, attempt to (re)register for push
      if (newValue) {
        initPushNotifications(user.id).catch((err) =>
          console.error('[WelcomePage] push registration error:', err)
        );
      }
    }
    setSavingNotif(false);
  };

  const handleSave = async () => {
    if (!user || !selectedStep || !selectedValue) return;

    // Validate date is not in the future (only for regular date steps, not visa office steps)
    if (!isVisaOfficeStep) {
      const today = new Date().toISOString().split('T')[0];
      if (selectedValue > today) {
        setError('Date cannot be in the future.');
        return;
      }
    }

    setSaving(true);
    setError('');

    if (isVisaOfficeStep) {
      // Save PVO/SVO as text to profiles table (not journey_steps)
      const fieldKey =
        selectedStep === 'PVO (Inland)' ? 'pvo' :
        selectedStep === 'SVO (Inland)' ? 'svo' :
        null;

      if (!fieldKey) {
        setSaving(false);
        setError('Unrecognised visa office step.');
        return;
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ [fieldKey]: selectedValue, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (profileUpdateError) {
        setSaving(false);
        setError('Failed to save update. Please try again.');
        return;
      }
    } else {
      // Save to journey_steps table
      const { error: stepsError } = await supabase.from('journey_steps').upsert(
        {
          user_id: user.id,
          step_name: selectedStep,
          step_date: selectedValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,step_name' }
      );

      if (stepsError) {
        setSaving(false);
        setError('Failed to save update. Please try again.');
        return;
      }

      // Also update application_status for backwards compatibility
      const statusWithDate = `${selectedStep} (${selectedValue})`;
      await supabase
        .from('profiles')
        .update({
          application_status: statusWithDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    setSaving(false);
    setStep(4);
    setTimeout(() => {
      router.push('/groups');
    }, SUCCESS_REDIRECT_DELAY);
  };

  if (authLoading || !displayName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* Step 1: Welcome + Yes/No */}
        {step === 1 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🇨🇦</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome back, {displayName}!
            </h1>
            <p className="text-gray-600 mb-8">
              Is there any new update you want to share?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => router.push('/groups')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                No
              </button>
            </div>

            {/* Notifications toggle */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>🔔</span>
                <span>Notifications</span>
              </div>
              <button
                onClick={handleNotificationsToggle}
                disabled={savingNotif}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  notificationsEnabled ? 'bg-red-600' : 'bg-gray-300'
                }`}
                aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select journey step */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="text-gray-400 hover:text-gray-600 mb-4 text-sm flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Which step did you complete?</h2>
            <p className="text-gray-500 text-sm mb-6">Select the step in your PR journey</p>
            <div className="space-y-3">
              {JOURNEY_STEPS.map((journeyStep, index) => (
                <button
                  key={journeyStep}
                  onClick={() => {
                    setSelectedStep(journeyStep);
                    setSelectedValue('');
                    setStep(3);
                  }}
                  className="w-full text-left border border-gray-200 rounded-xl px-4 py-3 hover:border-red-400 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 font-medium w-5">{index + 1}.</span>
                    <span className="font-semibold text-gray-800">{journeyStep}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date/office picker */}
        {step === 3 && (
          <div>
            <button
              onClick={() => setStep(2)}
              className="text-gray-400 hover:text-gray-600 mb-4 text-sm flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {isVisaOfficeStep ? 'Which visa office?' : 'When did you receive this update?'}
            </h2>
            <p className="text-gray-500 text-sm mb-2">
              Step: <span className="font-medium text-red-600">{selectedStep}</span>
            </p>
            <div className="mb-6 mt-4">
              {isVisaOfficeStep ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visa office</label>
                  <select
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select visa office</option>
                    {VISA_OFFICES.map((office) => (
                      <option key={office} value={office}>{office}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date received</label>
                  <input
                    type="date"
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </>
              )}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={!selectedValue || saving}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile updated!</h2>
            <p className="text-gray-500">Redirecting you to the groups...</p>
          </div>
        )}
      </div>
    </div>
  );
}
