import type { Metadata } from 'next';
import type { Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import SwipeBackProvider from '@/components/SwipeBackProvider';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Canada PR Chat',
  description: 'Connect with fellow Canada PR applicants who applied in the same month as you',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Canada PR Chat',
    description: 'Connect with fellow Canada PR applicants who applied in the same month as you',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Canada PR Chat' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Ultimate fallback: hide the Capacitor splash screen after 8 seconds
            even if React/Next.js chunks fail to load entirely. The
            SwipeBackProvider effect is the primary hide path (runs at ~0 ms
            after mount); this script only fires when the web layer doesn't
            load at all. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (
                  typeof window !== 'undefined' &&
                  window.Capacitor &&
                  typeof window.Capacitor.isNativePlatform === 'function' &&
                  window.Capacitor.isNativePlatform()
                ) {
                  setTimeout(function () {
                    try {
                      window.Capacitor.Plugins.SplashScreen.hide();
                    } catch (e) {
                      console.error('Last-resort splash hide failed:', e);
                    }
                  }, 8000);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="h-full bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-sans flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <SwipeBackProvider>
              <Navbar />
              <main className="flex-1 min-h-0">{children}</main>
            </SwipeBackProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
