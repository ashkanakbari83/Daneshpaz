import { describe, it, expect } from 'vitest';
import { INGREDIENTS } from './ingredients.js';
import { RECIPES } from './recipes.js';
import { CATEGORIES } from './categories.js';
import { HELP_ARTICLES, HELP_CATEGORIES } from './help.js';
import { toBaseQuantity } from '../utils/cost.js';

const byId = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

describe('demo data integrity', () => {
  it('has unique ids and slugs', () => {
    const unique = (list) => new Set(list).size === list.length;
    expect(unique(INGREDIENTS.map((i) => i.id))).toBe(true);
    expect(unique(RECIPES.map((r) => r.slug))).toBe(true);
    expect(unique(HELP_ARTICLES.map((a) => a.slug))).toBe(true);
  });
  it('has 30 ingredients and 10 categories', () => {
    expect(INGREDIENTS.length).toBe(30);
    expect(CATEGORIES.length).toBe(10);
  });
  it('labels every price as sample data', () => {
    expect(INGREDIENTS.every((i) => i.price.status === 'sample')).toBe(true);
  });
  it('references only existing ingredients, categories and help articles', () => {
    for (const r of RECIPES) {
      for (const i of r.ingredients) expect(Boolean(byId[i.ingredientId])).toBe(true);
      for (const s of r.categorySlugs) expect(CATEGORIES.some((c) => c.slug === s)).toBe(true);
      for (const s of r.helpSlugs) expect(HELP_ARTICLES.some((a) => a.slug === s)).toBe(true);
    }
    for (const a of HELP_ARTICLES) {
      expect(HELP_CATEGORIES.some((c) => c.key === a.category)).toBe(true);
      for (const s of a.relatedRecipes) expect(RECIPES.some((r) => r.slug === s)).toBe(true);
    }
  });
  it('can convert every recipe unit to the ingredient base unit', () => {
    for (const r of RECIPES) {
      for (const i of r.ingredients) {
        expect(toBaseQuantity(byId[i.ingredientId], i.quantity, i.unit) !== null).toBe(true);
      }
    }
  });
});
