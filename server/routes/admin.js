import * as repo from '../repo.js';
import { errors } from '../http.js';
import {
  recipeSchema, statusSchema, categorySchema, ingredientCreateSchema, ingredientUpdateSchema, priceSchema,
  helpSchema, feedbackHandledSchema,
} from '../schemas.js';
import { RECIPE_STATUSES } from '../domain.js';

/**
 * Admin API. Every route needs a valid session (`auth: 'user'`: admin or editor)
 * or the admin role (`auth: 'admin'`, used for all deletions). The check runs on
 * the server for every request; hiding buttons in the UI is not security.
 */
export function registerAdmin(add, { db }) {
  const numericId = (value) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) throw errors.notFound();
    return n;
  };

  add('GET', '/api/admin/summary', { auth: 'user' }, () => ({ body: repo.getSummary(db) }));

  // ----- recipes -----
  add('GET', '/api/admin/recipes', { auth: 'user' }, ({ query }) => {
    const status = query.get('status');
    if (status && !RECIPE_STATUSES.includes(status)) throw errors.badRequest('وضعیت نامعتبر است.');
    const q = (query.get('q') ?? '').slice(0, 100);
    return { body: { recipes: repo.listRecipesAdmin(db, { status: status || undefined, q: q || undefined }) } };
  });
  add('GET', '/api/admin/recipes/:id', { auth: 'user' }, ({ params }) => {
    const recipe = repo.getRecipeAdmin(db, params.id);
    if (!recipe) throw errors.notFound('دستور پیدا نشد.');
    return { body: { recipe } };
  });
  add('POST', '/api/admin/recipes', { auth: 'user', csrf: true }, async (ctx) => {
    const id = repo.saveRecipe(db, await ctx.body(recipeSchema));
    return { status: 201, body: { recipe: repo.getRecipeAdmin(db, id) } };
  });
  add('PUT', '/api/admin/recipes/:id', { auth: 'user', csrf: true }, async (ctx) => {
    const id = repo.saveRecipe(db, await ctx.body(recipeSchema), { id: ctx.params.id });
    return { body: { recipe: repo.getRecipeAdmin(db, id) } };
  });
  add('PATCH', '/api/admin/recipes/:id/status', { auth: 'user', csrf: true }, async (ctx) => {
    const { status } = await ctx.body(statusSchema);
    return { body: { recipe: repo.setRecipeStatus(db, ctx.params.id, status) } };
  });
  add('DELETE', '/api/admin/recipes/:id', { auth: 'admin', csrf: true }, ({ params }) => {
    repo.deleteRecipe(db, params.id);
    return { body: { ok: true } };
  });

  // ----- categories -----
  add('GET', '/api/admin/categories', { auth: 'user' }, () => ({ body: { categories: repo.listCategories(db) } }));
  add('POST', '/api/admin/categories', { auth: 'user', csrf: true }, async (ctx) => ({
    status: 201,
    body: { category: repo.createCategory(db, await ctx.body(categorySchema)) },
  }));
  add('PUT', '/api/admin/categories/:id', { auth: 'user', csrf: true }, async (ctx) => ({
    body: { category: repo.updateCategory(db, ctx.params.id, await ctx.body(categorySchema)) },
  }));
  add('DELETE', '/api/admin/categories/:id', { auth: 'admin', csrf: true }, ({ params }) => {
    repo.deleteCategory(db, params.id);
    return { body: { ok: true } };
  });

  // ----- ingredients and prices -----
  add('GET', '/api/admin/ingredients', { auth: 'user' }, () => ({ body: { ingredients: repo.listIngredients(db) } }));
  add('POST', '/api/admin/ingredients', { auth: 'user', csrf: true }, async (ctx) => ({
    status: 201,
    body: { ingredient: repo.createIngredient(db, await ctx.body(ingredientCreateSchema)) },
  }));
  add('PUT', '/api/admin/ingredients/:id', { auth: 'user', csrf: true }, async (ctx) => ({
    body: { ingredient: repo.updateIngredient(db, ctx.params.id, await ctx.body(ingredientUpdateSchema)) },
  }));
  add('DELETE', '/api/admin/ingredients/:id', { auth: 'admin', csrf: true }, ({ params }) => {
    repo.deleteIngredient(db, params.id);
    return { body: { ok: true } };
  });
  add('GET', '/api/admin/ingredients/:id/prices', { auth: 'user' }, ({ params }) => ({ body: { prices: repo.listPrices(db, params.id) } }));
  add('POST', '/api/admin/ingredients/:id/prices', { auth: 'user', csrf: true }, async (ctx) => ({
    status: 201,
    body: { ingredient: repo.addPrice(db, ctx.params.id, await ctx.body(priceSchema)) },
  }));

  // ----- help articles -----
  add('GET', '/api/admin/help', { auth: 'user' }, () => ({
    body: { articles: repo.listArticlesAdmin(db), categories: repo.listHelpCategories(db) },
  }));
  add('POST', '/api/admin/help', { auth: 'user', csrf: true }, async (ctx) => {
    const id = repo.saveArticle(db, await ctx.body(helpSchema));
    return { status: 201, body: { article: repo.getArticleAdmin(db, id) } };
  });
  add('PUT', '/api/admin/help/:id', { auth: 'user', csrf: true }, async (ctx) => {
    const id = numericId(ctx.params.id);
    repo.saveArticle(db, await ctx.body(helpSchema), { id });
    return { body: { article: repo.getArticleAdmin(db, id) } };
  });
  add('DELETE', '/api/admin/help/:id', { auth: 'admin', csrf: true }, ({ params }) => {
    repo.deleteArticle(db, numericId(params.id));
    return { body: { ok: true } };
  });

  // ----- feedback -----
  add('GET', '/api/admin/feedback', { auth: 'user' }, ({ query }) => {
    const handled = query.get('handled');
    return { body: { feedback: repo.listFeedback(db, { handled: handled === null ? undefined : handled === 'true' }) } };
  });
  add('PATCH', '/api/admin/feedback/:id', { auth: 'user', csrf: true }, async (ctx) => {
    const { handled } = await ctx.body(feedbackHandledSchema);
    repo.setFeedbackHandled(db, numericId(ctx.params.id), handled);
    return { body: { ok: true } };
  });
}
