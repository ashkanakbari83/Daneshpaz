import { describe, it, expect } from 'vitest';
import {
  createTimer, startTimer, pauseTimer, resumeTimer, resetTimer, addTime, expireTimer, getRemainingMs, timerProgress,
} from './timer.js';

const T0 = 1_000_000;

describe('timer', () => {
  it('starts idle with the full duration', () => {
    const t = createTimer(300);
    expect(t.status).toBe('idle');
    expect(getRemainingMs(t, T0)).toBe(300_000);
  });
  it('counts down from an absolute end time', () => {
    const t = startTimer(createTimer(300), T0);
    expect(t.status).toBe('running');
    expect(getRemainingMs(t, T0 + 100_000)).toBe(200_000);
    expect(getRemainingMs(t, T0 + 999_999_999)).toBe(0);
  });
  it('pauses and resumes without losing time', () => {
    const running = startTimer(createTimer(300), T0);
    const paused = pauseTimer(running, T0 + 100_000);
    expect(paused.status).toBe('paused');
    expect(getRemainingMs(paused, T0 + 500_000)).toBe(200_000); // time passing while paused does not count
    const resumed = resumeTimer(paused, T0 + 500_000);
    expect(getRemainingMs(resumed, T0 + 600_000)).toBe(100_000);
  });
  it('expires only when the time is up', () => {
    const t = startTimer(createTimer(60), T0);
    expect(expireTimer(t, T0 + 59_000).status).toBe('running');
    const done = expireTimer(t, T0 + 60_000);
    expect(done.status).toBe('done');
    expect(getRemainingMs(done, T0 + 70_000)).toBe(0);
  });
  it('resets to the original duration', () => {
    const t = addTime(startTimer(createTimer(60), T0), 60_000, T0);
    const reset = resetTimer(t);
    expect(reset.status).toBe('idle');
    expect(getRemainingMs(reset, T0)).toBe(60_000);
  });
  it('adds time in every state', () => {
    expect(getRemainingMs(addTime(startTimer(createTimer(60), T0), 60_000, T0), T0)).toBe(120_000);
    expect(addTime(createTimer(60), 60_000, T0).remainingMs).toBe(120_000);
    const done = expireTimer(startTimer(createTimer(60), T0), T0 + 61_000);
    const again = addTime(done, 60_000, T0 + 61_000);
    expect(again.status).toBe('running');
    expect(getRemainingMs(again, T0 + 61_000)).toBe(60_000);
  });
  it('restarting a finished timer uses the base duration', () => {
    const done = expireTimer(startTimer(createTimer(60), T0), T0 + 61_000);
    expect(getRemainingMs(startTimer(done, T0 + 70_000), T0 + 70_000)).toBe(60_000);
  });
  it('reports progress', () => {
    const t = startTimer(createTimer(100), T0);
    expect(timerProgress(t, T0 + 25_000)).toBe(0.25);
    expect(timerProgress(createTimer(100), T0)).toBe(0);
  });
});
