'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { user, loading, error: authError } = useAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 page-fade-in">
      {authError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 text-center text-sm">
          ⚠️ Connection issue: {authError}
        </div>
      )}
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 text-white py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08)_0%,_transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="Canada PR Chat" width={144} height={144} className="rounded-3xl shadow-2xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Canada PR Chat
          </h1>
          <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-2xl mx-auto">
            Connect with fellow Canada Permanent Residence applicants who applied in the same month as you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-50 transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started — Sign Up
            </Link>
            <Link
              href="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Log In
            </Link>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-slate-100 mb-12">
            Why Canada PR Chat?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '💬', title: 'Monthly Chat Groups', desc: "Join your application month's chat group and connect with applicants at the same stage as you." },
              { icon: '⚡', title: 'Real-time Messaging', desc: 'Get instant updates and share your journey with real-time chat powered by Supabase.' },
              { icon: '🤝', title: 'Community Support', desc: 'Share tips, updates, and support each other through the Canadian PR application process.' },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md dark:shadow-slate-900/50 text-center hover:scale-[1.02] transition-transform border border-transparent dark:border-slate-700"
              >
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-3">{title}</h3>
                <p className="text-gray-600 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white dark:bg-slate-800 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-slate-100 mb-12">How It Works</h2>
          <div className="space-y-8">
            {[
              { step: '1', title: 'Create Your Account', description: 'Sign up with your email and password' },
              { step: '2', title: 'Set Up Your Profile', description: 'Enter your PR application month, stream, and status' },
              { step: '3', title: 'Join Your Group', description: "Automatically matched to your application month's chat group" },
              { step: '4', title: 'Start Chatting', description: 'Connect with fellow applicants in real-time' },
            ].map(({ step, title, description }) => (
              <div key={step} className="flex items-start space-x-4">
                <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{title}</h3>
                  <p className="text-gray-600 dark:text-slate-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-red-600 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to connect?</h2>
        <p className="text-red-100 mb-8 text-lg">Join thousands of Canadian PR applicants today</p>
        <Link
          href="/signup"
          className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-50 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
        >
          Sign Up Free
        </Link>
      </section>

      {/* Legal Disclaimer Footer */}
      <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 py-6 px-4 text-center">
        <p className="text-xs text-gray-400 dark:text-slate-500 max-w-2xl mx-auto">
          CanadaPR Chat is a community platform and is not affiliated with IRCC or any government body. This is not immigration advice.
        </p>
      </footer>
    </div>
  );
}

