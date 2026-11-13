import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useNow } from '../hooks/useNow.js';
import { analyzeRecipe } from '../lib/domain/recipes.js';
import { abandonCooking, cancelTimer, cookingProgress, finishCooking, goToStep, nextStep, prevStep, startTimer, timerState } from '../lib/domain/cooking.js';
import { formatClock } from '../lib/format.js';

function Timer({ step, index }) {
  const { t, db, act, locale } = useApp();
  const running = Object.values(db.user.cooking.timers).some((x) => x.endsAt > Date.now());
  const now = useNow(running);
  const st = timerState(db, index, now);
  const firedRef = useRef(new Set());

  useEffect(() => {
    const key = `${db.user.cooking.recipeId}:${index}:${db.user.cooking.timers[index]?.endsAt}`;
    if (st.status === 'done' && !firedRef.current.has(key)) {
      firedRef.current.add(key);
      try { navigator.vibrate?.([250, 120, 250]); } catch { /* not supported */ }
    }
  });

  if (st.status === 'idle') {
    return (
      <div className="timer">
        <span className="small muted">{t('recipe.timerNote', { n: step.timerMin })}</span>
        <button className="btn btn-primary" onClick={() => act(startTimer, index, Date.now())} data-testid="timer-start">
          <Icon name="timer" />
          {t('cook.timer.start', { n: new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(step.timerMin) })}
        </button>
      </div>
    );
  }
  return (
    <div className={`timer ${st.status}`} role="timer" aria-live="off" data-testid="timer">
      <div>
        <div className="clock num">{formatClock(st.remainingMs, locale)}</div>
        <div className="small" aria-live="polite">{st.status === 'done' ? t('cook.timer.done') : t('cook.timer.running')}</div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
        {st.status === 'done' ? (
          <button className="btn btn-soft" onClick={() => act(startTimer, index, Date.now())}>{t('cook.timer.restart')}</button>
        ) : null}
        <button className="btn btn-soft" onClick={() => act(cancelTimer, index)}>
          <Icon name="stop" />
          {t('cook.timer.cancel')}
        </button>
      </div>
    </div>
  );
}

export default function Cook({ nav }) {
  const { t, db, act, fmt, name } = useApp();
  const [done, setDone] = useState(null);
  const cooking = db.user.cooking;

  if (done) {
    return (
      <main className="page">
        <div className="done-screen" role="status">
          <div className="big" aria-hidden="true">🍽️</div>
          <h1 className="page-title">{t('cook.done.title')}</h1>
          <p className="muted">{t('cook.done.hint', { title: done })}</p>
          <button className="btn btn-primary" onClick={() => nav.replace('/')}>{t('cook.done.cta')}</button>
        </div>
      </main>
    );
  }

  const recipe = cooking ? db.recipes[cooking.recipeId] : null;
  if (!cooking || !recipe) {
    return (
      <main className="page">
        <h1 className="page-title">{t('cook.title')}</h1>
        <EmptyState
          emoji="👩‍🍳"
          title={t('cook.empty.title')}
          hint={t('cook.empty.hint')}
          action={<a className="btn btn-soft" href="#/">{t('cook.empty.cta')}</a>}
        />
      </main>
    );
  }

  const progress = cookingProgress(db);
  const step = recipe.steps[cooking.step];
  const a = analyzeRecipe(db, recipe.id, cooking.servings);
  const title = name(recipe.title);

  const finish = () => {
    const res = act(finishCooking, Date.now());
    if (res.ok) setDone(title);
  };
  const leave = () => {
    act(abandonCooking);
    nav.replace('/');
  };

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={() => nav.go(`/recipe/${encodeURIComponent(recipe.id)}`)} aria-label={t('common.back')}><Icon name="back" /></button>
        <span className="title ellipsis">{title}</span>
        <button className="btn-link" onClick={leave}>{t('cook.abandon')}</button>
      </div>

      <main className="page no-nav" style={{ paddingTop: 'var(--sp-1)' }}>
        <div className="cook-head">
          <span className="small muted" data-testid="step-counter">{t('cook.step', { n: fmt.num(cooking.step + 1), total: fmt.num(progress.total) })}</span>
        </div>
        <div className="progress" role="progressbar" aria-label={t('cook.progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}>
          <i style={{ width: `${progress.percent}%` }} />
        </div>

        <section className="stepcard" aria-live="polite">
          <span className="label">{t('cook.stepLabel', { n: fmt.num(cooking.step + 1) })}</span>
          <p className="text" data-testid="step-text">{step.text}</p>
          {step.timerMin ? <Timer step={step} index={cooking.step} /> : null}
        </section>

        <div className="dots">
          {recipe.steps.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i < cooking.step ? 'done' : ''}
              aria-current={i === cooking.step ? 'step' : undefined}
              aria-label={t('cook.goTo', { n: fmt.num(i + 1) })}
              onClick={() => act(goToStep, i)}
            >
              <i />
            </button>
          ))}
        </div>

        <details className="mini">
          <summary><Icon name="chevron" />{t('cook.ingredients')}</summary>
          <ul className="mini-list">
            {a.lines.map((l) => (
              <li key={l.ingredient.id}><span className="ellipsis">{name(l.ingredient.name)}</span><span className="num">{fmt.qty(l.amount, l.ingredient.unit)}</span></li>
            ))}
          </ul>
        </details>
      </main>

      <div className="cook-bar">
        <div className="cook-bar-inner">
          <button className="btn btn-soft" disabled={cooking.step === 0} onClick={() => act(prevStep)}>{t('cook.prev')}</button>
          {progress.isLast
            ? <button className="btn btn-primary" onClick={finish} data-testid="finish">{t('cook.finish')}</button>
            : <button className="btn btn-primary" onClick={() => act(nextStep)} data-testid="next-step">{t('cook.next')}</button>}
        </div>
      </div>
    </>
  );
}
