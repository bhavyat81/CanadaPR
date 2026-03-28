'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Returns the current visual viewport height in pixels.
 * On iOS with Capacitor (Keyboard resize: 'none'), the visual viewport shrinks
 * when the keyboard opens, but window.innerHeight does not. Using this hook
 * lets the chat container respond to keyboard appearance by dynamically
 * adjusting its height.
 *
 * Falls back to window.innerHeight on platforms where visualViewport is unavailable.
 * Debounces updates by 50 ms to avoid layout thrashing during keyboard animation.
 */
export function useVisualViewportHeight(): number {
  const getHeight = () =>
    typeof window !== 'undefined'
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 0;

  const [height, setHeight] = useState<number>(() =>
    typeof window !== 'undefined' ? (window.visualViewport?.height ?? window.innerHeight) : 0
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;

    const update = () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setHeight(vv ? vv.height : window.innerHeight);
      }, 50);
    };

    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    } else {
      window.addEventListener('resize', update);
    }

    // Ensure we have the latest value on mount
    setHeight(getHeight());

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      } else {
        window.removeEventListener('resize', update);
      }
    };
  }, []);

  return height;
}
