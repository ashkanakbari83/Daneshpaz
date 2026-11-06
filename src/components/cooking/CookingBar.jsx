import { ChevronRight, ChevronLeft, Check, Lightbulb, LifeBuoy } from 'lucide-react';
import { formatNumber } from '@/utils/persian';
import styles from './CookingBar.module.css';

/** Thumb-zone controls. In RTL "previous" points right and "next" points left. */
export default function CookingBar({ isFirst, isLast, tipCount, onPrev, onNext, onDone, onTips, onProblems }) {
  return (
    <div className={styles.bar}>
      <div className={styles.helpers}>
        <button type="button" className={styles.helper} onClick={onTips}>
          <Lightbulb size={18} aria-hidden="true" /> نکات{tipCount > 0 && ` (${formatNumber(tipCount)})`}
        </button>
        <button type="button" className={styles.helper} onClick={onProblems}>
          <LifeBuoy size={18} aria-hidden="true" /> مشکلات رایج
        </button>
      </div>
      <div className={styles.main}>
        <button type="button" className={styles.nav} onClick={onPrev} disabled={isFirst} aria-label="مرحله قبل">
          <ChevronRight size={22} aria-hidden="true" />
          <span><span className={styles.long}>مرحله </span>قبل</span>
        </button>
        <button type="button" className={styles.done} onClick={onDone}>
          <Check size={24} aria-hidden="true" className={styles.checkIcon} /> {isLast ? 'پایان غذا' : 'انجام شد'}
        </button>
        <button type="button" className={styles.nav} onClick={onNext} disabled={isLast} aria-label="مرحله بعد">
          <span><span className={styles.long}>مرحله </span>بعد</span>
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
