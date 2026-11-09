import { toPersianDigits } from './persian.js';

/** At most this many missed releases are shown together. */
export const MAX_RELEASES_SHOWN = 3;

/** «0.6.0» -> «۰٫۶٫۰» */
export const formatVersion = (version) => toPersianDigits(version).replace(/\./g, '٫');

const isVersion = (v) => typeof v === 'string' && /^\d+\.\d+\.\d+$/.test(v);

/** Compare «1.2.3» style versions: negative if a < b. */
export function compareVersions(a, b) {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

/**
 * Which releases should pop up automatically? `releases` is newest first.
 *  - Already saw the newest one: nothing.
 *  - Saw an older known one: everything newer (at most 3).
 *  - Never saw any (or an unknown value): only the newest, and only for people who already
 *    have saved data (favorites, cooking progress...) — a brand-new visitor has seen no "old" version.
 */
export function pickReleasesToShow({ releases, lastSeen, hasExistingData }) {
  if (!releases.length) return [];
  const index = isVersion(lastSeen) ? releases.findIndex((r) => r.id === lastSeen) : -1;
  if (index === 0) return [];
  if (index > 0) return releases.slice(0, Math.min(index, MAX_RELEASES_SHOWN));
  return hasExistingData ? [releases[0]] : [];
}

/** For the manual «تازه‌ها» button: the latest few releases. */
export const recentReleases = (releases, count = MAX_RELEASES_SHOWN) => releases.slice(0, count);
