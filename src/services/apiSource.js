import { api, ApiError } from './api';

/** API source: same return shapes as demoSource.js, backed by the server. */
const toMap = (list, key) => Object.fromEntries(list.map((item) => [item[key], item]));

export async function getCatalog() {
  const { recipes, ingredients, categories } = await api.get('/catalog');
  return { recipes, ingredients, ingredientsById: toMap(ingredients, 'id'), categories, categoriesBySlug: toMap(categories, 'slug') };
}

export async function getRecipeBundle(slug) {
  try {
    const data = await api.get(`/recipes/${encodeURIComponent(slug)}`);
    return {
      recipe: data.recipe,
      ingredientsById: toMap(data.ingredients, 'id'),
      categoriesBySlug: toMap(data.categories, 'slug'),
      helpArticles: data.helpArticles,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { recipe: null, ingredientsById: {}, categoriesBySlug: {}, helpArticles: [] };
    throw error;
  }
}

export async function getHelpIndex() {
  return api.get('/help');
}

export async function getHelpArticle(slug) {
  try {
    return await api.get(`/help/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { article: null, category: null, relatedRecipes: [] };
    throw error;
  }
}

export async function sendFeedback({ slug, type }) {
  return api.post('/feedback', { slug, type });
}
