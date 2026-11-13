import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanSeed } from '../../src/data/seed.js';
import { setServings } from '../../src/lib/domain/recipes.js';
import { startCooking, nextStep, prevStep, goToStep, startTimer, cancelTimer, timerState, cookingProgress, finishCooking, abandonCooking } from '../../src/lib/domain/cooking.js';

const T0 = 1_700_000_000_000;

test('start cooking, navigate, bounds', () => {
  let db = cleanSeed();
  assert.equal(startCooking(db, 'nope', T0).ok, false);
  const s = startCooking(db, 'rcp-omelet', T0);
  assert.equal(s.ok, true);
  db = s.db;
  assert.equal(db.user.cooking.step, 0);
  assert.equal(db.user.cooking.servings, 2);
  assert.equal(prevStep(db).ok, false);
  db = nextStep(db).db;
  assert.equal(db.user.cooking.step, 1);
  assert.equal(goToStep(db, 99).ok, false);
  const total = db.recipes['rcp-omelet'].steps.length;
  db = goToStep(db, total - 1).db;
  assert.equal(nextStep(db).ok, false);
  assert.deepEqual(cookingProgress(db), { step: total - 1, total, percent: 100, isLast: true });
});

test('resuming the same recipe keeps progress; servings captured at start', () => {
  let db = setServings(cleanSeed(), 'rcp-omelet', 6).db;
  db = startCooking(db, 'rcp-omelet', T0).db;
  assert.equal(db.user.cooking.servings, 6);
  db = nextStep(db).db;
  const again = startCooking(db, 'rcp-omelet', T0 + 5000);
  assert.equal(again.resumed, true);
  assert.equal(again.db.user.cooking.step, 1);
});

test('timers are computed from the clock', () => {
  let db = startCooking(cleanSeed(), 'rcp-omelet', T0).db;
  assert.equal(startTimer(db, 0, T0).ok, false); // step 0 has no timer
  db = startTimer(db, 1, T0).db; // 4 minutes
  assert.deepEqual(timerState(db, 1, T0 + 1000), { status: 'running', remainingMs: 4 * 60000 - 1000 });
  assert.equal(timerState(db, 1, T0 + 4 * 60000).status, 'done');
  assert.equal(timerState(db, 2, T0).status, 'idle');
  db = cancelTimer(db, 1).db;
  assert.equal(timerState(db, 1, T0).status, 'idle');
});

test('state survives JSON round trip (restore after reload)', () => {
  let db = startCooking(cleanSeed(), 'rcp-omelet', T0).db;
  db = nextStep(db).db;
  db = startTimer(db, 1, T0).db;
  const restored = JSON.parse(JSON.stringify(db));
  assert.equal(restored.user.cooking.step, 1);
  assert.equal(timerState(restored, 1, T0 + 60000).status, 'running');
});

test('finish records history and clears session; abandon clears only', () => {
  let db = startCooking(cleanSeed(), 'rcp-omelet', T0).db;
  const fin = finishCooking(db, T0 + 1);
  assert.equal(fin.db.user.cooking, null);
  assert.deepEqual(fin.db.user.history, [{ recipeId: 'rcp-omelet', at: T0 + 1, servings: 2 }]);
  assert.equal(finishCooking(fin.db, T0).ok, false);
  const ab = abandonCooking(db);
  assert.equal(ab.db.user.cooking, null);
  assert.equal(ab.db.user.history.length, 0);
});
