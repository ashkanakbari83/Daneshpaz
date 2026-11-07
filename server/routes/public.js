import * as repo from '../repo.js';
import { errors } from '../http.js';
import { feedbackSchema } from '../schemas.js';

/** Read-only content for everyone (published items only) plus rate-limited feedback. */
export function registerPublic(add, { db, feedbackLimiter }) {
  add('GET', '/api/health', { auth: 'none' }, () => ({ body: { ok: true } }));

  add('GET', '/api/catalog', { auth: 'none' }, () => ({
    body: {
      recipes: repo.listPublishedRecipes(db),
      ingredients: repo.listIngredients(db),
      categories: repo.listCategories(db),
    },
  }));

  add('GET', '/api/recipes/:slug', { auth: 'none' }, ({ params }) => {
    const recipe = repo.getPublishedRecipe(db, params.slug);
    if (!recipe) throw errors.notFound('این دستور پیدا نشد.');
    const used = new Set(recipe.ingredients.map((i) => i.ingredientId));
    return {
      body: {
        recipe,
        ingredients: repo.listIngredients(db).filter((i) => used.has(i.id)),
        categories: repo.listCategories(db),
        helpArticles: repo.listPublishedArticles(db).filter((a) => recipe.helpSlugs.includes(a.slug)),
      },
    };
  });

  add('GET', '/api/help', { auth: 'none' }, () => ({
    body: { articles: repo.listPublishedArticles(db), categories: repo.listHelpCategories(db) },
  }));

  add('GET', '/api/help/:slug', { auth: 'none' }, ({ params }) => {
    const article = repo.getPublishedArticle(db, params.slug);
    if (!article) throw errors.notFound('این راهنما پیدا نشد.');
    const bySlug = Object.fromEntries(repo.listPublishedRecipes(db).map((r) => [r.slug, r]));
    return {
      body: {
        article,
        category: repo.listHelpCategories(db).find((c) => c.key === article.category) ?? null,
        relatedRecipes: article.relatedRecipes.map((s) => bySlug[s]).filter(Boolean),
      },
    };
  });

  add('POST', '/api/feedback', { auth: 'none' }, async (ctx) => {
    const limit = feedbackLimiter.hit(ctx.ip);
    if (!limit.allowed) throw errors.tooMany(limit.retryAfterSeconds);
    const input = await ctx.body(feedbackSchema);
    repo.addFeedback(db, input);
    return { status: 201, body: { ok: true } };
  });
}
