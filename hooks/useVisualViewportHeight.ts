'use client';

import { useState, useEffect } from 'react';

/**
 * Returns the current visual viewport height in pixels.
 * On iOS with Capacitor (Keyboard resize: 'none'), the visual viewport shrinks
 * when the keyboard opens, but window.innerHeight does not. Using this hook
 * lets the chat container respond to keyboard appearance by dynamically
 * adjusting its height.
 *
 * Falls back to window.innerHeight on platforms where visualViewport is unavailable.
 */
export function useVisualViewportHeight(): number {
  const getHeight = () =>
    typeof window !== 'undefined'
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 0;

  const [height, setHeight] = useState<number>(getHeight);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;

    const update = () => setHeight(vv ? vv.height : window.innerHeight);

    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    } else {
      window.addEventListener('resize', update);
    }

    // Ensure we have the latest value on mount
    update();

    return () => {
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
