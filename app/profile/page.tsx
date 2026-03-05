'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

// Generate months from January 2025 to December 2026
const generateMonths = () => {
  const months = [];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  for (let year = 2025; year <= 2026; year++) {
    for (let month = 1; month <= 12; month++) {
      const value = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${monthNames[month - 1]} ${year}`;
      months.push({ value, label });
    }
  }
  return months;
};

const PR_MONTHS = generateMonths();

const PR_STREAMS = [
  'Express Entry',
  'Provincial Nominee Program (PNP)',
  'Family Sponsorship',
  'Canadian Experience Class',
  'Other',
];

const APPLICATION_STATUSES = [
  'AOR Received',
  'Biometrics Done',
  'Medicals Done',
  'Background Check',
  'PPR',
  'COPR',
  'Waiting',
];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [prMonth, setPrMonth] = useState('');
  const [prStream, setPrStream] = useState('');
  const [appStatus, setAppStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load existing profile
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setDisplayName(data.display_name || '');
            setPrMonth(data.pr_month || '');
            setPrStream(data.pr_stream || '');
            setAppStatus(data.application_status || '');
          }
        });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName,
      pr_month: prMonth,
      pr_stream: prStream,
      application_status: appStatus,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Profile saved successfully!');
      setTimeout(() => router.push('/groups'), 1500);
    }
    setLoading(false);
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
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PR Application Month</label>
            <select
              value={prMonth}
              onChange={(e) => setPrMonth(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
            >
              <option value="">Select your application month</option>
              {PR_MONTHS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PR Stream</label>
            <select
              value={prStream}
              onChange={(e) => setPrStream(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
            >
              <option value="">Select your PR stream</option>
              {PR_STREAMS.map((stream) => (
                <option key={stream} value={stream}>{stream}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Status</label>
            <select
              value={appStatus}
              onChange={(e) => setAppStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
            >
              <option value="">Select your current status</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
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
