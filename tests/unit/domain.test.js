import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanSeed, SEED_RELEASES } from '../../src/data/seed.js';
import { applySeedReleases, withDefaults, createEmptyDb } from '../../src/lib/domain/db.js';
import { analyzeRecipe, setServings } from '../../src/lib/domain/recipes.js';
import { togglePantry, toggleFavorite, toggleEquipment } from '../../src/lib/domain/pantry.js';
import { searchRecipes, setFilters, resetFilters, activeFilterCount } from '../../src/lib/domain/filters.js';
import { roundAmount, packsNeeded, scaleAmount } from '../../src/lib/domain/quantity.js';
import { normalizeText } from '../../src/lib/text.js';

test('seed is deterministic and demo-marked', () => {
  const a = cleanSeed();
  const b = cleanSeed();
  assert.deepEqual(a, b);
  assert.ok(Object.values(a.recipes).length >= 12);
  for (const r of Object.values(a.recipes)) assert.equal(r.demo, true);
  for (const i of Object.values(a.ingredients)) assert.ok(i.pack.price >= 1000 && i.pack.price % 1000 === 0);
});

test('every recipe references existing ingredients and equipment, has steps', () => {
  const db = cleanSeed();
  for (const r of Object.values(db.recipes)) {
    assert.ok(r.steps.length >= 3, r.id);
    for (const row of r.ingredients) assert.ok(db.ingredients[row.ingredientId], `${r.id}:${row.ingredientId}`);
    for (const e of r.equipment) assert.ok(db.equipment[e], `${r.id}:${e}`);
  }
});

test('quantity rounding and packs', () => {
  assert.equal(scaleAmount(300, 3, 6), 600);
  assert.equal(roundAmount(333, 'g'), 330);
  assert.equal(roundAmount(37, 'g'), 35);
  assert.equal(roundAmount(2.4, 'clove'), 2);
  assert.equal(roundAmount(1.3, 'pcs'), 1.5);
  assert.equal(roundAmount(0.6, 'tsp'), 0.5);
  assert.equal(packsNeeded(1000, 1000), 1);
  assert.equal(packsNeeded(1001, 1000), 2);
  assert.equal(packsNeeded(0, 1000), 0);
});

test('analyzeRecipe splits have/need and computes costs', () => {
  const db = cleanSeed();
  const a = analyzeRecipe(db, 'rcp-omelet');
  assert.equal(a.servings, 2);
  const haveIds = a.haveLines.map((l) => l.ingredient.id).sort();
  assert.deepEqual(haveIds, ['ing-oil', 'ing-pepper', 'ing-salt', 'ing-turmeric']);
  assert.deepEqual(a.needLines.map((l) => l.ingredient.id).sort(), ['ing-egg', 'ing-onion', 'ing-tomato']);
  // buying full packs always costs at least what is used
  assert.ok(a.buyCost >= a.needLines.reduce((s, l) => s + l.usedCost, 0));
  assert.ok(a.usedCost > 0 && a.buyCost > 0);
  assert.ok(Math.abs(a.leftoverValue - (a.buyCost - a.needLines.reduce((s, l) => s + l.usedCost, 0))) < 1e-6);
  assert.equal(a.missingEquipment.length, 0);
});

test('servings scale amounts and cost', () => {
  const db = cleanSeed();
  const one = analyzeRecipe(db, 'rcp-omelet', 2);
  const two = analyzeRecipe(db, 'rcp-omelet', 4);
  const eggs = (a) => a.lines.find((l) => l.ingredient.id === 'ing-egg').amount;
  assert.equal(eggs(one), 4);
  assert.equal(eggs(two), 8);
  assert.ok(two.usedCost > one.usedCost);
  // egg pack = 12 → 8 eggs still one pack, 16 eggs two
  assert.equal(two.needLines.find((l) => l.ingredient.id === 'ing-egg').packs, 1);
  assert.equal(analyzeRecipe(db, 'rcp-omelet', 8).needLines.find((l) => l.ingredient.id === 'ing-egg').packs, 2);
});

test('setServings validates and persists per recipe', () => {
  const db = cleanSeed();
  assert.equal(setServings(db, 'nope', 2).ok, false);
  assert.equal(setServings(db, 'rcp-omelet', 0).ok, false);
  assert.equal(setServings(db, 'rcp-omelet', 13).ok, false);
  const r = setServings(db, 'rcp-omelet', 5);
  assert.equal(r.ok, true);
  assert.equal(analyzeRecipe(r.db, 'rcp-omelet').servings, 5);
  assert.equal(db.user.servings['rcp-omelet'], undefined); // input untouched
});

test('pantry, equipment and favorites toggle without mutating', () => {
  const db = cleanSeed();
  const p = togglePantry(db, 'ing-egg');
  assert.equal(p.ok, true);
  assert.equal(p.has, true);
  assert.ok(!db.user.pantry.includes('ing-egg'));
  assert.equal(togglePantry(p.db, 'ing-egg').has, false);
  assert.equal(togglePantry(db, 'zzz').ok, false);
  assert.equal(toggleEquipment(db, 'eq-oven').owned, true);
  const f = toggleFavorite(db, 'rcp-firni');
  assert.deepEqual(f.db.user.favorites, ['rcp-firni']);
  assert.equal(toggleFavorite(db, 'zzz').ok, false);
});

