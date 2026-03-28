const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Fetches a URL, falling back to a CORS proxy if the direct request fails.
 * This is needed for iOS Capacitor apps where the WebView origin may be blocked
 * by remote servers that don't send permissive CORS headers.
 */
export async function fetchWithFallback(url: string, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, { ...init, mode: 'cors' });
    if (res.ok) return res;
    throw new Error('Direct fetch failed');
  } catch {
    return fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, init);
  }
}
