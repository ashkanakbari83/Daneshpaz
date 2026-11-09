import { describe, it, expect } from 'vitest';
import { collectStepNotes } from './recipeNotes.js';
import { STEPS_BY_SLUG } from '../data/steps.js';

describe('collectStepNotes', () => {
  it('lists tips and warnings with their step, without duplicates', () => {
    const steps = [
      { title: 'الف', tips: ['t1'], warnings: ['w1', 'w2'] },
      { title: 'ب', tips: ['t1', 't2'], warnings: ['w1'] },
    ];
    const notes = collectStepNotes(steps);
    expect(notes.tips).toEqual([{ text: 't1', step: 1, title: 'الف' }, { text: 't2', step: 2, title: 'ب' }]);
    expect(notes.warnings.map((w) => w.text)).toEqual(['w1', 'w2']);
  });
  it('handles missing fields and empty input', () => {
    expect(collectStepNotes()).toEqual({ tips: [], warnings: [] });
    expect(collectStepNotes([{ title: 'x' }])).toEqual({ tips: [], warnings: [] });
  });
  it('keeps every safety warning of the demo chicken recipe', () => {
    const { warnings } = collectStepNotes(STEPS_BY_SLUG['chicken-potato-pan']);
    const all = STEPS_BY_SLUG['chicken-potato-pan'].flatMap((s) => s.warnings);
    for (const text of all) expect(warnings.some((w) => w.text === text)).toBe(true);
  });
});
