'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && !authError && user) {
      router.replace('/welcome');
    }
  }, [user, loading, authError, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400 text-lg">Loading…</div>
      </div>
    );
  }

  if (!authError && user) {
    return null;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      setMessage('Account created! Please check your email to confirm, then log in.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Canada PR Chat" width={96} height={96} className="rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Create Account</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Join Canada PR Chat today</p>
        </div>

        {authError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            ⚠️ {authError}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="you@example.com"
              inputMode="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Minimum 6 characters"
            />
          </div>
          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="consent"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-red-600 focus:ring-red-500 cursor-pointer flex-shrink-0"
            />
            <label htmlFor="consent" className="text-sm text-gray-600 dark:text-slate-400 cursor-pointer">
              I agree to the{' '}
              <Link href="/privacy" className="text-red-600 font-medium hover:underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" className="text-red-600 font-medium hover:underline">
                Terms of Service
              </Link>
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting || !consentChecked}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-500 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-red-600 font-medium hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}