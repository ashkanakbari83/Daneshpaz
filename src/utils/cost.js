import { scaleQuantity, roundQuantity, isEstimate } from './scaling.js';

const WORST_STATUS = ['sample', 'estimated', 'verified'];

/** Convert a recipe quantity into the ingredient's base unit (g, ml, piece), or null if unknown. */
export function toBaseQuantity(ingredient, quantity, unit) {
  if (unit === ingredient.baseUnit) return quantity;
  if (unit === 'kg' && ingredient.baseUnit === 'g') return quantity * 1000;
  if (unit === 'l' && ingredient.baseUnit === 'ml') return quantity * 1000;
  const factor = ingredient.unitFactors?.[unit];
  return factor ? quantity * factor : null;
}

/**
 * Two different costs (never conflate them):
 *  - consumedCost: the share of a package the recipe actually uses.
 *  - purchaseCost: whole packages you must buy, 0 for items already at home.
 * Using 50 g from a 200 g pack consumes ¼ of its price but buying costs all of it.
 * Optional ingredients are listed but left out of the totals.
 */
export function computeRecipeCost({ recipe, ingredientsById, servings, atHomeIds = new Set() }) {
  const lines = recipe.ingredients.map((entry) => {
    const ingredient = ingredientsById[entry.ingredientId];
    const rule = entry.scaling?.rule ?? 'linear';
    const scaled = scaleQuantity({
      quantity: entry.quantity,
      baseServings: recipe.defaultServings,
      servings,
      rule,
      exponent: entry.scaling?.exponent,
    });
    const quantity = roundQuantity(scaled, entry.unit);
    const base = toBaseQuantity(ingredient, quantity, entry.unit);
    const atHome = atHomeIds.has(entry.ingredientId);
    const pack = ingredient.package.quantity;
    const price = ingredient.price.amount;
    const unknown = base === null;

    return {
      ingredient,
      quantity,
      unit: entry.unit,
      optional: Boolean(entry.optional),
      estimate: isEstimate(rule, servings, recipe.defaultServings),
      atHome,
      unknown,
      consumedCost: unknown ? 0 : (base / pack) * price,
      purchaseCost: unknown || atHome ? 0 : Math.ceil(base / pack - 1e-9) * price,
    };
  });

  const counted = lines.filter((l) => !l.optional && !l.unknown);
  const priced = lines.filter((l) => !l.unknown);
  const dates = priced.map((l) => l.ingredient.price.recordedAt).sort();
  const statuses = priced.map((l) => l.ingredient.price.status);
  const worst = WORST_STATUS.find((s) => statuses.includes(s)) ?? 'sample';

  return {
    lines,
    consumedTotal: Math.round(counted.reduce((sum, l) => sum + l.consumedCost, 0)),
    purchaseTotal: Math.round(counted.reduce((sum, l) => sum + l.purchaseCost, 0)),
    unknownCount: lines.filter((l) => l.unknown && !l.optional).length,
    priceStatus: worst,
    pricesUpdatedAt: dates[0] ?? null,
  };
}

/** Consumed cost at the recipe's default servings, or null when any price is unknown. */
export function defaultCostOf(recipe, ingredientsById) {
  const cost = computeRecipeCost({ recipe, ingredientsById, servings: recipe.defaultServings });
  return cost.unknownCount > 0 ? null : cost.consumedTotal;
}
