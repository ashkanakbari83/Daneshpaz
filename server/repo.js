import { randomBytes } from 'node:crypto';
import { transaction } from './db.js';
import { errors } from './http.js';

/**
 * Data access. Everything that touches SQL lives here, so moving to PostgreSQL
 * later means rewriting this file (and db.js), not the routes or the frontend.
 */
const parse = (text) => JSON.parse(text);
const placeholders = (n) => Array(n).fill('?').join(',');
const newId = (prefix) => `${prefix}_${randomBytes(5).toString('hex')}`;
const nowIso = () => new Date().toISOString();
function group(rows, key) {
  const map = {};
  for (const row of rows) (map[row[key]] ??= []).push(row);
  return map;
}
const invalid = (path, message) => errors.invalid([{ path, message }]);

// ---------- categories ----------
const serializeCategory = (r) => ({ id: r.id, slug: r.slug, title: r.title });
export const listCategories = (db) =>
  db.prepare('SELECT * FROM categories ORDER BY sort_order, id').all().map(serializeCategory);

export function createCategory(db, input) {
  const id = newId('c');
  db.prepare('INSERT INTO categories (id, slug, title, sort_order) VALUES (?, ?, ?, ?)').run(id, input.slug, input.title, input.sortOrder);
  return serializeCategory(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
}
export function updateCategory(db, id, input) {
  const { changes } = db.prepare('UPDATE categories SET slug = ?, title = ?, sort_order = ? WHERE id = ?').run(input.slug, input.title, input.sortOrder, id);
  if (!changes) throw errors.notFound('دسته‌بندی پیدا نشد.');
  return serializeCategory(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
}
export function deleteCategory(db, id) {
  if (!db.prepare('DELETE FROM categories WHERE id = ?').run(id).changes) throw errors.notFound('دسته‌بندی پیدا نشد.');
}

// ---------- ingredients and prices ----------
function serializeIngredient(r) {
  const out = {
    id: r.id,
    name: r.name,
    baseUnit: r.base_unit,
    unitFactors: parse(r.unit_factors),
    package: { quantity: r.package_quantity, unit: r.package_unit },
    price:
      r.price_amount === null
        ? null
        : { amount: r.price_amount, recordedAt: r.price_recorded_at, source: r.price_source, status: r.price_status, confidence: r.price_confidence },
  };
  if (r.price_region) out.price.region = r.price_region;
  if (r.description) out.description = r.description;
  return out;
}
const INGREDIENT_SELECT = `
  SELECT i.*, p.amount AS price_amount, p.recorded_at AS price_recorded_at, p.source AS price_source,
         p.status AS price_status, p.confidence AS price_confidence, p.region AS price_region
  FROM ingredients i
  LEFT JOIN ingredient_prices p ON p.id = (
    SELECT id FROM ingredient_prices WHERE ingredient_id = i.id ORDER BY recorded_at DESC, id DESC LIMIT 1)`;

export const listIngredients = (db) => db.prepare(`${INGREDIENT_SELECT} ORDER BY i.id`).all().map(serializeIngredient);
export const getIngredient = (db, id) => {
  const row = db.prepare(`${INGREDIENT_SELECT} WHERE i.id = ?`).get(id);
  return row ? serializeIngredient(row) : null;
};

function addPriceRow(db, ingredientId, p) {
  db.prepare(
    'INSERT INTO ingredient_prices (ingredient_id, amount, recorded_at, source, status, confidence, region) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(ingredientId, p.amount, p.recordedAt, p.source, p.status, p.confidence, p.region ?? null);
}

function checkPackage(input) {
  if (input.package.unit !== input.baseUnit) throw invalid('package.unit', 'واحد بسته باید با واحد پایه یکی باشد.');
}

export function createIngredient(db, input) {
  checkPackage(input);
  transaction(db, () => {
    db.prepare(
      'INSERT INTO ingredients (id, name, base_unit, unit_factors, package_quantity, package_unit, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(input.id, input.name, input.baseUnit, JSON.stringify(input.unitFactors), input.package.quantity, input.package.unit, input.description ?? null);
    addPriceRow(db, input.id, input.price);
  });
  return getIngredient(db, input.id);
}
export function updateIngredient(db, id, input) {
  checkPackage(input);
  const { changes } = db.prepare(
    'UPDATE ingredients SET name = ?, base_unit = ?, unit_factors = ?, package_quantity = ?, package_unit = ?, description = ? WHERE id = ?',
  ).run(input.name, input.baseUnit, JSON.stringify(input.unitFactors), input.package.quantity, input.package.unit, input.description ?? null, id);
  if (!changes) throw errors.notFound('ماده‌ی اولیه پیدا نشد.');
  return getIngredient(db, id);
}
export function deleteIngredient(db, id) {
  if (!db.prepare('DELETE FROM ingredients WHERE id = ?').run(id).changes) throw errors.notFound('ماده‌ی اولیه پیدا نشد.');
}
export function addPrice(db, ingredientId, price) {
  if (!getIngredient(db, ingredientId)) throw errors.notFound('ماده‌ی اولیه پیدا نشد.');
  addPriceRow(db, ingredientId, price);
  return getIngredient(db, ingredientId);
}
export const listPrices = (db, ingredientId) =>
  db
    .prepare('SELECT amount, recorded_at, source, status, confidence, region FROM ingredient_prices WHERE ingredient_id = ? ORDER BY recorded_at DESC, id DESC')
    .all(ingredientId)
    .map((r) => ({ amount: r.amount, recordedAt: r.recorded_at, source: r.source, status: r.status, confidence: r.confidence, region: r.region }));

// ---------- recipes ----------
function loadRecipes(db, { where = '1=1', params = [], withSteps = false, admin = false } = {}) {
  const rows = db.prepare(`SELECT * FROM recipes WHERE ${where} ORDER BY featured_order, id`).all(...params);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const ph = placeholders(ids.length);
  const cats = group(db.prepare(`SELECT rc.recipe_id, c.slug FROM recipe_categories rc JOIN categories c ON c.id = rc.category_id WHERE rc.recipe_id IN (${ph}) ORDER BY rc.position, c.id`).all(...ids), 'recipe_id');
  const ings = group(db.prepare(`SELECT * FROM recipe_ingredients WHERE recipe_id IN (${ph}) ORDER BY position`).all(...ids), 'recipe_id');
  const equipment = group(db.prepare(`SELECT * FROM recipe_equipment WHERE recipe_id IN (${ph}) ORDER BY position`).all(...ids), 'recipe_id');
  const help = group(
    db.prepare(`SELECT rh.recipe_id, a.slug FROM recipe_help rh JOIN help_articles a ON a.id = rh.article_id WHERE rh.recipe_id IN (${ph}) ${admin ? '' : "AND a.status = 'published'"} ORDER BY rh.position`).all(...ids),
    'recipe_id',
  );
  const steps = withSteps ? group(db.prepare(`SELECT * FROM cooking_steps WHERE recipe_id IN (${ph}) ORDER BY position`).all(...ids), 'recipe_id') : {};

  return rows.map((r) => {
    const recipe = {
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      categorySlugs: (cats[r.id] ?? []).map((c) => c.slug),
      meals: parse(r.meals),
      difficulty: r.difficulty,
      prepTime: r.prep_time,
      cookTime: r.cook_time,
      defaultServings: r.default_servings,
      featuredOrder: r.featured_order,
      ingredients: (ings[r.id] ?? []).map((i) => ({
        ingredientId: i.ingredient_id,
        quantity: i.quantity,
        unit: i.unit,
        scaling: i.scaling_rule === 'nonlinear' && i.scaling_exponent !== null ? { rule: 'nonlinear', exponent: i.scaling_exponent } : { rule: i.scaling_rule },
        optional: i.optional === 1,
      })),
      equipment: (equipment[r.id] ?? []).map((e) => ({ key: e.equipment_key, required: e.required === 1 })),
      beforeYouStart: parse(r.before_you_start),
      helpSlugs: (help[r.id] ?? []).map((h) => h.slug),
    };
    if (withSteps) {
      recipe.steps = (steps[r.id] ?? []).map((s) => ({
        id: s.step_key,
        title: s.title,
        description: s.description,
        heat: s.heat,
        duration: s.duration,
        ingredients: parse(s.ingredients),
        tips: parse(s.tips),
        warnings: parse(s.warnings),
        doneCues: parse(s.done_cues),
      }));
    }
    if (admin) Object.assign(recipe, { status: r.status, createdAt: r.created_at, updatedAt: r.updated_at });
    return recipe;
  });
}

export const listPublishedRecipes = (db) => loadRecipes(db, { where: "status = 'published'" });
export const getPublishedRecipe = (db, slug) => loadRecipes(db, { where: "status = 'published' AND slug = ?", params: [slug], withSteps: true })[0] ?? null;
export const getRecipeAdmin = (db, id) => loadRecipes(db, { where: 'id = ?', params: [id], withSteps: true, admin: true })[0] ?? null;

export function listRecipesAdmin(db, { status, q } = {}) {
  const where = [];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (q) { where.push("title LIKE ? ESCAPE '\\'"); params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`); }
  return db
    .prepare(`SELECT id, slug, title, status, difficulty, featured_order, updated_at FROM recipes ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY updated_at DESC, id LIMIT 200`)
    .all(...params)
    .map((r) => ({ id: r.id, slug: r.slug, title: r.title, status: r.status, difficulty: r.difficulty, featuredOrder: r.featured_order, updatedAt: r.updated_at }));
}

/** A recipe can only be published when it is complete enough to cook from. */
export function assertPublishable(recipe) {
  const problems = [];
  if (recipe.ingredients.length === 0) problems.push({ path: 'ingredients', message: 'برای انتشار حداقل یک ماده لازم است.' });
  recipe.steps.forEach((s, i) => {
    if (s.doneCues.length === 0) problems.push({ path: `steps[${i}].doneCues`, message: 'هر مرحله برای انتشار باید نشانه‌ی آماده شدن داشته باشد.' });
  });
  if (problems.length) throw errors.invalid(problems);
}

function crossCheck(db, input) {
  const problems = [];
  const known = (table, column, values) => {
    if (values.length === 0) return new Set();
    return new Set(db.prepare(`SELECT ${column} AS v FROM ${table} WHERE ${column} IN (${placeholders(values.length)})`).all(...values).map((r) => r.v));
  };
  const cats = known('categories', 'slug', input.categorySlugs);
  input.categorySlugs.forEach((s, i) => { if (!cats.has(s)) problems.push({ path: `categorySlugs[${i}]`, message: 'دسته‌بندی‌ای با این نام وجود ندارد.' }); });
  const ingIds = input.ingredients.map((i) => i.ingredientId);
  const ings = known('ingredients', 'id', ingIds);
  ingIds.forEach((id, i) => { if (!ings.has(id)) problems.push({ path: `ingredients[${i}].ingredientId`, message: 'ماده‌ای با این شناسه وجود ندارد.' }); });
  if (new Set(ingIds).size !== ingIds.length) problems.push({ path: 'ingredients', message: 'یک ماده نباید دو بار در دستور بیاید.' });
  const help = known('help_articles', 'slug', input.helpSlugs);
  input.helpSlugs.forEach((s, i) => { if (!help.has(s)) problems.push({ path: `helpSlugs[${i}]`, message: 'راهنمایی با این نام وجود ندارد.' }); });
  const stepIds = input.steps.map((s) => s.id);
  if (new Set(stepIds).size !== stepIds.length) problems.push({ path: 'steps', message: 'شناسه‌ی مرحله‌ها باید یکتا باشد.' });
  const own = new Set(ingIds);
  input.steps.forEach((s, i) => s.ingredients.forEach((x, j) => {
    if (!own.has(x.ingredientId)) problems.push({ path: `steps[${i}].ingredients[${j}].ingredientId`, message: 'این ماده در فهرست مواد دستور نیست.' });
  }));
  if (problems.length) throw errors.invalid(problems);
}

function writeChildren(db, id, input) {
  for (const table of ['recipe_categories', 'recipe_ingredients', 'recipe_equipment', 'cooking_steps', 'recipe_help']) {
    db.prepare(`DELETE FROM ${table} WHERE recipe_id = ?`).run(id);
  }
  const catId = db.prepare('SELECT id FROM categories WHERE slug = ?');
  input.categorySlugs.forEach((s, position) => {
    db.prepare('INSERT INTO recipe_categories (recipe_id, category_id, position) VALUES (?, ?, ?)').run(id, catId.get(s).id, position);
  });
  input.ingredients.forEach((i, position) => {
    db.prepare(
      'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, position, quantity, unit, scaling_rule, scaling_exponent, optional) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, i.ingredientId, position, i.quantity, i.unit, i.scaling.rule, i.scaling.rule === 'nonlinear' ? (i.scaling.exponent ?? 0.8) : null, i.optional ? 1 : 0);
  });
  input.equipment.forEach((e, position) => {
    db.prepare('INSERT INTO recipe_equipment (recipe_id, equipment_key, required, position) VALUES (?, ?, ?, ?)').run(id, e.key, e.required ? 1 : 0, position);
  });
  input.steps.forEach((s, position) => {
    db.prepare(
      'INSERT INTO cooking_steps (recipe_id, position, step_key, title, description, heat, duration, ingredients, tips, warnings, done_cues) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, position, s.id, s.title, s.description, s.heat, s.duration, JSON.stringify(s.ingredients), JSON.stringify(s.tips), JSON.stringify(s.warnings), JSON.stringify(s.doneCues));
  });
  const helpId = db.prepare('SELECT id FROM help_articles WHERE slug = ?');
  input.helpSlugs.forEach((s, position) => {
    db.prepare('INSERT INTO recipe_help (recipe_id, article_id, position) VALUES (?, ?, ?)').run(id, helpId.get(s).id, position);
  });
}

/** Create (id omitted) or fully replace a recipe and its children in one transaction. */
export function saveRecipe(db, input, { id = null, newRecipeId } = {}) {
  crossCheck(db, input);
  if (input.status === 'published') assertPublishable(input);
  return transaction(db, () => {
    let recipeId = id;
    if (id) {
      const { changes } = db.prepare(
        `UPDATE recipes SET slug = ?, title = ?, description = ?, difficulty = ?, prep_time = ?, cook_time = ?, default_servings = ?,
         featured_order = ?, status = ?, meals = ?, before_you_start = ?, updated_at = ? WHERE id = ?`,
      ).run(input.slug, input.title, input.description, input.difficulty, input.prepTime, input.cookTime, input.defaultServings, input.featuredOrder, input.status, JSON.stringify(input.meals), JSON.stringify(input.beforeYouStart), nowIso(), id);
      if (!changes) throw errors.notFound('دستور پیدا نشد.');
    } else {
      recipeId = newRecipeId ?? newId('r');
      db.prepare(
        `INSERT INTO recipes (id, slug, title, description, difficulty, prep_time, cook_time, default_servings, featured_order, status, meals, before_you_start)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(recipeId, input.slug, input.title, input.description, input.difficulty, input.prepTime, input.cookTime, input.defaultServings, input.featuredOrder, input.status, JSON.stringify(input.meals), JSON.stringify(input.beforeYouStart));
    }
    writeChildren(db, recipeId, input);
    return recipeId;
  });
}

export function setRecipeStatus(db, id, status) {
  const recipe = getRecipeAdmin(db, id);
  if (!recipe) throw errors.notFound('دستور پیدا نشد.');
  if (status === 'published') assertPublishable(recipe);
  db.prepare('UPDATE recipes SET status = ?, updated_at = ? WHERE id = ?').run(status, nowIso(), id);
  return getRecipeAdmin(db, id);
}
export function deleteRecipe(db, id) {
  if (!db.prepare('DELETE FROM recipes WHERE id = ?').run(id).changes) throw errors.notFound('دستور پیدا نشد.');
}

// ---------- help ----------
export const listHelpCategories = (db) => db.prepare('SELECT key, title FROM help_categories ORDER BY sort_order, key').all().map((c) => ({ key: c.key, title: c.title }));

function loadArticles(db, { where = '1=1', params = [], admin = false } = {}) {
  const rows = db.prepare(`SELECT * FROM help_articles WHERE ${where} ORDER BY sort_order, id`).all(...params);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const related = group(
    db.prepare(`SELECT har.article_id, r.slug FROM help_article_recipes har JOIN recipes r ON r.id = har.recipe_id WHERE har.article_id IN (${placeholders(ids.length)}) ${admin ? '' : "AND r.status = 'published'"} ORDER BY har.position`).all(...ids),
    'article_id',
  );
  return rows.map((r) => {
    const article = {
      slug: r.slug,
      category: r.category_key,
      title: r.title,
      summary: r.summary,
      causes: parse(r.causes),
      steps: parse(r.steps),
      safety: parse(r.safety),
      relatedRecipes: (related[r.id] ?? []).map((x) => x.slug),
      references: parse(r.refs),
      reviewed: r.reviewed === 1,
    };
    if (admin) Object.assign(article, { id: r.id, status: r.status, sortOrder: r.sort_order, updatedAt: r.updated_at });
    return article;
  });
}
export const listPublishedArticles = (db) => loadArticles(db, { where: "status = 'published'" });
export const getPublishedArticle = (db, slug) => loadArticles(db, { where: "status = 'published' AND slug = ?", params: [slug] })[0] ?? null;
export const listArticlesAdmin = (db) => loadArticles(db, { admin: true });
export const getArticleAdmin = (db, id) => loadArticles(db, { where: 'id = ?', params: [id], admin: true })[0] ?? null;

function writeArticle(db, articleId, input) {
  db.prepare('DELETE FROM help_article_recipes WHERE article_id = ?').run(articleId);
  const recipeId = db.prepare('SELECT id FROM recipes WHERE slug = ?');
  input.relatedRecipes.forEach((slug, position) => {
    const row = recipeId.get(slug);
    if (!row) throw invalid(`relatedRecipes[${position}]`, 'دستوری با این نام وجود ندارد.');
    db.prepare('INSERT INTO help_article_recipes (article_id, recipe_id, position) VALUES (?, ?, ?)').run(articleId, row.id, position);
  });
}
export function saveArticle(db, input, { id = null } = {}) {
  if (!db.prepare('SELECT 1 FROM help_categories WHERE key = ?').get(input.category)) throw invalid('category', 'دسته‌بندی راهنما وجود ندارد.');
  return transaction(db, () => {
    const values = [input.slug, input.category, input.title, input.summary, JSON.stringify(input.causes), JSON.stringify(input.steps), JSON.stringify(input.safety), JSON.stringify(input.references), input.reviewed ? 1 : 0, input.status, input.sortOrder];
    let articleId = id;
    if (id) {
      const { changes } = db.prepare(
        'UPDATE help_articles SET slug = ?, category_key = ?, title = ?, summary = ?, causes = ?, steps = ?, safety = ?, refs = ?, reviewed = ?, status = ?, sort_order = ?, updated_at = ? WHERE id = ?',
      ).run(...values, nowIso(), id);
      if (!changes) throw errors.notFound('راهنما پیدا نشد.');
    } else {
      articleId = Number(db.prepare(
        'INSERT INTO help_articles (slug, category_key, title, summary, causes, steps, safety, refs, reviewed, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(...values).lastInsertRowid);
    }
    writeArticle(db, articleId, input);
    return articleId;
  });
}
export function deleteArticle(db, id) {
  if (!db.prepare('DELETE FROM help_articles WHERE id = ?').run(id).changes) throw errors.notFound('راهنما پیدا نشد.');
}

// ---------- feedback ----------
export function addFeedback(db, { slug, type, message }) {
  const article = db.prepare("SELECT id FROM help_articles WHERE slug = ? AND status = 'published'").get(slug);
  if (!article) throw errors.notFound('راهنما پیدا نشد.');
  db.prepare('INSERT INTO feedback (article_id, type, message) VALUES (?, ?, ?)').run(article.id, type, message);
}
export const listFeedback = (db, { handled } = {}) =>
  db
    .prepare(
      `SELECT f.id, f.type, f.message, f.handled, f.created_at, a.slug, a.title FROM feedback f JOIN help_articles a ON a.id = f.article_id
       ${handled === undefined ? '' : 'WHERE f.handled = ?'} ORDER BY f.created_at DESC, f.id DESC LIMIT 200`,
    )
    .all(...(handled === undefined ? [] : [handled ? 1 : 0]))
    .map((r) => ({ id: r.id, type: r.type, message: r.message, handled: r.handled === 1, createdAt: r.created_at, articleSlug: r.slug, articleTitle: r.title }));
export function setFeedbackHandled(db, id, handled) {
  if (!db.prepare('UPDATE feedback SET handled = ? WHERE id = ?').run(handled ? 1 : 0, id).changes) throw errors.notFound('بازخورد پیدا نشد.');
}

// ---------- dashboard ----------
export function getSummary(db) {
  const count = (sql) => db.prepare(sql).get().n;
  const byStatus = Object.fromEntries(db.prepare('SELECT status, count(*) AS n FROM recipes GROUP BY status').all().map((r) => [r.status, r.n]));
  return {
    recipes: { total: count('SELECT count(*) AS n FROM recipes'), draft: byStatus.draft ?? 0, review: byStatus.review ?? 0, published: byStatus.published ?? 0, archived: byStatus.archived ?? 0 },
    categories: count('SELECT count(*) AS n FROM categories'),
    ingredients: count('SELECT count(*) AS n FROM ingredients'),
    helpArticles: { total: count('SELECT count(*) AS n FROM help_articles'), unreviewed: count('SELECT count(*) AS n FROM help_articles WHERE reviewed = 0') },
    feedbackUnhandled: count('SELECT count(*) AS n FROM feedback WHERE handled = 0'),
    recentRecipes: listRecipesAdmin(db).slice(0, 5),
  };
}
