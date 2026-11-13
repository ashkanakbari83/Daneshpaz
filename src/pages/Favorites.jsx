import RecipeCard from '../components/RecipeCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useApp } from '../context/AppContext.jsx';
import { searchRecipes } from '../lib/domain/filters.js';
import { DEFAULT_FILTERS } from '../lib/domain/db.js';

export default function Favorites() {
  const { t, db } = useApp();
  const results = searchRecipes(db, { ...DEFAULT_FILTERS, favoritesOnly: true });
  return (
    <main className="page">
      <h1 className="page-title">{t('fav.title')}</h1>
      <div style={{ height: 'var(--sp-3)' }} />
      {results.length === 0 ? (
        <EmptyState
          emoji="🤍"
          title={t('fav.empty.title')}
          hint={t('fav.empty.hint')}
          action={<a className="btn btn-soft" href="#/">{t('fav.empty.cta')}</a>}
        />
      ) : (
        <ul className="list">
          {results.map(({ recipe, analysis }) => <RecipeCard key={recipe.id} recipe={recipe} analysis={analysis} />)}
        </ul>
      )}
    </main>
  );
}
