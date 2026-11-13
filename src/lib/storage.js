import { applySeedReleases, withDefaults, DB_VERSION } from './domain/db.js';

export const STORAGE_KEY = 'daneshpaz:state';
const BACKUP_KEY = 'daneshpaz:state:corrupt';

// Upgrade older saved shapes to the current one. Add a case per DB_VERSION bump.
export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return {};
  // v0 (no version field) had the same shape; withDefaults fills the rest.
  return raw;
}

export function loadDb(storage, releases) {
  let raw = null;
  try {
    const text = storage?.getItem(STORAGE_KEY);
    if (text) raw = JSON.parse(text);
  } catch {
    try {
      storage?.setItem(BACKUP_KEY, storage.getItem(STORAGE_KEY) || '');
    } catch { /* storage full or blocked */ }
    raw = null;
  }
  const db = withDefaults(migrate(raw));
  return applySeedReleases(db, releases);
}

export function saveDb(storage, db) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ ...db, version: DB_VERSION }));
    return true;
  } catch {
    return false; // private mode / quota: app keeps working in memory
  }
}
