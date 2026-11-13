import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useApp } from '../context/AppContext.jsx';
import { togglePantry, toggleEquipment } from '../lib/domain/pantry.js';
import { INGREDIENT_CATEGORIES } from '../data/ingredients.js';
import { normalizeText } from '../lib/text.js';

export default function Pantry() {
  const { t, db, act, fmt, name } = useApp();
  const [q, setQ] = useState('');
  const nq = normalizeText(q);
  const have = new Set(db.user.pantry);
  const owned = new Set(db.user.equipment);

  const all = Object.values(db.ingredients);
  const shown = all.filter((i) => !nq || normalizeText(i.name.fa).includes(nq) || normalizeText(i.name.en).includes(nq));
  const groups = INGREDIENT_CATEGORIES
    .map((cat) => ({ cat, items: shown.filter((i) => i.category === cat).sort((a, b) => a.name.fa.localeCompare(b.name.fa, 'fa')) }))
    .filter((g) => g.items.length > 0);

  return (
    <main className="page">
      <h1 className="page-title">{t('pantry.title')}</h1>
      <p className="muted small" style={{ margin: 'var(--sp-1) 0 var(--sp-3)' }}>{t('pantry.hint')}</p>

      <h2 className="section-title">{t('pantry.equipment')}</h2>
      <div className="eq-grid">
        {Object.values(db.equipment).map((eq) => (
          <button
            key={eq.id}
            type="button"
            className="chip"
            role="switch"
            aria-checked={owned.has(eq.id)}
            onClick={() => act(toggleEquipment, eq.id)}
          >
            <span aria-hidden="true">{eq.emoji}</span>
            <span className="ellipsis">{name(eq.name)}</span>
            {owned.has(eq.id) ? <Icon name="check" /> : null}
          </button>
        ))}
      </div>

      <h2 className="section-title">
        {t('pantry.ingredients')}
        <span className="badge info">{t('pantry.have', { n: fmt.num(have.size) })}</span>
      </h2>
      <label className="search" style={{ marginBottom: 'var(--sp-3)' }}>
        <Icon name="search" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('pantry.search')} aria-label={t('pantry.search')} />
      </label>

      {groups.length === 0 ? (
        <EmptyState emoji="🧺" title={t('pantry.none')} />
      ) : (
        groups.map(({ cat, items }) => (
          <section key={cat}>
            <h3 className="muted small" style={{ margin: 'var(--sp-3) 0 var(--sp-2)', fontWeight: 600 }}>{t(`cat.${cat}`)}</h3>
            <div className="chips">
              {items.map((i) => (
                <button key={i.id} type="button" className="chip" role="switch" aria-checked={have.has(i.id)} onClick={() => act(togglePantry, i.id)}>
                  <span className="ellipsis">{name(i.name)}</span>
                  {have.has(i.id) ? <Icon name="check" /> : null}
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
