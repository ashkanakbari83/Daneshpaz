import { Play, Pause, RotateCcw, Plus } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import { createTimer, getRemainingMs, timerProgress } from '@/utils/timer';
import { formatClock } from '@/utils/time';
import { prepareAudio } from '@/utils/alarm';
import styles from './TimerPanel.module.css';

const STATUS_LABEL = { idle: 'آماده‌ی شروع', running: 'در حال شمارش', paused: 'متوقف شده', done: 'تمام شد' };

/** Timer for the current step. State lives in the cooking session, so it survives step changes. */
export default function TimerPanel({ step, timer, now, dispatch }) {
  const t = timer ?? createTimer(step.duration);
  const remaining = getRemainingMs(t, now);
  const send = (op, extra) => dispatch({ type: 'timer', op, stepId: step.id, baseSeconds: step.duration, ...extra });

  return (
    <section className={styles.panel} aria-labelledby="timer-title">
      <div className={styles.head}>
        <h2 id="timer-title" className={styles.title}>تایمر</h2>
        <span className={styles.status} data-status={t.status}>{STATUS_LABEL[t.status]}</span>
      </div>
      <p className={styles.clock} role="timer" aria-label="زمان باقی‌مانده">{formatClock(Math.ceil(remaining / 1000))}</p>
      <div className={styles.bar} aria-hidden="true"><span style={{ inlineSize: `${timerProgress(t, now) * 100}%` }} /></div>

      <div className={styles.actions}>
        {t.status === 'idle' && (
          <Button size="lg" fullWidth iconStart={<Play size={18} aria-hidden="true" />} onClick={() => { prepareAudio(); send('start'); }}>شروع تایمر</Button>
        )}
        {t.status === 'running' && (
          <Button size="lg" fullWidth variant="secondary" iconStart={<Pause size={18} aria-hidden="true" />} onClick={() => send('pause')}>توقف تایمر</Button>
        )}
        {t.status === 'paused' && (
          <Button size="lg" fullWidth iconStart={<Play size={18} aria-hidden="true" />} onClick={() => { prepareAudio(); send('resume'); }}>ادامه‌ی تایمر</Button>
        )}
        {t.status === 'done' && (
          <Button size="lg" fullWidth iconStart={<Play size={18} aria-hidden="true" />} onClick={() => { prepareAudio(); send('start'); }}>شروع دوباره</Button>
        )}
        <div className={styles.secondary}>
          <Button variant="ghost" size="sm" iconStart={<Plus size={16} aria-hidden="true" />} onClick={() => send('add', { ms: 60_000 })}>۱ دقیقه بیشتر</Button>
          {t.status !== 'idle' && (
            <Button variant="ghost" size="sm" iconStart={<RotateCcw size={16} aria-hidden="true" />} onClick={() => send('reset')}>از اول</Button>
          )}
        </div>
      </div>
    </section>
  );
}
