/**
 * Returns true when the app is running inside a native Capacitor shell
 * (iOS / Android). Returns false in web browsers and during Next.js
 * server-side / static-export builds.
 *
 * Use this guard before dynamically importing any `@capacitor/*` plugin so
 * that the native-only imports are never attempted in the Vercel build
 * environment where the Capacitor bridge does not exist.
 */
export function isNativeCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  return (
    cap !== undefined &&
    typeof cap.isNativePlatform === 'function' &&
    cap.isNativePlatform() === true
  );
}
