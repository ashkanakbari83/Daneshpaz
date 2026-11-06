/**
 * Pure timer model based on an absolute end time, so it stays correct when the
 * tab is throttled, the user switches steps, or the page is reloaded.
 * timer = { status: idle|running|paused|done, baseMs, remainingMs, endsAt, acked }
 */
export function createTimer(seconds) {
  const baseMs = Math.max(0, Math.round(seconds * 1000));
  return { status: 'idle', baseMs, remainingMs: baseMs, endsAt: null, acked: false };
}

export function getRemainingMs(timer, now) {
  return timer.status === 'running' ? Math.max(0, timer.endsAt - now) : timer.remainingMs;
}

export function startTimer(timer, now) {
  if (timer.status === 'running') return timer;
  const remainingMs = timer.status === 'done' || timer.remainingMs <= 0 ? timer.baseMs : timer.remainingMs;
  return { ...timer, status: 'running', remainingMs, endsAt: now + remainingMs, acked: false };
}

export function pauseTimer(timer, now) {
  if (timer.status !== 'running') return timer;
  return { ...timer, status: 'paused', remainingMs: getRemainingMs(timer, now), endsAt: null };
}

export function resumeTimer(timer, now) {
  if (timer.status !== 'paused') return timer;
  return { ...timer, status: 'running', endsAt: now + timer.remainingMs };
}

export function resetTimer(timer) {
  return createTimer(timer.baseMs / 1000);
}

/** Add time (ms). A finished timer restarts with just the added time. */
export function addTime(timer, ms, now) {
  switch (timer.status) {
    case 'running':
      return { ...timer, endsAt: timer.endsAt + ms };
    case 'done':
      return { ...timer, status: 'running', remainingMs: ms, endsAt: now + ms, acked: false };
    default:
      return { ...timer, remainingMs: timer.remainingMs + ms };
  }
}

/** Turn a running timer whose time is up into `done`. */
export function expireTimer(timer, now) {
  if (timer.status === 'running' && timer.endsAt <= now) {
    return { ...timer, status: 'done', remainingMs: 0, endsAt: null, acked: false };
  }
  return timer;
}

/** 0..1 for progress bars. */
export function timerProgress(timer, now) {
  if (timer.baseMs <= 0) return 0;
  const used = timer.status === 'done' ? timer.baseMs : timer.baseMs - getRemainingMs(timer, now);
  return Math.min(1, Math.max(0, used / timer.baseMs));
}
