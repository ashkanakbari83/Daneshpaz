import { describe, it, expect } from 'vitest';
import { normalizeText, tokenize, searchRecipes } from './search.js';
import { parseFilters, serializeFilters, removeFilter, DEFAULT_FILTERS } from './filters.js';

const ingredientsById = { eggs: { name: 'تخم‌مرغ' }, rice: { name: 'برنج' }, tomato: { name: 'گوجه‌فرنگی' }, salt: { name: 'نمک' }, oil: { name: 'روغن' } };
const categoriesBySlug = { quick: { title: 'غذاهای فوری' }, iranian: { title: 'غذاهای ایرانی' } };
const ctx = { ingredientsById, categoriesBySlug };
const mk = (over) => ({
  title: 'املت', description: '', categorySlugs: ['quick'], meals: ['dinner'], difficulty: 'easy',
  prepTime: 5, cookTime: 10, defaultServings: 2, featuredOrder: 1, equipment: [{ key: 'pan', required: true }],
  ingredients: [{ ingredientId: 'eggs', optional: false }, { ingredientId: 'tomato', optional: false }], ...over,
});
const omelet = mk({ title: 'املت گوجه' });
const rice = mk({ title: 'کته', difficulty: 'medium', prepTime: 10, cookTime: 40, featuredOrder: 2, categorySlugs: ['iranian'], ingredients: [{ ingredientId: 'rice', optional: false }], equipment: [{ key: 'pot', required: true }] });
const recipes = [omelet, rice];
const costOf = (r) => (r === omelet ? 50000 : 120000);
const run = (over) => searchRecipes({ recipes, ctx, costOf, filters: { ...DEFAULT_FILTERS, ...over } }).map((x) => x.recipe.title);

describe('normalizeText', () => {
  it('unifies Arabic letters, digits and ZWNJ', () => {
    expect(normalizeText('گوجه‌فرنگي')).toBe('گوجه فرنگی');
    expect(normalizeText('كباب ۲')).toBe('کباب 2');
  });
  it('tokenizes', () => {
    expect(tokenize('  املت   گوجه ')).toEqual(['املت', 'گوجه']);
  });
});

describe('searchRecipes', () => {
  it('finds by title, ingredient and category', () => {
    expect(run({ q: 'املت' })).toEqual(['املت گوجه']);
    expect(run({ q: 'برنج' })).toEqual(['کته']);
    expect(run({ q: 'ایرانی' })).toEqual(['کته']);
  });
  it('requires every word to match', () => {
    expect(run({ q: 'املت برنج' })).toEqual([]);
  });
  it('filters by difficulty, time, cost and category', () => {
    expect(run({ diff: ['medium'] })).toEqual(['کته']);
    expect(run({ total: 30 })).toEqual(['املت گوجه']);
    expect(run({ cost: 60000 })).toEqual(['املت گوجه']);
    expect(run({ cat: 'iranian' })).toEqual(['کته']);
  });
  it('filters by available equipment', () => {
    expect(run({ equip: ['pan'] })).toEqual(['املت گوجه']);
  });
  it('ranks by ingredients on hand and drops poor matches', () => {
    expect(run({ have: ['rice'] })).toEqual(['کته']);
    expect(run({ have: ['eggs', 'tomato'] })).toEqual(['املت گوجه']);
  });
  it('assumes pantry staples (salt, oil...) are at home when matching ingredients', () => {
    const withStaples = mk({ title: 'املت کامل', ingredients: [
      { ingredientId: 'eggs', optional: false }, { ingredientId: 'tomato', optional: false },
      { ingredientId: 'oil', optional: false }, { ingredientId: 'salt', optional: false }] });
    const pick = (have) => searchRecipes({ recipes: [withStaples, rice], ctx, costOf, filters: { ...DEFAULT_FILTERS, have } }).map((x) => x.recipe.title);
    expect(pick(['eggs', 'tomato'])).toEqual(['املت کامل']); // 2 of 2 main ingredients
    expect(pick(['eggs'])).toEqual(['املت کامل']); // 1 of 2 = half is enough
    expect(pick(['rice'])).toEqual(['کته']);
    expect(pick(['salt', 'oil'])).toEqual([]); // staples alone never match
  });
  it('sorts by cost and speed', () => {
    expect(run({ sort: 'cost' })).toEqual(['املت گوجه', 'کته']);
    expect(run({ sort: 'fast' })).toEqual(['املت گوجه', 'کته']);
  });
});

describe('filter params', () => {
  it('round-trips through URL params', () => {
    const filters = { ...DEFAULT_FILTERS, q: 'املت', diff: ['easy'], cost: 50000, equip: ['pan'] };
    const params = new URLSearchParams(serializeFilters(filters));
    expect(parseFilters(params)).toEqual(filters);
  });
  it('drops junk values', () => {
    const params = new URLSearchParams('diff=evil,easy&cost=abc&sort=hack&meal=lunch');
    const parsed = parseFilters(params);
    expect(parsed.diff).toEqual(['easy']);
    expect(parsed.cost).toBe(null);
    expect(parsed.sort).toBe('recommended');
    expect(parsed.meal).toEqual(['lunch']);
  });
  it('removes a single list value or resets a scalar', () => {
    const f = { ...DEFAULT_FILTERS, diff: ['easy', 'medium'], cost: 50000 };
    expect(removeFilter(f, 'diff', 'easy').diff).toEqual(['medium']);
    expect(removeFilter(f, 'cost').cost).toBe(null);
  });
});
