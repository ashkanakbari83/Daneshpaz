import {
  createTimer, startTimer, pauseTimer, resumeTimer, resetTimer, addTime, expireTimer,
} from './timer.js';

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 12;
const TIMER_STATUSES = ['idle', 'running', 'paused', 'done'];

export function createSession({ slug, servings, now }) {
  return {
    slug, servings, stepIndex: 0, completed: [], timers: {},
    paused: false, pausedTimerIds: [], finished: false, startedAt: now, updatedAt: now,
  };
}

/** Has the cook done anything worth restoring? */
export function hasProgress(session) {
  return Boolean(session) && (session.stepIndex > 0 || session.completed.length > 0 || Object.keys(session.timers).length > 0 || session.finished);
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Validate a session read from storage (it may be old, edited or corrupt).
 * Returns a safe session or null.
 */
export function normalizeSession(raw, { slug, stepIds }) {
  if (!raw || typeof raw !== 'object' || raw.slug !== slug) return null;
  if (!Number.isInteger(raw.servings) || raw.servings < MIN_SERVINGS || raw.servings > MAX_SERVINGS) return null;
  const known = new Set(stepIds);
  const timers = {};
  for (const [id, t] of Object.entries(raw.timers && typeof raw.timers === 'object' ? raw.timers : {})) {
    if (!known.has(id) || !t || !TIMER_STATUSES.includes(t.status) || !isNum(t.baseMs) || !isNum(t.remainingMs)) continue;
    if (t.status === 'running' && !isNum(t.endsAt)) continue;
    timers[id] = { status: t.status, baseMs: t.baseMs, remainingMs: t.remainingMs, endsAt: t.status === 'running' ? t.endsAt : null, acked: Boolean(t.acked) };
  }
  const maxIndex = Math.max(0, stepIds.length - 1);
  return {
    slug,
    servings: raw.servings,
    stepIndex: Number.isInteger(raw.stepIndex) ? Math.min(maxIndex, Math.max(0, raw.stepIndex)) : 0,
    completed: Array.isArray(raw.completed) ? [...new Set(raw.completed.filter((id) => known.has(id)))] : [],
    timers,
    paused: Boolean(raw.paused),
    pausedTimerIds: Array.isArray(raw.pausedTimerIds) ? raw.pausedTimerIds.filter((id) => timers[id]) : [],
    finished: Boolean(raw.finished),
    startedAt: isNum(raw.startedAt) ? raw.startedAt : 0,
    updatedAt: isNum(raw.updatedAt) ? raw.updatedAt : 0,
  };
}

const touch = (session, now, patch) => ({ ...session, ...patch, updatedAt: now });
const mapTimers = (timers, fn) => Object.fromEntries(Object.entries(timers).map(([id, t]) => [id, fn(t, id)]));

/** Actions all carry `now` (ms). Navigation actions carry `stepCount`. */
export function sessionReducer(session, action) {
  const { now } = action;
  switch (action.type) {
    case 'goto':
      return touch(session, now, { stepIndex: Math.min(action.stepCount - 1, Math.max(0, action.index)), finished: false });
    case 'next':
      return session.stepIndex < action.stepCount - 1 ? touch(session, now, { stepIndex: session.stepIndex + 1 }) : session;
    case 'prev':
      return touch(session, now, { stepIndex: Math.max(0, session.stepIndex - 1), finished: false });
    case 'complete': {
      const completed = session.completed.includes(action.stepId) ? session.completed : [...session.completed, action.stepId];
      const last = session.stepIndex >= action.stepCount - 1;
      return touch(session, now, { completed, stepIndex: last ? session.stepIndex : session.stepIndex + 1, finished: last });
    }
    case 'timer': {
      const current = session.timers[action.stepId] ?? createTimer(action.baseSeconds ?? 0);
      const ops = {
        start: () => startTimer(current, now),
        pause: () => pauseTimer(current, now),
        resume: () => resumeTimer(current, now),
        reset: () => resetTimer(current),
        add: () => addTime(current, action.ms, now),
        ack: () => ({ ...current, acked: true }),
      };
      const next = ops[action.op]?.() ?? current;
      return touch(session, now, { timers: { ...session.timers, [action.stepId]: next } });
    }
    case 'expire': {
      const timers = mapTimers(session.timers, (t) => expireTimer(t, now));
      return touch(session, now, { timers });
    }
    case 'pause': {
      if (session.paused) return session;
      const running = Object.entries(session.timers).filter(([, t]) => t.status === 'running').map(([id]) => id);
      return touch(session, now, {
        paused: true,
        pausedTimerIds: running,
        timers: mapTimers(session.timers, (t, id) => (running.includes(id) ? pauseTimer(t, now) : t)),
      });
    }
    case 'resume': {
      if (!session.paused) return session;
      return touch(session, now, {
        paused: false,
        pausedTimerIds: [],
        timers: mapTimers(session.timers, (t, id) => (session.pausedTimerIds.includes(id) ? resumeTimer(t, now) : t)),
      });
    }
    case 'restart':
      return createSession({ slug: session.slug, servings: session.servings, now });
    default:
      return session;
  }
}

/** Step ids whose running timer has reached zero. */
export function findExpired(session, now) {
  return Object.entries(session.timers)
    .filter(([, t]) => t.status === 'running' && t.endsAt <= now)
    .map(([id]) => id);
}

export const hasRunningTimers = (session) => Object.values(session.timers).some((t) => t.status === 'running');
