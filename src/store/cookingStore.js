import { createLocalStore } from './localStore';

const stores = new Map();

/** One persisted cooking session per recipe: `daneshpaz:cooking:<slug>`. */
export function getCookingStore(slug) {
  if (!stores.has(slug)) stores.set(slug, createLocalStore(`daneshpaz:cooking:${slug}`, null));
  return stores.get(slug);
}
