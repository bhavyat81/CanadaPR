'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme') as Theme | null;
      const prefersDark = (() => {
        try {
          return window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch (e) {
          console.error('matchMedia unavailable:', e);
          return false;
        }
      })();
      const preferred = stored ?? (prefersDark ? 'dark' : 'light');
      setTheme(preferred);
      document.documentElement.classList.toggle('dark', preferred === 'dark');
    } catch (e) {
      // localStorage unavailable (e.g. restricted Capacitor WebView)
      console.error('localStorage unavailable in ThemeProvider:', e);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('theme', next);
      } catch (e) {
        console.error('localStorage unavailable:', e);
      }
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  // Avoid flash of wrong theme — render children only after mount
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
