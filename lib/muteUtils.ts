/** Utilities for muting/unmuting chat groups per user (stored in localStorage) */

function storageKey(userId: string): string {
  return `muted_groups_${userId}`;
}

export function getMutedGroups(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isMuted(userId: string, groupKey: string): boolean {
  return getMutedGroups(userId).includes(groupKey);
}

export function toggleMute(userId: string, groupKey: string): boolean {
  const muted = getMutedGroups(userId);
  let next: string[];
  let nowMuted: boolean;
  if (muted.includes(groupKey)) {
    next = muted.filter((k) => k !== groupKey);
    nowMuted = false;
  } else {
    next = [...muted, groupKey];
    nowMuted = true;
  }
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // storage not available
  }
  return nowMuted;
}
