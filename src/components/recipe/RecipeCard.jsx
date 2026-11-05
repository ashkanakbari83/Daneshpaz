import { Link } from 'react-router-dom';
import { Clock, Flame, Wallet } from 'lucide-react';
import Badge from '@/components/common/Badge/Badge';
import RecipeArt from './RecipeArt';
import FavoriteButton from './FavoriteButton';
import { DIFFICULTY } from '@/constants/labels';
import { formatDuration, formatNumber, formatCurrencyCompact } from '@/utils';
import styles from './RecipeCard.module.css';

/** `cost` = consumed-ingredients cost at the default servings (sample prices). */
export default function RecipeCard({ recipe, cost }) {
  const difficulty = DIFFICULTY[recipe.difficulty];
  return (
    <article className={styles.card}>
      <Link to={`/recipe/${recipe.slug}`} className={styles.link}>
        <RecipeArt recipe={recipe} />
        <div className={styles.body}>
          <h3 className={styles.title}>{recipe.title}</h3>
          <Badge tone={difficulty.tone}>{difficulty.label}</Badge>
          <ul className={styles.meta}>
            <li><Clock size={16} aria-hidden="true" /> آماده‌سازی {formatDuration(recipe.prepTime)}</li>
            <li><Flame size={16} aria-hidden="true" /> پخت {formatDuration(recipe.cookTime)}</li>
            <li>
              <Wallet size={16} aria-hidden="true" />
              {cost === null ? 'هزینه نامشخص' : `حدود ${formatCurrencyCompact(cost)}`} برای {formatNumber(recipe.defaultServings)} نفر
              <span className={styles.sample}> (قیمت نمونه)</span>
            </li>
          </ul>
        </div>
      </Link>
      <FavoriteButton slug={recipe.slug} title={recipe.title} className={styles.fav} />
    </article>
  );
}
