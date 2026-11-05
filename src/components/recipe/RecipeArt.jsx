import { cx } from '@/utils/classNames';
import { visualFor } from './categoryVisuals';
import styles from './RecipeArt.module.css';

/** Placeholder illustration until real food photos exist (admin media, Phase 5). */
export default function RecipeArt({ recipe, className }) {
  const { icon: Icon, tone } = visualFor(recipe);
  return (
    <div className={cx(styles.art, styles[tone], className)} aria-hidden="true">
      <Icon size={56} strokeWidth={1.5} />
      <span className={styles.tag}>تصویر نمونه</span>
    </div>
  );
}
