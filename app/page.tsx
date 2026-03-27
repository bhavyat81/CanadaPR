'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import LatestDrawCard from '@/components/LatestDrawCard';

function AccordionSection({
  id,
  title,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="font-semibold text-gray-800 dark:text-slate-100">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-5">
          {children}
        </div>
      )}
    </div>
  );
}

function LoggedInDashboard() {
  const [openSections, setOpenSections] = useState<string[]>(['quick-links']);

  const toggle = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const isOpen = (id: string) => openSections.includes(id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 page-fade-in">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">
          🍁 Welcome back!
        </h1>

        <div className="space-y-3">
          <AccordionSection
            id="latest-draw"
            title="📊 Latest Express Entry Draw"
            isOpen={isOpen('latest-draw')}
            onToggle={() => toggle('latest-draw')}
          >
            <LatestDrawCard />
            <Link href="/draws" className="block mt-3 text-center text-sm text-red-600 dark:text-red-400 hover:underline">
              View all draws →
            </Link>
          </AccordionSection>

          <AccordionSection
            id="my-groups"
            title="💬 My Groups"
            isOpen={isOpen('my-groups')}
            onToggle={() => toggle('my-groups')}
          >
            <div className="space-y-2">
              <Link href="/groups" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                <span className="text-gray-700 dark:text-slate-200">Browse &amp; join groups</span>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </AccordionSection>

          <AccordionSection
            id="pr-journey"
            title="🛤️ My PR Journey"
            isOpen={isOpen('pr-journey')}
            onToggle={() => toggle('pr-journey')}
          >
            <Link href="/profile" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
              <span className="text-gray-700 dark:text-slate-200">Update my profile &amp; journey</span>
              <span className="text-gray-400">→</span>
            </Link>
          </AccordionSection>

          <AccordionSection
            id="quick-links"
            title="⚡ Quick Links"
            isOpen={isOpen('quick-links')}
            onToggle={() => toggle('quick-links')}
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: '/calculator', emoji: '🧮', label: 'CRS Calculator' },
                { href: '/vault', emoji: '🔒', label: 'My Vault' },
                { href: '/profile', emoji: '👤', label: 'My Profile' },
                { href: '/draws', emoji: '📊', label: 'All Draws' },
              ].map(({ href, emoji, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 hover:shadow-sm transition-all"
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{label}</span>
                </Link>
              ))}
            </div>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-slate-400 text-lg">Loading…</div>
      </div>
    );
  }

  if (user) {
    return <LoggedInDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 page-fade-in">
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
          <div className="mt-6">
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 text-red-100 hover:text-white transition-colors text-sm font-medium underline underline-offset-4"
            >
              🧮 Calculate Your CRS Score
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Draw Section */}
      <section className="py-12 px-4 bg-white dark:bg-slate-800/50">
        <div className="max-w-lg mx-auto">
          <LatestDrawCard />
          <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-2">
            Data sourced from IRCC open data — updates automatically
          </p>
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

