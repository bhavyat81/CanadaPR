'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold">
            <Image src="/logo.png" alt="Canada PR Chat" width={36} height={36} className="rounded-lg" />
            <span>Canada PR Chat</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/welcome" className="hover:text-red-200 transition-colors">Home</Link>
                <Link href="/groups" className="hover:text-red-200 transition-colors">Groups</Link>
                <Link href="/profile" className="hover:text-red-200 transition-colors">My Profile</Link>
                <span className="text-red-200 text-sm truncate max-w-[150px]">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="hover:text-red-200 transition-colors">Home</Link>
                <Link href="/login" className="hover:text-red-200 transition-colors">Log In</Link>
                <Link
                  href="/signup"
                  className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-red-700 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-red-500">
          <div className="px-4 py-3 space-y-3">
            {user ? (
              <>
                <Link href="/welcome" onClick={closeMenu} className="block hover:text-red-200 transition-colors">
                  Home
                </Link>
                <Link href="/groups" onClick={closeMenu} className="block hover:text-red-200 transition-colors">
                  Groups
                </Link>
                <Link href="/profile" onClick={closeMenu} className="block hover:text-red-200 transition-colors">
                  My Profile
                </Link>
                <div className="text-red-200 text-sm truncate">{user.email}</div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/" onClick={closeMenu} className="block hover:text-red-200 transition-colors">
                  Home
                </Link>
                <Link href="/login" onClick={closeMenu} className="block hover:text-red-200 transition-colors">
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="block text-center bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}