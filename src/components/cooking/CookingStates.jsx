import { Link } from 'react-router-dom';
import { Play, RotateCcw, PartyPopper, PauseCircle } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import { formatNumber } from '@/utils/persian';
import styles from './CookingStates.module.css';

/** Covers the screen while cooking is paused. Running timers are paused too. */
export function PauseScreen({ onResume, onRestart }) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div className={styles.box}>
        <span className={styles.icon} aria-hidden="true"><PauseCircle size={30} /></span>
        <h2 id="pause-title" className={styles.title}>آشپزی متوقف شد</h2>
        <p className={styles.text}>اگر چیزی روی حرارت است، اول اجاق را خاموش کن. تایمرهای فعال هم متوقف شده‌اند و با «ادامه» دوباره شروع می‌شوند.</p>
        <Button size="lg" fullWidth autoFocus iconStart={<Play size={20} aria-hidden="true" />} onClick={onResume}>ادامه</Button>
        <Button variant="ghost" iconStart={<RotateCcw size={18} aria-hidden="true" />} onClick={onRestart}>شروع دوباره از اول</Button>
      </div>
    </div>
  );
}

/** Shown after the last step. */
export function FinishScreen({ recipe, completedCount, stepCount, onBack, onRestart }) {
  return (
    <div className={styles.finish}>
      <span className={styles.icon} aria-hidden="true"><PartyPopper size={32} /></span>
      <h1 className={styles.title}>آفرین! غذایت آماده است</h1>
      <p className={styles.text}>
        {formatNumber(completedCount)} مرحله از {formatNumber(stepCount)} مرحله‌ی «{recipe.title}» را انجام دادی.
        قبل از سرو مطمئن شو اجاق خاموش است.
      </p>
      <Button as={Link} to={`/recipe/${recipe.slug}`} size="lg" fullWidth>بازگشت به دستور</Button>
      <Button variant="secondary" onClick={onBack}>برگشت به آخرین مرحله</Button>
      <Button variant="ghost" iconStart={<RotateCcw size={18} aria-hidden="true" />} onClick={onRestart}>پختن دوباره از اول</Button>
    </div>
  );
}
