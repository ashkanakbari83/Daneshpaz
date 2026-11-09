import { createLocalStore } from './localStore';

const stores = new Map();

/** One persisted cooking session per recipe: `daneshpaz:cooking:<slug>`. */
export function getCookingStore(slug) {
  if (!stores.has(slug)) stores.set(slug, createLocalStore(`daneshpaz:cooking:${slug}`, null, (v) => v === null || (typeof v === 'object' && !Array.isArray(v))));
  return stores.get(slug);
}

import { summarizeSession } from '@/utils/cookingSession';

const PREFIX = 'daneshpaz:cooking:';

/** Recipes the user is in the middle of cooking, most recent first: [{ slug, stepIndex, completed, updatedAt }]. */
export function listCookingProgress(now = Date.now()) {
  const found = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      let summary = null;
      try {
        summary = summarizeSession(JSON.parse(window.localStorage.getItem(key)), now);
      } catch {
        summary = null; // corrupt entry: ignore it, never throw
      }
      if (summary && key === PREFIX + summary.slug) found.push(summary);
    }
  } catch {
    /* storage blocked */
  }
  return found.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Forget saved cooking progress for one recipe. */
export function clearCookingSession(slug) {
  getCookingStore(slug).set(null);
}
