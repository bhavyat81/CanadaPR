/**
 * Deterministic avatar assignment based on user ID.
 * Hashes the user ID to pick 1 of 20 professional static avatars.
 * Removes dependency on external DiceBear API and loads faster in Capacitor WebView.
 */

const AVATAR_COUNT = 20;

/**
 * Simple hash function that converts a string to a non-negative integer.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Returns the URL for a deterministic avatar based on the user's ID.
 * Avatars are stored in /public/avatars/ as static SVG files.
 */
export function getAvatarUrl(userId: string): string {
  const index = (hashString(userId) % AVATAR_COUNT) + 1;
  const paddedIndex = String(index).padStart(2, '0');
  return `/avatars/avatar-${paddedIndex}.svg`;
}
