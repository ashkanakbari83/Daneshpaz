import Skeleton from '@/components/common/Skeleton/Skeleton';
import styles from './RecipeGrid.module.css';

export default function RecipeGridSkeleton({ count = 4 }) {
  return (
    <ul className={styles.grid} role="status" aria-label="در حال بارگذاری">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <Skeleton height="6.25rem" />
        </li>
      ))}
    </ul>
  );
}
