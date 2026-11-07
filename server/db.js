import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

/** Ordered migrations; the database remembers how many ran (PRAGMA user_version). */
const MIGRATIONS = [
  `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','editor')),
    created_at TEXT NOT NULL DEFAULT (${NOW})
  );
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (${NOW}),
    expires_at TEXT NOT NULL
  );
  CREATE INDEX idx_sessions_user ON sessions(user_id);
  CREATE INDEX idx_sessions_expires ON sessions(expires_at);

  CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 60 AND slug NOT GLOB '*[^a-z0-9-]*'),
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE ingredients (
    id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 60 AND id NOT GLOB '*[^a-z0-9-]*'),
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
    base_unit TEXT NOT NULL CHECK (base_unit IN ('g','ml','piece')),
    unit_factors TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(unit_factors)),
    package_quantity REAL NOT NULL CHECK (package_quantity > 0),
    package_unit TEXT NOT NULL CHECK (package_unit IN ('g','ml','piece')),
    description TEXT
  );
  CREATE TABLE ingredient_prices (
    id INTEGER PRIMARY KEY,
    ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    amount REAL NOT NULL CHECK (amount >= 0),
    recorded_at TEXT NOT NULL,
    source TEXT NOT NULL CHECK (length(source) BETWEEN 1 AND 200),
    status TEXT NOT NULL CHECK (status IN ('sample','estimated','verified')),
    confidence TEXT NOT NULL CHECK (confidence IN ('low','medium','high')),
    region TEXT
  );
  CREATE INDEX idx_prices_latest ON ingredient_prices(ingredient_id, recorded_at, id);

  CREATE TABLE recipes (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 80 AND slug NOT GLOB '*[^a-z0-9-]*'),
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 150),
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
    prep_time INTEGER NOT NULL CHECK (prep_time >= 0),
    cook_time INTEGER NOT NULL CHECK (cook_time >= 0),
    default_servings INTEGER NOT NULL CHECK (default_servings BETWEEN 1 AND 12),
    featured_order INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','archived')),
    meals TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(meals)),
    before_you_start TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(before_you_start)),
    created_at TEXT NOT NULL DEFAULT (${NOW}),
    updated_at TEXT NOT NULL DEFAULT (${NOW})
  );
  CREATE INDEX idx_recipes_status ON recipes(status, featured_order);

  CREATE TABLE recipe_categories (
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (recipe_id, category_id)
  );
  CREATE INDEX idx_recipe_categories_category ON recipe_categories(category_id);

  CREATE TABLE recipe_ingredients (
    id INTEGER PRIMARY KEY,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    position INTEGER NOT NULL,
    quantity REAL NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL,
    scaling_rule TEXT NOT NULL DEFAULT 'linear' CHECK (scaling_rule IN ('linear','nonlinear','fixed','manual')),
    scaling_exponent REAL,
    optional INTEGER NOT NULL DEFAULT 0 CHECK (optional IN (0,1)),
    UNIQUE (recipe_id, ingredient_id)
  );
  CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id, position);
  CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

  CREATE TABLE recipe_equipment (
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    equipment_key TEXT NOT NULL,
    required INTEGER NOT NULL CHECK (required IN (0,1)),
    position INTEGER NOT NULL,
    PRIMARY KEY (recipe_id, equipment_key)
  );

  CREATE TABLE cooking_steps (
    id INTEGER PRIMARY KEY,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    step_key TEXT NOT NULL,
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 150),
    description TEXT NOT NULL,
    heat TEXT NOT NULL DEFAULT 'none' CHECK (heat IN ('none','low','medium','high')),
    duration INTEGER CHECK (duration IS NULL OR duration > 0),
    ingredients TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(ingredients)),
    tips TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tips)),
    warnings TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(warnings)),
    done_cues TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(done_cues)),
    UNIQUE (recipe_id, step_key),
    UNIQUE (recipe_id, position)
  );

  CREATE TABLE help_categories (
    key TEXT PRIMARY KEY CHECK (length(key) BETWEEN 1 AND 40 AND key NOT GLOB '*[^a-z0-9-]*'),
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE help_articles (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 80 AND slug NOT GLOB '*[^a-z0-9-]*'),
    category_key TEXT NOT NULL REFERENCES help_categories(key) ON DELETE RESTRICT,
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
    summary TEXT NOT NULL,
    causes TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(causes)),
    steps TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(steps)),
    safety TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(safety)),
    refs TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(refs)),
    reviewed INTEGER NOT NULL DEFAULT 0 CHECK (reviewed IN (0,1)),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (${NOW})
  );
  CREATE INDEX idx_help_status ON help_articles(status, sort_order);
  CREATE TABLE recipe_help (
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (recipe_id, article_id)
  );
  CREATE TABLE help_article_recipes (
    article_id INTEGER NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (article_id, recipe_id)
  );

  CREATE TABLE feedback (
    id INTEGER PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('helpful','not-helpful','report')),
    message TEXT CHECK (message IS NULL OR length(message) <= 500),
    handled INTEGER NOT NULL DEFAULT 0 CHECK (handled IN (0,1)),
    created_at TEXT NOT NULL DEFAULT (${NOW})
  );
  CREATE INDEX idx_feedback_handled ON feedback(handled, created_at);
  `,
];

export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  migrate(db);
  return db;
}

export function migrate(db) {
  const current = db.prepare('PRAGMA user_version').get().user_version;
  for (let version = current; version < MIGRATIONS.length; version++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[version]);
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

/** Run fn inside a transaction; rolls back and rethrows on error. */
export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
