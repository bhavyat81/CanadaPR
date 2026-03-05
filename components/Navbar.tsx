'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold">
            <span>🇨🇦</span>
            <span>Canada PR Chat</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-red-200 transition-colors">Home</Link>
            {user ? (
              <>
                <Link href="/groups" className="hover:text-red-200 transition-colors">Groups</Link>
                <Link href="/profile" className="hover:text-red-200 transition-colors">My Profile</Link>
                <span className="text-red-200 text-sm">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
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
        </div>
      </div>
    </nav>
  );
}
