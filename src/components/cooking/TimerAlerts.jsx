import { BellRing, Timer } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import { getRemainingMs } from '@/utils/timer';
import { formatClock } from '@/utils/time';
import styles from './TimerAlerts.module.css';

/**
 * Finished timers (until dismissed) and running timers of other steps.
 * `steps` is the recipe's step list; tapping jumps to that step.
 */
export default function TimerAlerts({ session, steps, currentStepId, now, onGoto, onAck }) {
  const titleOf = (id) => steps.find((s) => s.id === id)?.title ?? '';
  const indexOf = (id) => steps.findIndex((s) => s.id === id);
  const entries = Object.entries(session.timers);
  const done = entries.filter(([, t]) => t.status === 'done' && !t.acked);
  const others = entries.filter(([id, t]) => id !== currentStepId && (t.status === 'running' || t.status === 'paused'));
  if (done.length === 0 && others.length === 0) return null;

  return (
    <div className={styles.wrap}>
      {done.map(([id]) => (
        <div key={id} className={styles.done} role="alert">
          <BellRing size={24} aria-hidden="true" />
          <p className={styles.text}>تایمر «{titleOf(id)}» تمام شد!</p>
          <Button size="sm" variant="secondary" onClick={() => { onAck(id); onGoto(indexOf(id)); }}>رفتن به مرحله</Button>
          <Button size="sm" variant="ghost" onClick={() => onAck(id)}>باشه</Button>
        </div>
      ))}
      {others.length > 0 && (
        <ul className={styles.chips} aria-label="تایمرهای دیگر مرحله‌ها">
          {others.map(([id, t]) => (
            <li key={id}>
              <button type="button" className={styles.chip} onClick={() => onGoto(indexOf(id))}>
                <Timer size={16} aria-hidden="true" />
                <span>{titleOf(id)}</span>
                <strong>{formatClock(Math.ceil(getRemainingMs(t, now) / 1000))}</strong>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
