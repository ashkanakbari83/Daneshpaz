import { Link } from 'react-router-dom';
import { ArrowRight, Pause } from 'lucide-react';
import { formatNumber } from '@/utils/persian';
import styles from './CookingHeader.module.css';

export default function CookingHeader({ recipe, stepIndex, stepCount, completedCount, onPause }) {
  const percent = Math.round(((stepIndex + 1) / stepCount) * 100);
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        <Link to={`/recipe/${recipe.slug}`} className={styles.close} aria-label="بازگشت به دستور (پیشرفتت ذخیره می‌ماند)">
          <ArrowRight size={18} aria-hidden="true" />
          <span>دستور</span>
        </Link>
        <div className={styles.center}>
          <p className={styles.recipe}>{recipe.title}</p>
          <p className={styles.count}>مرحله‌ی {formatNumber(stepIndex + 1)} از {formatNumber(stepCount)}</p>
        </div>
        <button type="button" className={styles.pause} onClick={onPause}>
          <Pause size={16} aria-hidden="true" /> توقف
        </button>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="پیشرفت آشپزی"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${formatNumber(completedCount)} مرحله از ${formatNumber(stepCount)} انجام شده`}
      >
        <span className={styles.fill} style={{ inlineSize: `${percent}%` }} />
      </div>
    </header>
  );
}
