import Icon from './Icon.jsx';
import { useApp } from '../context/AppContext.jsx';
import { toggleFavorite } from '../lib/domain/pantry.js';

export default function RecipeCard({ recipe, analysis }) {
  const { t, db, act, fmt, name } = useApp();
  const fav = db.user.favorites.includes(recipe.id);
  const title = name(recipe.title);
  const missing = analysis.missingCount;
  return (
    <li className="rcard" data-testid="recipe-card">
      <a className="rcard-main" href={`#/recipe/${encodeURIComponent(recipe.id)}`}>
        <span className="tile" aria-hidden="true">{recipe.emoji}</span>
        <span className="rcard-body">
          <span className="rcard-title ellipsis">{title}</span>
          <span className="rcard-meta">
            <span className="fact"><Icon name="clock" />{fmt.duration(recipe.minutes)}</span>
            <span className="sep" aria-hidden="true">·</span>
            <span className="ellipsis">{t(`diff.${recipe.difficulty}`)}</span>
          </span>
          <span className="rcard-foot">
            <span className="ellipsis muted">{t('card.perServing', { price: fmt.toman(analysis.costPerServing) })}</span>
            {missing === 0
              ? <span className="badge ok">{t('card.allHave')}</span>
              : <span className="badge wait">{t('card.missing', { n: fmt.num(missing) })}</span>}
          </span>
        </span>
      </a>
      <button
        className="icon-btn heart"
        aria-pressed={fav}
        aria-label={t(fav ? 'card.fav.remove' : 'card.fav.add', { title })}
        onClick={() => act(toggleFavorite, recipe.id)}
      >
        <Icon name="heart" fill={fav} />
      </button>
    </li>
  );
}
