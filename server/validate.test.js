import { describe, it, expect } from 'vitest';
import { str, int, num, oneOf, arrayOf, object, optional, required, nullable, parse } from './validate.js';

describe('validators', () => {
  it('trims strings and enforces length with Persian messages', () => {
    expect(parse(str({ min: 1 }), '  سلام ').value).toBe('سلام');
    expect(parse(str({ min: 1 }), '   ').errors[0].message).toBe('این فیلد الزامی است.');
    expect(parse(str({ max: 3 }), 'abcd').errors[0].message).toBe('حداکثر ۳ نویسه مجاز است.');
    expect(parse(str(), 5).ok).toBe(false);
  });
  it('checks numbers', () => {
    expect(parse(int({ min: 1, max: 12 }), 3).ok).toBe(true);
    expect(parse(int({ min: 1 }), 1.5).ok).toBe(false);
    expect(parse(int(), '3').ok).toBe(false);
    expect(parse(num({ min: 0, exclusiveMin: true }), 0).ok).toBe(false);
    expect(parse(num(), NaN).ok).toBe(false);
  });
  it('rejects values outside an enum', () => {
    expect(parse(oneOf(['a', 'b']), 'c').ok).toBe(false);
  });
  it('validates objects, strips unknown keys, applies defaults, and reports paths', () => {
    const schema = object({ name: required(str({ min: 1 })), tags: optional(arrayOf(str({ min: 1 }), { max: 2 }), []), note: optional(nullable(str()), null) });
    expect(parse(schema, { name: 'x', evil: '<script>', isAdmin: true }).value).toEqual({ name: 'x', tags: [], note: null });
    const bad = parse(schema, { name: '', tags: ['a', ''] });
    expect(bad.errors.map((e) => e.path)).toEqual(['name', 'tags[1]']);
    expect(parse(schema, null).ok).toBe(false);
    expect(parse(schema, []).ok).toBe(false);
  });
  it('enforces array limits and uniqueness', () => {
    expect(parse(arrayOf(int(), { max: 2 }), [1, 2, 3]).ok).toBe(false);
    expect(parse(arrayOf(int(), { unique: true }), [1, 1]).ok).toBe(false);
    expect(parse(arrayOf(int(), { min: 1 }), []).ok).toBe(false);
  });
});
