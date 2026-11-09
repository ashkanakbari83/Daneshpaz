import { describe, it, expect } from 'vitest';
import { createLocalStore, isStringList } from './localStore.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}
const install = (storage) => { globalThis.window = { localStorage: storage, addEventListener() {}, removeEventListener() {} }; };

describe('createLocalStore handles bad stored data', () => {
  it('reads a valid value', () => {
    install(fakeStorage({ k: '["a","b"]' }));
    expect(createLocalStore('k', [], isStringList).getSnapshot()).toEqual(['a', 'b']);
  });
  it('falls back when the key is missing', () => {
    install(fakeStorage());
    expect(createLocalStore('k', ['x'], isStringList).getSnapshot()).toEqual(['x']);
  });
  it('falls back on corrupt JSON, wrong shape and wrong element types', () => {
    for (const bad of ['{not json', '{"oops":1}', '"text"', '5', '[1,2]', 'null']) {
      install(fakeStorage({ k: bad }));
      expect(createLocalStore('k', [], isStringList).getSnapshot()).toEqual([]);
    }
  });
  it('does not overwrite the stored value just by reading it', () => {
    const storage = fakeStorage({ k: '{"oops":1}' });
    install(storage);
    createLocalStore('k', [], isStringList).getSnapshot();
    expect(storage.data.k).toBe('{"oops":1}');
  });
  it('survives blocked storage and still keeps the value in memory', () => {
    install({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
    const store = createLocalStore('k', [], isStringList);
    expect(store.getSnapshot()).toEqual([]);
    store.set(['a']);
    expect(store.getSnapshot()).toEqual(['a']);
  });
  it('writes valid values to storage', () => {
    const storage = fakeStorage();
    install(storage);
    createLocalStore('k', [], isStringList).set(['a']);
    expect(storage.data.k).toBe('["a"]');
  });
  it('accepts object-or-null for cooking sessions', () => {
    const isSession = (v) => v === null || (typeof v === 'object' && !Array.isArray(v));
    install(fakeStorage({ k: '[1]' }));
    expect(createLocalStore('k', null, isSession).getSnapshot()).toBe(null);
    install(fakeStorage({ k: '{"slug":"x"}' }));
    expect(createLocalStore('k', null, isSession).getSnapshot()).toEqual({ slug: 'x' });
  });
});