test('having an ingredient removes it from the buy list', () => {
  let db = cleanSeed();
  const before = analyzeRecipe(db, 'rcp-omelet');
  db = togglePantry(db, 'ing-egg').db;
  const after = analyzeRecipe(db, 'rcp-omelet');
  assert.equal(after.missingCount, before.missingCount - 1);
  assert.ok(after.buyCost < before.buyCost);
  assert.equal(after.usedCost, before.usedCost); // used value doesn't depend on pantry
});

test('search: text, time, difficulty, missing, equipment, favorites', () => {
  let db = cleanSeed();
  const ids = (f) => searchRecipes(db, { ...db.user.filters, ...f }).map((x) => x.recipe.id);
  assert.ok(ids({ q: 'املت' }).includes('rcp-omelet'));
  assert.ok(ids({ q: 'تخم‌مرغ' }).includes('rcp-omelet')); // ingredient name search
  assert.ok(ids({ q: 'تخم مرغ' }).includes('rcp-omelet')); // ZWNJ vs space
  assert.ok(ids({ q: 'عدس' }).includes('rcp-lentil-soup'));
  assert.deepEqual(ids({ q: 'xyzنداریم' }), []);
  for (const id of ids({ maxMinutes: 15 })) assert.ok(db.recipes[id].minutes <= 15);
  for (const id of ids({ maxDifficulty: 1 })) assert.equal(db.recipes[id].difficulty, 1);
  // default equipment: pan + pot → oven & strainer recipes excluded
  const mine = ids({ onlyMyEquipment: true });
  assert.ok(!mine.includes('rcp-chicken-oven'));
  assert.ok(!mine.includes('rcp-pilaf'));
  assert.ok(mine.includes('rcp-omelet'));
  db = toggleEquipment(db, 'eq-oven').db;
  assert.ok(ids({ onlyMyEquipment: true }).includes('rcp-chicken-oven'));
  // nothing missing: only recipes made of default pantry basics → none in seed
  assert.deepEqual(ids({ maxMissing: 0 }), []);
  db = toggleFavorite(db, 'rcp-firni').db;
  assert.deepEqual(ids({ favoritesOnly: true }), ['rcp-firni']);
});

test('search sorts by fewest missing ingredients first', () => {
  const db = cleanSeed();
  const res = searchRecipes(db, db.user.filters);
  for (let i = 1; i < res.length; i++) assert.ok(res[i - 1].analysis.missingCount <= res[i].analysis.missingCount);
});

test('cost filter uses per-serving used cost', () => {
  const db = cleanSeed();
  const cheap = searchRecipes(db, { ...db.user.filters, maxCostPerServing: 40000 });
  for (const { analysis } of cheap) assert.ok(analysis.costPerServing <= 40000);
  assert.ok(cheap.length > 0);
  assert.ok(cheap.length < Object.keys(db.recipes).length);
});

test('filters: set/reset/count', () => {
  const db = cleanSeed();
  const s = setFilters(db, { maxMinutes: 30, onlyMyEquipment: true, q: 'سوپ' });
  assert.equal(activeFilterCount(s.db.user.filters), 2);
  const r = resetFilters(s.db);
  assert.equal(activeFilterCount(r.db.user.filters), 0);
  assert.equal(r.db.user.filters.q, 'سوپ'); // search text is kept
});

test('normalizeText unifies Arabic/Persian letters and digits', () => {
  assert.equal(normalizeText('كباب  ي'), 'کباب ی');
  assert.equal(normalizeText('سیب‌زمینی'), 'سیبزمینی');
  assert.equal(normalizeText('۱۲٣'), '123');
});

test('withDefaults repairs broken state without losing user data', () => {
  const broken = withDefaults({ user: { favorites: ['a', 'a', 3], pantry: 'x', filters: { maxMinutes: -5, q: 7 }, cooking: { recipeId: 5 } } });
  assert.deepEqual(broken.user.favorites, ['a']);
  assert.ok(Array.isArray(broken.user.pantry));
  assert.equal(broken.user.filters.maxMinutes, null);
  assert.equal(broken.user.filters.q, '');
  assert.equal(broken.user.cooking, null);
  assert.deepEqual(withDefaults(null).recipes, {});
  assert.deepEqual(withDefaults(undefined).user.equipment, ['eq-pan', 'eq-pot']);
});

test('seed release adds only missing items once and never overwrites', () => {
  const db0 = createEmptyDb();
  const rel1 = SEED_RELEASES[0];
  const db1 = applySeedReleases(db0, SEED_RELEASES);
  assert.equal(db1.seedRelease, rel1.release);
  // user edits a seeded recipe title; re-applying must not overwrite
  const edited = { ...db1, recipes: { ...db1.recipes, 'rcp-omelet': { ...db1.recipes['rcp-omelet'], title: { fa: 'ویرایش', en: 'edited' } } } };
  const again = applySeedReleases({ ...edited, seedRelease: 0 }, SEED_RELEASES);
  assert.equal(again.recipes['rcp-omelet'].title.fa, 'ویرایش');
  // a new release adds a brand-new id once
  const newRel = { release: rel1.release + 1, ingredients: {}, equipment: {}, recipes: { 'rcp-new': { ...db1.recipes['rcp-omelet'], id: 'rcp-new' } } };
  const upgraded = applySeedReleases(db1, [...SEED_RELEASES, newRel]);
  assert.ok(upgraded.recipes['rcp-new']);
  assert.equal(upgraded.seedRelease, newRel.release);
  assert.equal(applySeedReleases(upgraded, [...SEED_RELEASES, newRel]), upgraded);
});
