'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isNativeCapacitor } from '@/lib/capacitor';

const SWIPE_EDGE_THRESHOLD = 30; // px from left edge where swipe must start
const SWIPE_MIN_DISTANCE = 100;  // minimum horizontal distance to trigger
const SWIPE_MAX_VERTICAL = 100;  // maximum allowed vertical movement

export default function SwipeBackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Hide the Capacitor splash screen once the web app has mounted.
  // Only attempt this on native Capacitor platforms — on web the native bridge
  // is absent and the dynamic import may fail during Next.js static builds.
  useEffect(() => {
    if (!isNativeCapacitor()) return;

    // Primary: hide splash once the component mounts
    import('@capacitor/splash-screen')
      .then(({ SplashScreen }) => SplashScreen.hide())
      .catch((err) => console.error('Failed to hide splash screen:', err));

    // Fallback: force-hide after 5s in case the above fails
    const fallback = setTimeout(() => {
      import('@capacitor/splash-screen')
        .then(({ SplashScreen }) => SplashScreen.hide())
        .catch((err) => console.error('Fallback splash hide failed:', err));
    }, 5000);

    return () => clearTimeout(fallback);
  }, []);

  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = Math.abs(touchEndY - touchStartY);

      if (
        touchStartX <= SWIPE_EDGE_THRESHOLD &&
        deltaX >= SWIPE_MIN_DISTANCE &&
        deltaY < SWIPE_MAX_VERTICAL
      ) {
        router.back();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router]);

  return <>{children}</>;
}
