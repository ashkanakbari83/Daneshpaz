import { describe, it, expect } from 'vitest';
import {
  createSession, sessionReducer, normalizeSession, findExpired, hasProgress, hasRunningTimers,
} from './cookingSession.js';
import { getRemainingMs } from './timer.js';

const T0 = 5_000_000;
const stepIds = ['s1', 's2', 's3'];
const fresh = () => createSession({ slug: 'demo', servings: 2, now: T0 });
const act = (s, action) => sessionReducer(s, { now: T0, stepCount: 3, ...action });

describe('navigation', () => {
  it('moves forward and back within bounds', () => {
    let s = act(fresh(), { type: 'next' });
    expect(s.stepIndex).toBe(1);
    s = act(act(s, { type: 'next' }), { type: 'next' });
    expect(s.stepIndex).toBe(2);
    expect(act(s, { type: 'prev' }).stepIndex).toBe(1);
    expect(act(fresh(), { type: 'prev' }).stepIndex).toBe(0);
  });
  it('marks a step done and advances; finishes on the last step', () => {
    let s = act(fresh(), { type: 'complete', stepId: 's1' });
    expect(s.completed).toEqual(['s1']);
    expect(s.stepIndex).toBe(1);
    s = act(act(s, { type: 'complete', stepId: 's2' }), { type: 'complete', stepId: 's3' });
    expect(s.finished).toBe(true);
    expect(s.stepIndex).toBe(2);
    expect(act(s, { type: 'prev' }).finished).toBe(false);
  });
  it('does not duplicate completed steps', () => {
    const s = act(act(fresh(), { type: 'complete', stepId: 's1' }), { type: 'goto', index: 0 });
    expect(act(s, { type: 'complete', stepId: 's1' }).completed).toEqual(['s1']);
  });
});

describe('timers survive step changes', () => {
  it('keeps a running timer while the cook moves to another step', () => {
    let s = act(fresh(), { type: 'timer', op: 'start', stepId: 's1', baseSeconds: 300 });
    s = act(s, { type: 'next' });
    s = act(s, { type: 'next' });
    expect(s.timers.s1.status).toBe('running');
    expect(getRemainingMs(s.timers.s1, T0 + 100_000)).toBe(200_000);
    expect(hasRunningTimers(s)).toBe(true);
  });
  it('finds and expires finished timers', () => {
    let s = act(fresh(), { type: 'timer', op: 'start', stepId: 's1', baseSeconds: 60 });
    expect(findExpired(s, T0 + 59_000)).toEqual([]);
    expect(findExpired(s, T0 + 61_000)).toEqual(['s1']);
    s = sessionReducer(s, { type: 'expire', now: T0 + 61_000 });
    expect(s.timers.s1.status).toBe('done');
    s = act(s, { type: 'timer', op: 'ack', stepId: 's1' });
    expect(s.timers.s1.acked).toBe(true);
  });
  it('supports reset and add-time', () => {
    let s = act(fresh(), { type: 'timer', op: 'start', stepId: 's1', baseSeconds: 60 });
    s = act(s, { type: 'timer', op: 'add', stepId: 's1', ms: 60_000 });
    expect(getRemainingMs(s.timers.s1, T0)).toBe(120_000);
    s = act(s, { type: 'timer', op: 'reset', stepId: 's1' });
    expect(s.timers.s1.status).toBe('idle');
    expect(getRemainingMs(s.timers.s1, T0)).toBe(60_000);
  });
});

describe('pause and resume cooking', () => {
  it('pauses running timers and resumes the same ones', () => {
    let s = act(fresh(), { type: 'timer', op: 'start', stepId: 's1', baseSeconds: 300 });
    s = sessionReducer(s, { type: 'pause', now: T0 + 100_000 });
    expect(s.paused).toBe(true);
    expect(s.timers.s1.status).toBe('paused');
    s = sessionReducer(s, { type: 'resume', now: T0 + 400_000 });
    expect(s.paused).toBe(false);
    expect(s.timers.s1.status).toBe('running');
    expect(getRemainingMs(s.timers.s1, T0 + 400_000)).toBe(200_000);
  });
  it('does not resume a timer the user had paused themselves', () => {
    let s = act(fresh(), { type: 'timer', op: 'start', stepId: 's1', baseSeconds: 300 });
    s = act(s, { type: 'timer', op: 'pause', stepId: 's1' });
    s = act(act(s, { type: 'pause' }), { type: 'resume' });
    expect(s.timers.s1.status).toBe('paused');
  });
});

