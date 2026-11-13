// The only place that knows where data lives. Today: this device (localStorage).
// A future server implementation can replace these functions; see docs/server-boundary.md.
import { SEED_RELEASES } from '../data/seed.js';
import { loadDb, saveDb } from './storage.js';

function safeStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export const gateway = {
  load: () => loadDb(safeStorage(), SEED_RELEASES),
  save: (db) => saveDb(safeStorage(), db),
  now: () => Date.now(),
};
