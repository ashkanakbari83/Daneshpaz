import { describe, it, expect } from 'vitest';
import { computeRecipeCost, toBaseQuantity } from './cost.js';

const price = (amount) => ({ amount, recordedAt: '2026-11-01', source: 'نمونه', status: 'sample', confidence: 'low' });
const ingredientsById = {
  rice: { id: 'rice', baseUnit: 'g', unitFactors: { cup: 190 }, package: { quantity: 200, unit: 'g' }, price: price(20000) },
  oil: { id: 'oil', baseUnit: 'ml', unitFactors: { tbsp: 15 }, package: { quantity: 1000, unit: 'ml' }, price: price(100000) },
  odd: { id: 'odd', baseUnit: 'g', unitFactors: {}, package: { quantity: 100, unit: 'g' }, price: price(10000) },
};
const entry = (ingredientId, quantity, unit, extra = {}) => ({
  ingredientId, quantity, unit, scaling: { rule: 'linear' }, optional: false, ...extra,
});
const recipe = (ingredients, defaultServings = 2) => ({ ingredients, defaultServings });

describe('toBaseQuantity', () => {
  it('converts known units and returns null for unknown ones', () => {
    expect(toBaseQuantity(ingredientsById.rice, 1, 'cup')).toBe(190);
    expect(toBaseQuantity(ingredientsById.rice, 1, 'kg')).toBe(1000);
    expect(toBaseQuantity(ingredientsById.odd, 1, 'cup')).toBe(null);
  });
});

describe('computeRecipeCost', () => {
  it('separates consumed cost from purchase cost (50 g of a 200 g pack)', () => {
    const cost = computeRecipeCost({ recipe: recipe([entry('rice', 50, 'g')]), ingredientsById, servings: 2 });
    expect(cost.consumedTotal).toBe(5000); // ¼ of 20000
    expect(cost.purchaseTotal).toBe(20000); // the whole pack
  });
  it('buys extra packs when the amount exceeds one', () => {
    const cost = computeRecipeCost({ recipe: recipe([entry('rice', 250, 'g')]), ingredientsById, servings: 2 });
    expect(cost.purchaseTotal).toBe(40000);
  });
  it('does not charge purchase cost for items at home', () => {
    const cost = computeRecipeCost({
      recipe: recipe([entry('rice', 50, 'g'), entry('oil', 2, 'tbsp')]),
      ingredientsById,
      servings: 2,
      atHomeIds: new Set(['rice']),
    });
    expect(cost.purchaseTotal).toBe(100000);
    expect(cost.consumedTotal).toBe(5000 + 3000);
  });
  it('scales cost with servings', () => {
    const one = computeRecipeCost({ recipe: recipe([entry('rice', 100, 'g')]), ingredientsById, servings: 2 });
    const two = computeRecipeCost({ recipe: recipe([entry('rice', 100, 'g')]), ingredientsById, servings: 4 });
    expect(two.consumedTotal).toBe(one.consumedTotal * 2);
  });
  it('excludes optional ingredients from totals but lists them', () => {
    const cost = computeRecipeCost({
      recipe: recipe([entry('rice', 100, 'g'), entry('oil', 2, 'tbsp', { optional: true })]),
      ingredientsById,
      servings: 2,
    });
    expect(cost.consumedTotal).toBe(10000);
    expect(cost.lines.length).toBe(2);
  });
  it('reports ingredients whose unit cannot be priced', () => {
    const cost = computeRecipeCost({ recipe: recipe([entry('odd', 1, 'cup')]), ingredientsById, servings: 2 });
    expect(cost.unknownCount).toBe(1);
    expect(cost.consumedTotal).toBe(0);
  });
  it('keeps the least trustworthy price status', () => {
    const cost = computeRecipeCost({ recipe: recipe([entry('rice', 100, 'g')]), ingredientsById, servings: 2 });
    expect(cost.priceStatus).toBe('sample');
    expect(cost.pricesUpdatedAt).toBe('2026-11-01');
  });
});
