'use client';

import { useState, useEffect } from 'react';

export interface VisualViewport {
  /** Current visual viewport height in px (shrinks when iOS keyboard opens). */
  height: number;
  /**
   * Distance from the top of the layout viewport to the top of the visual
   * viewport (non-zero when the page is scrolled under a fixed keyboard).
   */
  offsetTop: number;
}

/**
 * Returns the current visual viewport dimensions without debounce so the
 * chat container reacts immediately when the iOS keyboard opens or closes.
 *
 * On iOS with Capacitor (Keyboard resize: 'none'), window.innerHeight stays
 * fixed but visualViewport.height shrinks when the keyboard appears.
 * Tracking both height and offsetTop lets the container stay pinned in the
 * visible area regardless of safe-area insets or keyboard state.
 *
 * Falls back to { height: window.innerHeight, offsetTop: 0 } on platforms
 * where visualViewport is unavailable.
 */
export function useVisualViewportHeight(): VisualViewport {
  const [viewport, setViewport] = useState<VisualViewport>(() => {
    if (typeof window === 'undefined') return { height: 0, offsetTop: 0 };
    return {
      height: window.visualViewport?.height ?? window.innerHeight,
      offsetTop: window.visualViewport?.offsetTop ?? 0,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;

    const update = () => {
      // Use requestAnimationFrame so we read the final post-layout values
      // without introducing an artificial delay (removed the old 50 ms debounce).
      requestAnimationFrame(() => {
        setViewport({
          height: vv ? vv.height : window.innerHeight,
          offsetTop: vv ? vv.offsetTop : 0,
        });
      });
    };

    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    } else {
      window.addEventListener('resize', update);
    }

    // Sync on mount in case the viewport already differs from defaults
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

  return viewport;
}
