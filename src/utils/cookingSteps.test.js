import { describe, it, expect } from 'vitest';
import { stepIngredientAmounts } from './cookingSteps.js';

const ingredientsById = { oil: { name: 'روغن' }, eggs: { name: 'تخم‌مرغ' } };
const recipe = {
  defaultServings: 2,
  ingredients: [
    { ingredientId: 'oil', quantity: 2, unit: 'tbsp', scaling: { rule: 'linear' }, optional: false },
    { ingredientId: 'eggs', quantity: 4, unit: 'piece', scaling: { rule: 'linear' }, optional: false },
  ],
};

describe('stepIngredientAmounts', () => {
  it('scales amounts to the chosen servings', () => {
    const step = { ingredients: [{ ingredientId: 'eggs', portion: 1 }] };
    expect(stepIngredientAmounts({ recipe, ingredientsById, step, servings: 4 })[0].amount).toBe('۸ عدد');
  });
  it('applies portions for ingredients split across steps', () => {
    const step = { ingredients: [{ ingredientId: 'oil', portion: 0.5 }] };
    expect(stepIngredientAmounts({ recipe, ingredientsById, step, servings: 2 })[0].amount).toBe('۱ قاشق غذاخوری');
  });
  it('ignores unknown ingredients', () => {
    const step = { ingredients: [{ ingredientId: 'nope', portion: 1 }] };
    expect(stepIngredientAmounts({ recipe, ingredientsById, step, servings: 2 })).toEqual([]);
  });
});
