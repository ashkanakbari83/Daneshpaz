import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FilterSheet from '../modals/FilterSheet.jsx';
import { useApp } from '../context/AppContext.jsx';
import { activeFilterCount, resetFilters, searchRecipes, setFilters } from '../lib/domain/filters.js';

export default function Home() {
  const { t, db, act, fmt, name } = useApp();
  const [sheet, setSheet] = useState(false);
  const f = db.user.filters;
  // Home never narrows to favorites; that has its own tab.
  const results = searchRecipes(db, { ...f, favoritesOnly: false });
  const filterCount = activeFilterCount(f);
  const cooking = db.user.cooking;
  const cookingTitle = cooking ? db.recipes[cooking.recipeId]?.title : null;

  return (
    <main className="page">
      <div className="home-head">
        <h1 className="page-title">{t('home.title')}</h1>
      </div>

      {cookingTitle ? (
        <div className="resume">
          <Icon name="flame" />
          <span className="ellipsis">{t('home.resume', { title: name(cookingTitle) })}</span>
          <a className="btn-link" href="#/cook">{t('home.resume.cta')}</a>
        </div>
      ) : null}

      <div className="searchrow">
        <label className="search">
          <Icon name="search" />
          <input
            type="search"
            value={f.q}
            placeholder={t('home.search')}
            aria-label={t('home.search')}
            onChange={(e) => act(setFilters, { q: e.target.value })}
            enterKeyHint="search"
          />
          {f.q ? (
            <button type="button" className="icon-btn" style={{ width: 36, height: 36 }} aria-label={t('home.search.clear')} onClick={() => act(setFilters, { q: '' })}>
              <Icon name="close" />
            </button>
          ) : null}
        </label>
        <button type="button" className="filter-btn" aria-label={t('home.filters')} onClick={() => setSheet(true)}>
          <Icon name="filter" />
          {filterCount > 0 ? <span className="count">{fmt.num(filterCount)}</span> : null}
        </button>
      </div>

      <div className="meta-row">
        <span className="muted small" data-testid="recipe-count">{t('home.count', { n: fmt.num(results.length) })}</span>
        <span className="muted small ellipsis">{t('common.demoNote')}</span>
      </div>

      {results.length === 0 ? (
        <EmptyState
          emoji="🍽️"
          title={t('home.empty.title')}
          hint={t('home.empty.hint')}
          action={<button className="btn btn-soft" onClick={() => { act(resetFilters); act(setFilters, { q: '' }); }}>{t('home.empty.reset')}</button>}
        />
      ) : (
        <ul className="list">
          {results.map(({ recipe, analysis }) => <RecipeCard key={recipe.id} recipe={recipe} analysis={analysis} />)}
        </ul>
      )}

      {sheet ? <FilterSheet onClose={() => setSheet(false)} /> : null}
    </main>
  );
}
