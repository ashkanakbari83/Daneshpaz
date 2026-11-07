import { transaction } from './db.js';
import { saveRecipe, saveArticle } from './repo.js';
import { CATEGORIES } from '../src/data/categories.js';
import { INGREDIENTS } from '../src/data/ingredients.js';
import { RECIPES } from '../src/data/recipes.js';
import { STEPS_BY_SLUG } from '../src/data/steps.js';
import { HELP_ARTICLES, HELP_CATEGORIES } from '../src/data/help.js';

/** Load the bundled DEMO content (prices are samples) into an empty database. */
export function seedDemo(db) {
  if (db.prepare('SELECT count(*) AS n FROM recipes').get().n > 0) return false;

  transaction(db, () => {
    CATEGORIES.forEach((c, i) => db.prepare('INSERT INTO categories (id, slug, title, sort_order) VALUES (?, ?, ?, ?)').run(c.id, c.slug, c.title, i));
    for (const ing of INGREDIENTS) {
      db.prepare('INSERT INTO ingredients (id, name, base_unit, unit_factors, package_quantity, package_unit) VALUES (?, ?, ?, ?, ?, ?)')
        .run(ing.id, ing.name, ing.baseUnit, JSON.stringify(ing.unitFactors), ing.package.quantity, ing.package.unit);
      const p = ing.price;
      db.prepare('INSERT INTO ingredient_prices (ingredient_id, amount, recorded_at, source, status, confidence) VALUES (?, ?, ?, ?, ?, ?)')
        .run(ing.id, p.amount, p.recordedAt, p.source, p.status, p.confidence);
    }
    HELP_CATEGORIES.forEach((c, i) => db.prepare('INSERT INTO help_categories (key, title, sort_order) VALUES (?, ?, ?)').run(c.key, c.title, i));
  });

  // Articles first (without recipe links), then recipes, then the links between them.
  const articleIds = {};
  HELP_ARTICLES.forEach((a, i) => {
    articleIds[a.slug] = saveArticle(db, { ...a, relatedRecipes: [], reviewed: a.reviewed, status: 'published', sortOrder: i });
  });
  const defaults = { scaling: { rule: 'linear' }, optional: false };
  RECIPES.forEach((r) => {
    saveRecipe(
      db,
      {
        ...r,
        status: 'published',
        steps: STEPS_BY_SLUG[r.slug],
        ingredients: r.ingredients.map((i) => ({ ...defaults, ...i })),
      },
      { newRecipeId: r.id },
    );
  });
  HELP_ARTICLES.forEach((a, i) => saveArticle(db, { ...a, status: 'published', sortOrder: i }, { id: articleIds[a.slug] }));
  return true;
}

/** Remove all content (never users). Used by `seed --force` and tests. */
export function resetContent(db) {
  transaction(db, () => {
    for (const table of ['feedback', 'help_article_recipes', 'recipe_help', 'cooking_steps', 'recipe_equipment', 'recipe_ingredients', 'recipe_categories', 'recipes', 'help_articles', 'help_categories', 'ingredient_prices', 'ingredients', 'categories']) {
      db.exec(`DELETE FROM ${table}`);
    }
  });
}
