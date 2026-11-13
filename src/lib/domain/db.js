import { DEFAULT_EQUIPMENT, DEFAULT_PANTRY } from '../../data/equipment.js';

export const DB_VERSION = 1;

export const DEFAULT_FILTERS = Object.freeze({
  q: '',
  maxMinutes: null,
  maxDifficulty: null,
  maxCostPerServing: null,
  maxMissing: null,
  onlyMyEquipment: false,
  favoritesOnly: false,
});

export function createEmptyDb() {
  return withDefaults({});
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const strArr = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string'))] : []);
const numOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);

function normalizeCooking(c) {
  if (!isObj(c) || typeof c.recipeId !== 'string') return null;
  const timers = {};
  if (isObj(c.timers)) {
    for (const [k, t] of Object.entries(c.timers)) {
      if (isObj(t) && Number.isFinite(t.endsAt)) timers[k] = { endsAt: t.endsAt, minutes: Number(t.minutes) || 0 };
    }
  }
  return {
    recipeId: c.recipeId,
    servings: Number.isFinite(c.servings) && c.servings > 0 ? Math.round(c.servings) : 1,
    step: Number.isInteger(c.step) && c.step >= 0 ? c.step : 0,
    startedAt: Number.isFinite(c.startedAt) ? c.startedAt : 0,
    timers,
  };
}

// Normalises anything we might read from storage into a valid state.
// Unknown/missing fields get defaults; nothing the user saved is dropped.
export function withDefaults(raw) {
  const r = isObj(raw) ? raw : {};
  const u = isObj(r.user) ? r.user : {};
  const f = isObj(u.filters) ? u.filters : {};
  const hasUser = isObj(r.user);
  return {
    version: DB_VERSION,
    seedRelease: Number.isInteger(r.seedRelease) ? r.seedRelease : 0,
    ingredients: isObj(r.ingredients) ? r.ingredients : {},
    equipment: isObj(r.equipment) ? r.equipment : {},
    recipes: isObj(r.recipes) ? r.recipes : {},
    user: {
      pantry: hasUser && Array.isArray(u.pantry) ? strArr(u.pantry) : [...DEFAULT_PANTRY],
      equipment: hasUser && Array.isArray(u.equipment) ? strArr(u.equipment) : [...DEFAULT_EQUIPMENT],
      favorites: strArr(u.favorites),
      servings: isObj(u.servings)
        ? Object.fromEntries(Object.entries(u.servings).filter(([, n]) => Number.isFinite(n) && n > 0))
        : {},
      cooking: normalizeCooking(u.cooking),
      history: Array.isArray(u.history)
        ? u.history.filter((h) => isObj(h) && typeof h.recipeId === 'string' && Number.isFinite(h.at))
        : [],
      filters: {
        q: typeof f.q === 'string' ? f.q : '',
        maxMinutes: numOrNull(f.maxMinutes),
        maxDifficulty: numOrNull(f.maxDifficulty),
        maxCostPerServing: numOrNull(f.maxCostPerServing),
        maxMissing: Number.isInteger(f.maxMissing) && f.maxMissing >= 0 ? f.maxMissing : null,
        onlyMyEquipment: f.onlyMyEquipment === true,
        favoritesOnly: f.favoritesOnly === true,
      },
    },
  };
}

// Adds seed items that are newer than db.seedRelease. Items are added by id and
// only when the id isn't already there, so user data is never overwritten.
export function applySeedReleases(db, releases) {
  let next = db;
  for (const rel of releases) {
    if (rel.release <= next.seedRelease) continue;
    const merge = (cur, add) => {
      const out = { ...cur };
      for (const [id, item] of Object.entries(add)) if (!(id in out)) out[id] = item;
      return out;
    };
    next = {
      ...next,
      ingredients: merge(next.ingredients, rel.ingredients),
      equipment: merge(next.equipment, rel.equipment),
      recipes: merge(next.recipes, rel.recipes),
      seedRelease: rel.release,
    };
  }
  return next;
}

export const ok = (db, extra = {}) => ({ ok: true, db, ...extra });
export const fail = (error) => ({ ok: false, error });
