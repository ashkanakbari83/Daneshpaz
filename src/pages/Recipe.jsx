import Icon from '../components/Icon.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useApp } from '../context/AppContext.jsx';
import { analyzeRecipe, setServings, MAX_SERVINGS, MIN_SERVINGS } from '../lib/domain/recipes.js';
import { togglePantry, toggleFavorite } from '../lib/domain/pantry.js';
import { startCooking } from '../lib/domain/cooking.js';

function IngredientRow({ line }) {
  const { t, act, fmt, name } = useApp();
  const ing = line.ingredient;
  const label = name(ing.name);
  return (
    <li>
      <button
        type="button"
        className={`ing-row ${line.have ? 'have' : 'need'}`}
        role="switch"
        aria-checked={line.have}
        aria-label={t(line.have ? 'recipe.row.markNeed' : 'recipe.row.markHave', { name: label })}
        onClick={() => act(togglePantry, ing.id)}
        data-testid="ingredient-row"
      >
        <span className="check"><Icon name="check" /></span>
        <span className="ing-text">
          <span className="name ellipsis">{label}</span>
          {!line.have ? (
            <span className="ing-sub ellipsis">
              {t('recipe.pack', { size: fmt.qty(ing.pack.size, ing.unit), price: fmt.toman(ing.pack.price) })}
            </span>
          ) : null}
        </span>
        <span className="amt">{fmt.qty(line.amount, ing.unit)}</span>
      </button>
    </li>
  );
}

export default function Recipe({ id, nav }) {
  const { t, db, act, fmt, name } = useApp();
  const a = analyzeRecipe(db, id);

  if (!a) {
    return (
      <main className="page">
        <EmptyState emoji="🔍" title={t('recipe.notFound')} action={<a className="btn btn-soft" href="#/">{t('notFound.cta')}</a>} />
      </main>
    );
  }

  const { recipe, servings } = a;
  const title = name(recipe.title);
  const fav = db.user.favorites.includes(recipe.id);
  const resuming = db.user.cooking?.recipeId === recipe.id;
  const nothingToBuy = a.needLines.length === 0;

  const start = () => {
    const res = act(startCooking, recipe.id, Date.now());
    if (res.ok) nav.go('/cook');
  };

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={nav.back} aria-label={t('common.back')}><Icon name="back" /></button>
        <span className="title ellipsis" />
        <button
          className="icon-btn heart"
          aria-pressed={fav}
          aria-label={t(fav ? 'recipe.fav.remove' : 'recipe.fav.add')}
          onClick={() => act(toggleFavorite, recipe.id)}
        >
          <Icon name="heart" fill={fav} />
        </button>
      </div>

      <main className="page no-nav" style={{ paddingTop: 0 }}>
        <div className="rhero">
          <span className="tile lg" aria-hidden="true">{recipe.emoji}</span>
          <div className="rhero-body">
            <h1>{title}</h1>
            <div className="facts">
              <span className="fact"><Icon name="clock" />{fmt.duration(recipe.minutes)}</span>
              <span className="fact"><Icon name="flame" />{t(`diff.${recipe.difficulty}`)}</span>
            </div>
          </div>
        </div>

        <section className="panel" style={{ marginTop: 'var(--sp-4)' }}>
          <div className="stepper">
            <span style={{ fontWeight: 700 }}>{t('recipe.servings')}</span>
            <div className="stepper-ctrl">
              <button type="button" aria-label={t('recipe.servings.inc')} disabled={servings >= MAX_SERVINGS} onClick={() => act(setServings, recipe.id, servings + 1)}>
                <Icon name="plus" />
              </button>
              <span className="stepper-val num" data-testid="servings-value" aria-live="polite">{t('recipe.servings.value', { n: fmt.num(servings) })}</span>
              <button type="button" aria-label={t('recipe.servings.dec')} disabled={servings <= MIN_SERVINGS} onClick={() => act(setServings, recipe.id, servings - 1)}>
                <Icon name="minus" />
              </button>
            </div>
          </div>

          <div className="costbox">
            <div className="cost used" data-testid="cost-used">
              <span className="k">{t('recipe.cost.used')}</span>
              <span className="v num">{fmt.toman(a.usedCost)}<small>{t('common.toman')}</small></span>
              <span className="h">{t('recipe.cost.usedHint')}</span>
            </div>
            <div className={`cost buy${nothingToBuy ? ' zero' : ''}`} data-testid="cost-buy">
              <span className="k">{t('recipe.cost.buy')}</span>
              <span className="v num">{fmt.toman(a.buyCost)}<small>{t('common.toman')}</small></span>
              <span className="h">{nothingToBuy ? t('recipe.cost.nothing') : t('recipe.cost.buyHint')}</span>
            </div>
          </div>
          {a.leftoverValue > 0 ? (
            <p className="leftover">{t('recipe.cost.leftover', { price: fmt.toman(a.leftoverValue) })}</p>
          ) : null}
        </section>

        {a.needLines.length > 0 ? (
          <>
            <h2 className="section-title"><span className="badge wait">{fmt.num(a.needLines.length)}</span>{t('recipe.need')}</h2>
            <ul className="ing">{a.needLines.map((l) => <IngredientRow key={l.ingredient.id} line={l} />)}</ul>
          </>
        ) : null}

        <h2 className="section-title">
          <span className="badge ok">{fmt.num(a.haveLines.length)}</span>{t('recipe.have')}
        </h2>
        {a.haveLines.length > 0 ? (
          <ul className="ing">{a.haveLines.map((l) => <IngredientRow key={l.ingredient.id} line={l} />)}</ul>
        ) : null}
        {nothingToBuy ? <p className="small" style={{ color: 'var(--ok)', marginTop: 'var(--sp-2)' }}>{t('recipe.allHave')}</p> : null}

        <h2 className="section-title">{t('recipe.equipment')}</h2>
        {a.equipment.length === 0 ? (
          <p className="muted small">{t('recipe.equipment.none')}</p>
        ) : (
          <div className="chips">
            {a.equipment.map(({ equipment, owned }) => (
              <span key={equipment.id} className={`chip${owned ? '' : ' warn'}`} style={{ cursor: 'default' }}>
                <span aria-hidden="true">{equipment.emoji}</span>
                <span className="ellipsis">{name(equipment.name)}</span>
                {!owned ? <span className="badge wait">{t('recipe.equipment.missing')}</span> : null}
              </span>
            ))}
          </div>
        )}

        <h2 className="section-title">{t('recipe.steps')}</h2>
        <ol className="steps-prev" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {recipe.steps.map((s, i) => (
            <li key={i}>
              <span>
                {s.text}
                {s.timerMin ? <span className="badge info" style={{ marginInlineStart: 6 }}>{t('recipe.timerNote', { n: fmt.num(s.timerMin) })}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      </main>

      <div className="cta">
        <button className="btn btn-primary" onClick={start} data-testid="start-cooking">
          <Icon name="play" fill />
          {t(resuming ? 'recipe.resume' : 'recipe.start')}
        </button>
      </div>
    </>
  );
}
