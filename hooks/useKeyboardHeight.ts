'use client';

import { useState, useEffect } from 'react';

/**
 * Returns the current keyboard height in pixels.
 * Uses Capacitor's native Keyboard plugin events on iOS/Android.
 * Falls back to visualViewport on web.
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    let unmounted = false;
    const cleanupFns: (() => void)[] = [];

    // Try Capacitor Keyboard plugin first (works on iOS/Android)
    import('@capacitor/keyboard')
      .then(({ Keyboard }) => {
        if (unmounted) return;
        const showHandlePromise = Keyboard.addListener('keyboardWillShow', (info) => {
          setKeyboardHeight(info.keyboardHeight);
        });
        const hideHandlePromise = Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardHeight(0);
        });
        cleanupFns.push(() => {
          showHandlePromise.then((h) => h.remove());
          hideHandlePromise.then((h) => h.remove());
        });
      })
      .catch(() => {
        if (unmounted) return;
        // Fallback for web: use visualViewport
        if (typeof window === 'undefined') return;
        const vv = window.visualViewport;
        if (!vv) return;

        const update = () => {
          const kbHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
          setKeyboardHeight(kbHeight);
        };

        vv.addEventListener('resize', update);
        vv.addEventListener('scroll', update);
        // Sync initial state in case keyboard is already visible
        update();
        cleanupFns.push(() => {
          vv.removeEventListener('resize', update);
          vv.removeEventListener('scroll', update);
        });
      });

    return () => {
      unmounted = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return keyboardHeight;
}
