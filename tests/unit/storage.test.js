import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_RELEASES } from '../../src/data/seed.js';
import { loadDb, saveDb, STORAGE_KEY } from '../../src/lib/storage.js';
import { togglePantry } from '../../src/lib/domain/pantry.js';
import { formatNumber, formatToman, formatClock } from '../../src/lib/format.js';

function memoryStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), _m: m };
}

test('first load seeds a fresh db; save then load round-trips user changes', () => {
  const st = memoryStorage();
  let db = loadDb(st, SEED_RELEASES);
  assert.ok(Object.keys(db.recipes).length > 10);
  db = togglePantry(db, 'ing-egg').db;
  assert.equal(saveDb(st, db), true);
  const again = loadDb(st, SEED_RELEASES);
  assert.ok(again.user.pantry.includes('ing-egg'));
});

test('corrupt storage falls back to a seeded db and keeps a backup', () => {
  const st = memoryStorage({ [STORAGE_KEY]: '{not json' });
  const db = loadDb(st, SEED_RELEASES);
  assert.ok(Object.keys(db.recipes).length > 10);
  assert.equal(st._m.get('daneshpaz:state:corrupt'), '{not json');
});

test('old saved state without newer seed items gets them once', () => {
  const st = memoryStorage();
  const db = loadDb(st, SEED_RELEASES);
  const old = { ...db, seedRelease: 0, recipes: { 'rcp-omelet': db.recipes['rcp-omelet'] }, user: { ...db.user, favorites: ['rcp-omelet'] } };
  saveDb(st, old);
  const loaded = loadDb(st, SEED_RELEASES);
  assert.ok(Object.keys(loaded.recipes).length > 10);
  assert.deepEqual(loaded.user.favorites, ['rcp-omelet']);
});

test('missing/blocked storage does not throw', () => {
  assert.ok(loadDb(null, SEED_RELEASES).recipes);
  assert.equal(saveDb(null, {}), true); // nothing to write to is not an error
});

test('formatting uses Persian digits and no slash fractions', () => {
  assert.equal(formatNumber(1.5), '۱٫۵');
  assert.equal(formatToman(45240), '۴۵٬۲۰۰');
  assert.equal(formatClock(65_000), '۰۱:۰۵');
  assert.equal(formatNumber(1.5, 'en'), '1.5');
});
