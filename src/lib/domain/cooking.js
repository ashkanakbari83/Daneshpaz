import { fail } from './db.js';
import { servingsFor } from './recipes.js';

// Cooking session lives in db.user.cooking. Timers store an absolute `endsAt`
// so remaining time is always computed from the clock (works after reload).

export function startCooking(db, recipeId, now) {
  const recipe = db.recipes[recipeId];
  if (!recipe) return fail('recipe_not_found');
  if (recipe.steps.length === 0) return fail('no_steps');
  // Resuming the same recipe keeps its progress.
  if (db.user.cooking?.recipeId === recipeId) return { ok: true, resumed: true, db };
  const cooking = { recipeId, servings: servingsFor(db, recipe), step: 0, startedAt: now, timers: {} };
  return { ok: true, resumed: false, db: { ...db, user: { ...db.user, cooking } } };
}

function withCooking(db, patch) {
  return { ...db, user: { ...db.user, cooking: { ...db.user.cooking, ...patch } } };
}

export function goToStep(db, index) {
  const c = db.user.cooking;
  if (!c) return fail('not_cooking');
  const total = db.recipes[c.recipeId]?.steps.length ?? 0;
  if (!Number.isInteger(index) || index < 0 || index >= total) return fail('step_out_of_range');
  return { ok: true, db: withCooking(db, { step: index }) };
}

export const nextStep = (db) => goToStep(db, (db.user.cooking?.step ?? 0) + 1);
export const prevStep = (db) => goToStep(db, (db.user.cooking?.step ?? 0) - 1);

export function startTimer(db, stepIndex, now) {
  const c = db.user.cooking;
  if (!c) return fail('not_cooking');
  const step = db.recipes[c.recipeId]?.steps[stepIndex];
  if (!step?.timerMin) return fail('no_timer');
  const timers = { ...c.timers, [stepIndex]: { endsAt: now + step.timerMin * 60000, minutes: step.timerMin } };
  return { ok: true, db: withCooking(db, { timers }) };
}

export function cancelTimer(db, stepIndex) {
  const c = db.user.cooking;
  if (!c) return fail('not_cooking');
  const { [stepIndex]: _removed, ...timers } = c.timers;
  return { ok: true, db: withCooking(db, { timers }) };
}

// 'idle' | 'running' | 'done' — computed from `now`, never stored.
export function timerState(db, stepIndex, now) {
  const t = db.user.cooking?.timers[stepIndex];
  if (!t) return { status: 'idle', remainingMs: 0 };
  const remainingMs = t.endsAt - now;
  return remainingMs > 0 ? { status: 'running', remainingMs } : { status: 'done', remainingMs: 0 };
}

export function cookingProgress(db) {
  const c = db.user.cooking;
  if (!c) return null;
  const total = db.recipes[c.recipeId]?.steps.length ?? 0;
  return { step: c.step, total, percent: total ? Math.round(((c.step + 1) / total) * 100) : 0, isLast: c.step >= total - 1 };
}

export function finishCooking(db, now) {
  const c = db.user.cooking;
  if (!c) return fail('not_cooking');
  const history = [...db.user.history, { recipeId: c.recipeId, at: now, servings: c.servings }];
  return { ok: true, db: { ...db, user: { ...db.user, cooking: null, history } } };
}

export function abandonCooking(db) {
  if (!db.user.cooking) return fail('not_cooking');
  return { ok: true, db: { ...db, user: { ...db.user, cooking: null } } };
}
