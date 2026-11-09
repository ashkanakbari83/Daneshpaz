import { describe, it, expect } from 'vitest';
import { pickReleasesToShow, recentReleases, compareVersions, formatVersion, MAX_RELEASES_SHOWN } from './releases.js';
import { RELEASES, CHANGE_TYPES } from '../data/changelog.js';
import pkg from '../../package.json';

const R = [{ id: '0.5.0' }, { id: '0.4.0' }, { id: '0.3.0' }, { id: '0.2.0' }, { id: '0.1.0' }];
const ids = (list) => list.map((r) => r.id);

describe('pickReleasesToShow', () => {
  it('shows nothing when the newest release was already seen', () => {
    expect(pickReleasesToShow({ releases: R, lastSeen: '0.5.0', hasExistingData: true })).toEqual([]);
  });
  it('shows everything newer than the last seen release', () => {
    expect(ids(pickReleasesToShow({ releases: R, lastSeen: '0.4.0', hasExistingData: true }))).toEqual(['0.5.0']);
    expect(ids(pickReleasesToShow({ releases: R, lastSeen: '0.3.0', hasExistingData: false }))).toEqual(['0.5.0', '0.4.0']);
  });
  it('caps how many missed releases are shown', () => {
    expect(pickReleasesToShow({ releases: R, lastSeen: '0.1.0', hasExistingData: true }).length).toBe(MAX_RELEASES_SHOWN);
  });
  it('shows only the newest to a returning visitor who has never seen a release note', () => {
    expect(ids(pickReleasesToShow({ releases: R, lastSeen: null, hasExistingData: true }))).toEqual(['0.5.0']);
  });
  it('shows nothing to a brand-new visitor', () => {
    expect(pickReleasesToShow({ releases: R, lastSeen: null, hasExistingData: false })).toEqual([]);
  });
  it('treats junk or unknown stored values like "never seen"', () => {
    for (const bad of ['garbage', '9.9.9', 5, '', undefined]) {
      expect(ids(pickReleasesToShow({ releases: R, lastSeen: bad, hasExistingData: true }))).toEqual(['0.5.0']);
      expect(pickReleasesToShow({ releases: R, lastSeen: bad, hasExistingData: false })).toEqual([]);
    }
  });
  it('handles an empty changelog', () => {
    expect(pickReleasesToShow({ releases: [], lastSeen: null, hasExistingData: true })).toEqual([]);
  });
});

describe('helpers', () => {
  it('compares versions numerically, not as text', () => {
    expect(compareVersions('0.10.0', '0.9.0') > 0).toBe(true);
    expect(compareVersions('1.0.0', '0.99.99') > 0).toBe(true);
    expect(compareVersions('0.5.0', '0.5.0')).toBe(0);
  });
  it('formats versions with Persian digits', () => {
    expect(formatVersion('0.6.0')).toBe('۰٫۶٫۰');
  });
  it('recentReleases returns the newest few', () => {
    expect(ids(recentReleases(R))).toEqual(['0.5.0', '0.4.0', '0.3.0']);
  });
});

describe('the real changelog', () => {
  it('has an entry for the current package version at the top (add one with every update)', () => {
    expect(RELEASES[0].id).toBe(pkg.version);
  });
  it('is ordered newest first, with unique valid versions and dates', () => {
    for (let i = 0; i < RELEASES.length; i++) {
      expect(/^\d+\.\d+\.\d+$/.test(RELEASES[i].id)).toBe(true);
      expect(/^\d{4}-\d{2}-\d{2}$/.test(RELEASES[i].date)).toBe(true);
      if (i > 0) expect(compareVersions(RELEASES[i - 1].id, RELEASES[i].id) > 0).toBe(true);
    }
  });
  it('has Persian text and valid types for every change', () => {
    for (const r of RELEASES) {
      expect(r.title.length > 0 && r.changes.length > 0).toBe(true);
      for (const c of r.changes) {
        expect(Boolean(CHANGE_TYPES[c.type])).toBe(true);
        expect(/[\u0600-\u06FF]/.test(c.text)).toBe(true);
      }
    }
  });
});
