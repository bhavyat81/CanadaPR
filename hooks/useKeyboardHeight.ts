'use client';

import { useState, useEffect } from 'react';
import { isNativeCapacitor } from '@/lib/capacitor';

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

    // Only load the Capacitor Keyboard plugin when running inside a native
    // Capacitor shell (iOS/Android). On web / Vercel static builds the native
    // bridge does not exist and the dynamic import may fail at bundle time.
    if (isNativeCapacitor()) {
      // Use Capacitor Keyboard plugin on native iOS/Android
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
          if (!unmounted) setupVisualViewportFallback();
        });
    } else {
      // Web / PWA: fall back to visualViewport API
      setupVisualViewportFallback();
    }

    function setupVisualViewportFallback() {
      if (unmounted) return;
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
    }

    return () => {
      unmounted = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return keyboardHeight;
}
