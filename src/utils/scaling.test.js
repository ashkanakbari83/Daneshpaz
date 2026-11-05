import { describe, it, expect } from 'vitest';
import { scaleQuantity, roundQuantity, isEstimate } from './scaling.js';

describe('scaleQuantity', () => {
  const base = { quantity: 200, baseServings: 2 };
  it('scales linearly', () => {
    expect(scaleQuantity({ ...base, servings: 4, rule: 'linear' })).toBe(400);
    expect(scaleQuantity({ ...base, servings: 1, rule: 'linear' })).toBe(100);
  });
  it('keeps fixed quantities', () => {
    expect(scaleQuantity({ ...base, servings: 6, rule: 'fixed' })).toBe(200);
  });
  it('scales nonlinear quantities by less than linear when growing', () => {
    const scaled = scaleQuantity({ quantity: 2, baseServings: 2, servings: 4, rule: 'nonlinear', exponent: 0.8 });
    expect(scaled > 2).toBe(true);
    expect(scaled < 4).toBe(true);
  });
  it('gives manual rules a linear estimate', () => {
    expect(scaleQuantity({ ...base, servings: 4, rule: 'manual' })).toBe(400);
  });
});

describe('roundQuantity', () => {
  it('rounds grams sensibly', () => {
    expect(roundQuantity(237, 'g')).toBe(235);
    expect(roundQuantity(47.6, 'g')).toBe(48);
    expect(roundQuantity(3.2, 'g')).toBe(3);
  });
  it('rounds countable items to halves', () => {
    expect(roundQuantity(2.3, 'piece')).toBe(2.5);
    expect(roundQuantity(0.1, 'clove')).toBe(0.5);
  });
  it('rounds spoons to quarters', () => {
    expect(roundQuantity(0.4, 'tsp')).toBe(0.5);
    expect(roundQuantity(0.3, 'tbsp')).toBe(0.25);
  });
  it('returns 0 for invalid input', () => {
    expect(roundQuantity(-1, 'g')).toBe(0);
  });
});

describe('isEstimate', () => {
  it('flags only non-exact rules when servings change', () => {
    expect(isEstimate('nonlinear', 4, 2)).toBe(true);
    expect(isEstimate('manual', 4, 2)).toBe(true);
    expect(isEstimate('linear', 4, 2)).toBe(false);
    expect(isEstimate('nonlinear', 2, 2)).toBe(false);
  });
});
