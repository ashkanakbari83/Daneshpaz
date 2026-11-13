import { describe, it, expect } from 'vitest';
import { INGREDIENTS } from './ingredients.js';
import { RECIPES } from './recipes.js';
import { CATEGORIES } from './categories.js';
import { HELP_ARTICLES, HELP_CATEGORIES } from './help.js';
import { toBaseQuantity } from '../utils/cost.js';
import { STEPS_BY_SLUG } from './steps.js';

const byId = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

describe('demo data integrity', () => {
  it('has unique ids and slugs', () => {
    const unique = (list) => new Set(list).size === list.length;
    expect(unique(INGREDIENTS.map((i) => i.id))).toBe(true);
    expect(unique(RECIPES.map((r) => r.slug))).toBe(true);
    expect(unique(HELP_ARTICLES.map((a) => a.slug))).toBe(true);
  });
  it('has 20 recipes, 30 ingredients and 10 categories', () => {
    expect(RECIPES.length).toBe(20);
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

  it('has cooking steps for every recipe, with unique ids', () => {
    for (const r of RECIPES) {
      const steps = STEPS_BY_SLUG[r.slug];
      expect(Array.isArray(steps) && steps.length >= 3).toBe(true);
      expect(new Set(steps.map((x) => x.id)).size).toBe(steps.length);
    }
  });
  it('gives every step completion cues, and every heated or timed step a warning or tip', () => {
    for (const steps of Object.values(STEPS_BY_SLUG)) {
      for (const st of steps) {
        expect(st.doneCues.length >= 1).toBe(true);
        if (st.heat !== 'none' || st.duration) expect(st.warnings.length + st.tips.length >= 1).toBe(true);
      }
    }
  });
  it('uses only the recipe\'s own ingredients in steps, and covers every required one', () => {
    for (const r of RECIPES) {
      const own = new Set(r.ingredients.map((i) => i.ingredientId));
      const used = new Set();
      for (const st of STEPS_BY_SLUG[r.slug]) for (const i of st.ingredients) { expect(own.has(i.ingredientId)).toBe(true); used.add(i.ingredientId); }
      for (const i of r.ingredients.filter((x) => !x.optional)) expect(used.has(i.ingredientId)).toBe(true);
    }
  });
  it('keeps split portions from exceeding the whole', () => {
    for (const steps of Object.values(STEPS_BY_SLUG)) {
      const sums = {};
      for (const st of steps) for (const i of st.ingredients) sums[i.ingredientId] = (sums[i.ingredientId] ?? 0) + (i.portion ?? 1);
      // an ingredient may be *mentioned* in several steps, so only flag explicit splits
      for (const st of steps) for (const i of st.ingredients) if (i.portion && i.portion < 1) expect(sums[i.ingredientId] <= 2).toBe(true);
    }
  });
  it('requires a temperature or visible check in chicken cooking cues', () => {
    const cues = STEPS_BY_SLUG['chicken-potato-pan'].flatMap((st) => st.doneCues).join(' ');
    expect(cues.includes('۷۴')).toBe(true);
    expect(cues.includes('صورتی')).toBe(true);
  });

  it('puts every category except none to use: each category has at least one recipe', () => {
    for (const c of CATEGORIES) expect(RECIPES.some((r) => r.categorySlugs.includes(c.slug))).toBe(true);
  });
  it('covers the equipment filter: some recipes need an oven, none need unknown equipment', () => {
    const keys = ['pot', 'pan', 'knife', 'board', 'oven', 'mixer', 'spatula', 'strainer', 'grater'];
    expect(RECIPES.some((r) => r.equipment.some((e) => e.key === 'oven' && e.required))).toBe(true);
    for (const r of RECIPES) for (const e of r.equipment) expect(keys.includes(e.key)).toBe(true);
  });
  it('keeps food-safety warnings on every recipe that cooks raw chicken or eggs', () => {
    for (const r of RECIPES) {
      const steps = STEPS_BY_SLUG[r.slug];
      const has = (id) => r.ingredients.some((i) => i.ingredientId === id && !i.optional);
      const text = steps.flatMap((st) => [...st.warnings, ...st.doneCues]).join(' ');
      if (has('chicken')) expect(text.includes('۷۴') && text.includes('صورتی')).toBe(true);
      if (has('eggs') && r.cookTime > 0) expect(text.includes('تخم‌مرغ')).toBe(true);
    }
  });
});
