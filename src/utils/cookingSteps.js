import { scaleQuantity, roundQuantity } from './scaling.js';
import { formatIngredientAmount } from './units.js';

/**
 * Ingredients for one step with amounts scaled to `servings`:
 * [{ ingredientId, name, amount, optional }]. `portion` splits an ingredient
 * that is used in more than one step (e.g. half the oil now, half later).
 */
export function stepIngredientAmounts({ recipe, ingredientsById, step, servings }) {
  return step.ingredients.flatMap(({ ingredientId, portion = 1 }) => {
    const entry = recipe.ingredients.find((i) => i.ingredientId === ingredientId);
    const ingredient = ingredientsById[ingredientId];
    if (!entry || !ingredient) return [];
    const scaled = scaleQuantity({
      quantity: entry.quantity * portion,
      baseServings: recipe.defaultServings,
      servings,
      rule: entry.scaling?.rule ?? 'linear',
      exponent: entry.scaling?.exponent,
    });
    return [{
      ingredientId,
      name: ingredient.name,
      amount: formatIngredientAmount(roundQuantity(scaled, entry.unit), entry.unit),
      optional: Boolean(entry.optional),
    }];
  });
}
