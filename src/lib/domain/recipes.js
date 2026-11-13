import { fail } from './db.js';
import { packsNeeded, roundAmount, scaleAmount } from './quantity.js';

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 12;

export function getRecipe(db, id) {
  return db.recipes[id] || null;
}

export function servingsFor(db, recipe) {
  const saved = db.user.servings[recipe.id];
  return Number.isFinite(saved) ? saved : recipe.servings;
}

// Everything the recipe page and cards need, computed from state.
// Costs: usedCost = value of the amounts consumed; buyCost = full packs of what
// the user doesn't have; leftoverValue = what stays in the kitchen after cooking.
export function analyzeRecipe(db, recipeId, servingsOverride = null) {
  const recipe = db.recipes[recipeId];
  if (!recipe) return null;
  const servings = servingsOverride ?? servingsFor(db, recipe);
  const pantry = new Set(db.user.pantry);

  const lines = [];
  for (const row of recipe.ingredients) {
    const ing = db.ingredients[row.ingredientId];
    if (!ing) continue;
    const amount = roundAmount(scaleAmount(row.amount, recipe.servings, servings), ing.unit);
    const have = pantry.has(ing.id);
    const usedCost = (amount / ing.pack.size) * ing.pack.price;
    const packs = have ? 0 : packsNeeded(amount, ing.pack.size);
    lines.push({ ingredient: ing, amount, have, usedCost, packs, buyCost: packs * ing.pack.price });
  }

  const haveLines = lines.filter((l) => l.have);
  const needLines = lines.filter((l) => !l.have);
  const usedCost = lines.reduce((s, l) => s + l.usedCost, 0);
  const buyCost = needLines.reduce((s, l) => s + l.buyCost, 0);
  const usedOfMissing = needLines.reduce((s, l) => s + l.usedCost, 0);

  const owned = new Set(db.user.equipment);
  const equipment = recipe.equipment
    .map((id) => db.equipment[id])
    .filter(Boolean)
    .map((eq) => ({ equipment: eq, owned: owned.has(eq.id) }));

  return {
    recipe,
    servings,
    lines,
    haveLines,
    needLines,
    usedCost,
    buyCost,
    leftoverValue: Math.max(0, buyCost - usedOfMissing),
    costPerServing: usedCost / servings,
    missingCount: needLines.length,
    equipment,
    missingEquipment: equipment.filter((e) => !e.owned),
  };
}

export function setServings(db, recipeId, servings) {
  if (!db.recipes[recipeId]) return fail('recipe_not_found');
  const n = Math.round(servings);
  if (!Number.isFinite(n) || n < MIN_SERVINGS || n > MAX_SERVINGS) return fail('servings_out_of_range');
  return { ok: true, db: { ...db, user: { ...db.user, servings: { ...db.user.servings, [recipeId]: n } } } };
}
