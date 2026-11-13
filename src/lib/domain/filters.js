import { DEFAULT_FILTERS, fail } from './db.js';
import { normalizeText } from '../text.js';
import { analyzeRecipe } from './recipes.js';

export function activeFilterCount(f) {
  let n = 0;
  if (f.maxMinutes) n++;
  if (f.maxDifficulty) n++;
  if (f.maxCostPerServing) n++;
  if (f.maxMissing !== null && f.maxMissing !== undefined) n++;
  if (f.onlyMyEquipment) n++;
  return n;
}

export function setFilters(db, patch) {
  if (!patch || typeof patch !== 'object') return fail('bad_filters');
  const next = { ...db.user.filters, ...patch };
  return { ok: true, db: { ...db, user: { ...db.user, filters: next } } };
}

export function resetFilters(db) {
  return { ok: true, db: { ...db, user: { ...db.user, filters: { ...DEFAULT_FILTERS, q: db.user.filters.q } } } };
}

function matchesQuery(db, recipe, q) {
  if (!q) return true;
  const hay = [
    recipe.title.fa,
    recipe.title.en,
    ...recipe.tags,
    ...recipe.ingredients.map((r) => db.ingredients[r.ingredientId]?.name.fa),
    ...recipe.ingredients.map((r) => db.ingredients[r.ingredientId]?.name.en),
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(' | ');
  return q.split(' ').every((word) => hay.includes(word));
}

// Returns [{recipe, analysis}] filtered + sorted: fewer missing ingredients first,
// then quicker, then by title for a stable order.
export function searchRecipes(db, filters = db.user.filters) {
  const q = normalizeText(filters.q);
  const favs = new Set(db.user.favorites);
  const results = [];
  for (const recipe of Object.values(db.recipes)) {
    if (filters.favoritesOnly && !favs.has(recipe.id)) continue;
    if (filters.maxMinutes && recipe.minutes > filters.maxMinutes) continue;
    if (filters.maxDifficulty && recipe.difficulty > filters.maxDifficulty) continue;
    if (!matchesQuery(db, recipe, q)) continue;
    const analysis = analyzeRecipe(db, recipe.id);
    if (filters.maxCostPerServing && analysis.costPerServing > filters.maxCostPerServing) continue;
    if (filters.maxMissing !== null && filters.maxMissing !== undefined && analysis.missingCount > filters.maxMissing) continue;
    if (filters.onlyMyEquipment && analysis.missingEquipment.length > 0) continue;
    results.push({ recipe, analysis });
  }
  results.sort(
    (a, b) =>
      a.analysis.missingCount - b.analysis.missingCount ||
      a.recipe.minutes - b.recipe.minutes ||
      a.recipe.title.fa.localeCompare(b.recipe.title.fa, 'fa'),
  );
  return results;
}
