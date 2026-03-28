'use client';

import { useState, useEffect, useRef } from 'react';

export interface ViewportMetrics {
  height: number;
  offsetTop: number;
}

/**
 * Returns the current visual viewport height and offsetTop in pixels.
 * On iOS with Capacitor (Keyboard resize: 'none'), the visual viewport shrinks
 * when the keyboard opens, but window.innerHeight does not. Using this hook
 * lets the chat container respond to keyboard appearance by dynamically
 * adjusting its size/position.
 *
 * Falls back to window.innerHeight / offsetTop=0 on platforms where
 * visualViewport is unavailable.
 *
 * Debounce: 300 ms when the keyboard is opening (height decreasing) so the
 * layout waits for the animation to settle; 50 ms otherwise.
 */
export function useVisualViewportHeight(): ViewportMetrics {
  const getMetrics = (): ViewportMetrics => {
    if (typeof window === 'undefined') return { height: 0, offsetTop: 0 };
    return {
      height: window.visualViewport?.height ?? window.innerHeight,
      offsetTop: window.visualViewport?.offsetTop ?? 0,
    };
  };

  const [metrics, setMetrics] = useState<ViewportMetrics>(() => getMetrics());

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHeightRef = useRef<number>(metrics.height);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;

    const update = () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      const newHeight = vv ? vv.height : window.innerHeight;
      // Use a longer debounce when the keyboard is opening (height shrinking)
      // so we wait for the iOS animation to finish before reflowing.
      const delay = newHeight < prevHeightRef.current ? 300 : 50;
      timerRef.current = setTimeout(() => {
        const m = getMetrics();
        prevHeightRef.current = m.height;
        setMetrics(m);
      }, delay);
    };

    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    } else {
      window.addEventListener('resize', update);
    }

    // Ensure we have the latest value on mount
    const m = getMetrics();
    prevHeightRef.current = m.height;
    setMetrics(m);

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

  return metrics;
}
