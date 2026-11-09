import { toEnglishDigits } from './persian.js';
import { DIFFICULTY } from '../constants/labels.js';

/** Make Persian text comparable: unify Arabic/Persian letters, drop diacritics, ZWNJ -> space. */
export function normalizeText(value) {
  return toEnglishDigits(String(value ?? ''))
    .toLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(query) {
  const text = normalizeText(query);
  return text ? text.split(' ') : [];
}

/** 0 when any token is missing (AND search); higher means a better match. */
export function scoreRecipe(recipe, tokens, { ingredientsById, categoriesBySlug }) {
  if (tokens.length === 0) return 1;
  const title = normalizeText(recipe.title);
  const ingredientText = normalizeText(recipe.ingredients.map((i) => ingredientsById[i.ingredientId]?.name).join(' '));
  const categoryText = normalizeText(recipe.categorySlugs.map((s) => categoriesBySlug[s]?.title).join(' '));
  const description = normalizeText(recipe.description);

  let score = 0;
  for (const token of tokens) {
    let tokenScore = 0;
    if (title.includes(token)) tokenScore += 5;
    if (ingredientText.includes(token)) tokenScore += 3;
    if (categoryText.includes(token)) tokenScore += 2;
    if (description.includes(token)) tokenScore += 1;
    if (tokenScore === 0) return 0;
    score += tokenScore;
  }
  return score;
}

/**
 * Basics nearly every kitchen has. They are assumed available when matching
 * «با مواد موجود», so choosing eggs and tomatoes finds the omelet even though
 * it also needs salt and oil. (They still appear in ingredient lists and costs.)
 */
export const PANTRY_STAPLES = new Set(['salt', 'oil', 'pepper', 'turmeric', 'sugar']);

const requiredIngredients = (recipe) => recipe.ingredients.filter((i) => !i.optional);
const totalTime = (recipe) => recipe.prepTime + recipe.cookTime;

/**
 * Filter + sort recipes. `costOf(recipe)` returns the consumed cost at the
 * default servings (or null). Returns [{ recipe, cost, score, haveRatio, missingCount }].
 */
export function searchRecipes({ recipes, ctx, filters, costOf }) {
  const tokens = tokenize(filters.q);
  const results = [];

  for (const recipe of recipes) {
    const score = scoreRecipe(recipe, tokens, ctx);
    if (score === 0) continue;
    if (filters.cat && !recipe.categorySlugs.includes(filters.cat)) continue;
    if (filters.meal.length && !filters.meal.some((m) => recipe.meals.includes(m))) continue;
    if (filters.diff.length && !filters.diff.includes(recipe.difficulty)) continue;
    if (filters.prep && recipe.prepTime > filters.prep) continue;
    if (filters.cook && recipe.cookTime > filters.cook) continue;
    if (filters.total && totalTime(recipe) > filters.total) continue;

    const required = requiredIngredients(recipe);
    if (filters.ing && required.length > filters.ing) continue;

    if (filters.serv === 1 && recipe.defaultServings !== 1) continue;
    if (filters.serv === 2 && recipe.defaultServings !== 2) continue;
    if (filters.serv === 3 && recipe.defaultServings < 3) continue;

    if (filters.equip.length) {
      const needed = recipe.equipment.filter((e) => e.required).map((e) => e.key);
      if (!needed.every((key) => filters.equip.includes(key))) continue;
    }

    const core = required.filter((i) => !PANTRY_STAPLES.has(i.ingredientId));
    const haveCount = core.filter((i) => filters.have.includes(i.ingredientId)).length;
    const haveRatio = core.length ? haveCount / core.length : 1;
    if (filters.have.length && haveRatio < 0.5) continue;

    const cost = costOf(recipe);
    if (filters.cost && (cost === null || cost > filters.cost)) continue;

    results.push({ recipe, cost, score, haveRatio, missingCount: core.length - haveCount });
  }

  const byCost = (a, b) => (a.cost ?? Infinity) - (b.cost ?? Infinity);
  const comparators = {
    recommended: (a, b) =>
      b.haveRatio - a.haveRatio || b.score - a.score || a.recipe.featuredOrder - b.recipe.featuredOrder,
    cost: (a, b) => byCost(a, b) || a.recipe.featuredOrder - b.recipe.featuredOrder,
    fast: (a, b) => totalTime(a.recipe) - totalTime(b.recipe) || byCost(a, b),
    easy: (a, b) =>
      DIFFICULTY[a.recipe.difficulty].rank - DIFFICULTY[b.recipe.difficulty].rank ||
      totalTime(a.recipe) - totalTime(b.recipe),
  };
  return results.sort(comparators[filters.sort] ?? comparators.recommended);
}
