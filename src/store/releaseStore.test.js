import { describe, it, expect } from 'vitest';
import { getLastSeenRelease, markReleaseSeen, hasExistingUserData } from './releaseStore.js';

function install(initial = {}, { throws = false } = {}) {
  const data = { ...initial };
  globalThis.window = {
    localStorage: {
      get length() { if (throws) throw new Error('blocked'); return Object.keys(data).length; },
      key: (i) => Object.keys(data)[i] ?? null,
      getItem: (k) => { if (throws) throw new Error('blocked'); return k in data ? data[k] : null; },
      setItem: (k, v) => { if (throws) throw new Error('blocked'); data[k] = String(v); },
    },
  };
  return data;
}

describe('releaseStore', () => {
  it('remembers the last seen release', () => {
    const data = install();
    expect(getLastSeenRelease()).toBe(null);
    markReleaseSeen('0.6.0');
    expect(data['daneshpaz:last-seen-release']).toBe('0.6.0');
    expect(getLastSeenRelease()).toBe('0.6.0');
  });
  it('ignores junk stored values', () => {
    for (const junk of ['latest', '1.2', '<b>', '{"a":1}', '']) {
      install({ 'daneshpaz:last-seen-release': junk });
      expect(getLastSeenRelease()).toBe(null);
    }
  });
  it('detects existing user data, but not the release marker itself', () => {
    install({ 'daneshpaz:last-seen-release': '0.6.0', other: 'x' });
    expect(hasExistingUserData()).toBe(false);
    install({ 'daneshpaz:favorites': '[]' });
    expect(hasExistingUserData()).toBe(true);
    install();
    expect(hasExistingUserData()).toBe(false);
  });
  it('never throws when storage is blocked', () => {
    install({}, { throws: true });
    expect(getLastSeenRelease()).toBe(null);
    expect(hasExistingUserData()).toBe(false);
    markReleaseSeen('0.6.0'); // must not throw
    expect(true).toBe(true);
  });
});
