import { Link } from 'react-router-dom';
import { Clock, Wallet } from 'lucide-react';
import Badge from '@/components/common/Badge/Badge';
import RecipeArt from './RecipeArt';
import FavoriteButton from './FavoriteButton';
import { DIFFICULTY } from '@/constants/labels';
import { formatNumber, formatCurrencyCompact } from '@/utils';
import styles from './RecipeCard.module.css';

/** `cost` = consumed-ingredients cost at the default servings (sample prices). */
export default function RecipeCard({ recipe, cost }) {
  const difficulty = DIFFICULTY[recipe.difficulty];
  return (
    <article className={styles.card}>
      <Link to={`/recipe/${recipe.slug}`} className={styles.link}>
        <RecipeArt recipe={recipe} compact className={styles.art} />
        <div className={styles.body}>
          <h3 className={styles.title}>{recipe.title}</h3>
          <p className={styles.tags}>
            <Badge tone={difficulty.tone}>{difficulty.label}</Badge>
            <span>{formatNumber(recipe.defaultServings)} نفر</span>
          </p>
          <ul className={styles.meta}>
            <li>
              <Clock size={14} aria-hidden="true" />
              <span>آماده‌سازی {formatNumber(recipe.prepTime)} · پخت {formatNumber(recipe.cookTime)} دقیقه</span>
            </li>
            <li>
              <Wallet size={14} aria-hidden="true" />
              <span>
                {cost === null ? 'هزینه نامشخص' : `حدود ${formatCurrencyCompact(cost)}`}
                <span className={styles.sample}>(قیمت نمونه)</span>
              </span>
            </li>
          </ul>
        </div>
      </Link>
      <FavoriteButton slug={recipe.slug} title={recipe.title} className={styles.fav} />
    </article>
  );
}
