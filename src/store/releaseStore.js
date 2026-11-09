/**
 * Remembers which release this browser last saw. Stored as a plain version string.
 * Every access is wrapped: storage can be blocked, and the value can be junk.
 */
const KEY = 'daneshpaz:last-seen-release';
export const OPEN_WHATS_NEW_EVENT = 'daneshpaz:open-whats-new';

export function getLastSeenRelease() {
  try {
    const value = window.localStorage.getItem(KEY);
    return typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

export function markReleaseSeen(id) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* storage unavailable: the popup may show again next visit, nothing else breaks */
  }
}

/** True if this browser already holds any Daneshpaz data (favorites, pantry, cooking progress...). */
export function hasExistingUserData() {
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('daneshpaz:') && key !== KEY) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