describe('restart and progress', () => {
  it('restart clears progress but keeps slug and servings', () => {
    const s = sessionReducer(act(fresh(), { type: 'complete', stepId: 's1' }), { type: 'restart', now: T0 + 5 });
    expect(hasProgress(s)).toBe(false);
    expect([s.slug, s.servings]).toEqual(['demo', 2]);
  });
  it('detects progress', () => {
    expect(hasProgress(fresh())).toBe(false);
    expect(hasProgress(act(fresh(), { type: 'next' }))).toBe(true);
    expect(hasProgress(null)).toBe(false);
  });
});

describe('normalizeSession (restoring saved data safely)', () => {
  it('round-trips through JSON', () => {
    let s = act(fresh(), { type: 'timer', op: 'start', stepId: 's2', baseSeconds: 90 });
    s = act(s, { type: 'complete', stepId: 's1' });
    const restored = normalizeSession(JSON.parse(JSON.stringify(s)), { slug: 'demo', stepIds });
    expect(restored).toEqual(s);
  });
  it('rejects other recipes, bad servings and junk', () => {
    expect(normalizeSession({ ...fresh(), slug: 'other' }, { slug: 'demo', stepIds })).toBe(null);
    expect(normalizeSession({ ...fresh(), servings: 99 }, { slug: 'demo', stepIds })).toBe(null);
    expect(normalizeSession('x', { slug: 'demo', stepIds })).toBe(null);
    expect(normalizeSession(null, { slug: 'demo', stepIds })).toBe(null);
  });
  it('clamps the step index and drops unknown steps and broken timers', () => {
    const raw = {
      ...fresh(), stepIndex: 99, completed: ['s1', 'gone'],
      timers: { s1: { status: 'running', baseMs: 1, remainingMs: 1, endsAt: 'bad' }, gone: { status: 'idle', baseMs: 1, remainingMs: 1 } },
    };
    const s = normalizeSession(raw, { slug: 'demo', stepIds });
    expect(s.stepIndex).toBe(2);
    expect(s.completed).toEqual(['s1']);
    expect(Object.keys(s.timers)).toEqual([]);
  });
});

import { summarizeSession, progressStatus, isStale, SESSION_FRESH_MS } from './cookingSession.js';

describe('resuming (summarizeSession, progressStatus, staleness)', () => {
  const base = { slug: 'demo', stepIndex: 2, completed: ['s1', 's2'], timers: {}, finished: false, updatedAt: T0 };
  it('summarizes sessions that have progress', () => {
    expect(summarizeSession(base, T0 + 1000)).toEqual({ slug: 'demo', stepIndex: 2, completed: 2, updatedAt: T0 });
  });
  it('returns null when there is nothing to resume', () => {
    expect(summarizeSession({ ...base, stepIndex: 0, completed: [] }, T0)).toBe(null);
    expect(summarizeSession({ ...base, finished: true }, T0)).toBe(null);
    expect(summarizeSession(null, T0)).toBe(null);
    expect(summarizeSession('junk', T0)).toBe(null);
    expect(summarizeSession({ stepIndex: 2 }, T0)).toBe(null);
  });
  it('counts a started timer as progress even on step one', () => {
    const withTimer = { ...base, stepIndex: 0, completed: [], timers: { s1: { status: 'running' } } };
    expect(summarizeSession(withTimer, T0) !== null).toBe(true);
  });
  it('ignores sessions older than the freshness window', () => {
    expect(summarizeSession(base, T0 + SESSION_FRESH_MS + 1)).toBe(null);
    expect(summarizeSession(base, T0 + SESSION_FRESH_MS - 1) !== null).toBe(true);
  });
  it('tolerates broken fields', () => {
    expect(summarizeSession({ slug: 'demo', stepIndex: -4, completed: 'x', timers: 5, updatedAt: 'now' }, T0)).toBe(null);
  });
  it('reports progress status', () => {
    const fresh = { ...fresh0(), updatedAt: T0 };
    expect(progressStatus(null, T0)).toBe('none');
    expect(progressStatus(fresh, T0)).toBe('none'); // nothing done yet
    const moved = act(fresh, { type: 'next' });
    expect(progressStatus(moved, T0)).toBe('in-progress');
    const finished = act(act(act(fresh, { type: 'complete', stepId: 's1' }), { type: 'complete', stepId: 's2' }), { type: 'complete', stepId: 's3' });
    expect(progressStatus(finished, T0)).toBe('finished');
    expect(progressStatus(moved, T0 + SESSION_FRESH_MS + 5)).toBe('none');
    expect(isStale(moved, T0 + SESSION_FRESH_MS + 5)).toBe(true);
  });
});
function fresh0() { return createSession({ slug: 'demo', servings: 2, now: T0 }); }
