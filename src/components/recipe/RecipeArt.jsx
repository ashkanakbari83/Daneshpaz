import { cx } from '@/utils/classNames';
import { visualFor } from './categoryVisuals';
import styles from './RecipeArt.module.css';

/** Placeholder illustration until real food photos exist (admin media, Phase 5). */
export default function RecipeArt({ recipe, className, compact = false }) {
  const { icon: Icon, tone } = visualFor(recipe);
  return (
    <div className={cx(styles.art, styles[tone], className)} aria-hidden="true">
      <Icon size={compact ? 32 : 44} strokeWidth={1.5} />
      <span className={styles.tag}>{compact ? 'نمونه' : 'تصویر نمونه'}</span>
    </div>
  );
}
