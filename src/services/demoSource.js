import { CATEGORIES } from '@/data/categories';
import { INGREDIENTS } from '@/data/ingredients';
import { RECIPES } from '@/data/recipes';
import { STEPS_BY_SLUG } from '@/data/steps';
import { HELP_ARTICLES, HELP_CATEGORIES } from '@/data/help';

/**
 * Demo source: bundled sample data, no server needed. The API source mirrors this
 * file's shapes exactly. Components never import /data directly.
 */
const ingredientsById = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
const categoriesBySlug = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

export async function getCatalog() {
  return { recipes: RECIPES, ingredients: INGREDIENTS, ingredientsById, categories: CATEGORIES, categoriesBySlug };
}

export async function getRecipeBundle(slug) {
  const found = RECIPES.find((r) => r.slug === slug);
  const recipe = found ? { ...found, steps: STEPS_BY_SLUG[found.slug] ?? [] } : null;
  return {
    recipe,
    ingredientsById,
    categoriesBySlug,
    helpArticles: recipe ? HELP_ARTICLES.filter((a) => recipe.helpSlugs.includes(a.slug)) : [],
  };
}

export async function getHelpIndex() {
  return { articles: HELP_ARTICLES, categories: HELP_CATEGORIES };
}

export async function getHelpArticle(slug) {
  const article = HELP_ARTICLES.find((a) => a.slug === slug) ?? null;
  const category = article ? HELP_CATEGORIES.find((c) => c.key === article.category) : null;
  const relatedRecipes = article ? RECIPES.filter((r) => article.relatedRecipes.includes(r.slug)) : [];
  return { article, category, relatedRecipes };
}

/** Demo mode keeps feedback only in the browser (see FeedbackBar). */
export async function sendFeedback() {
  return { ok: true };
}
