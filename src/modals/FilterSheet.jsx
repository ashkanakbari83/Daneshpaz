import { useEffect, useRef } from 'react';
import Icon from '../components/Icon.jsx';
import { useApp } from '../context/AppContext.jsx';
import { activeFilterCount, resetFilters, searchRecipes, setFilters } from '../lib/domain/filters.js';

const TIMES = [15, 30, 60];
const BUDGETS = [40000, 70000, 120000];

function Choice({ pressed, onClick, children }) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
      <span className="ellipsis">{children}</span>
    </button>
  );
}

export default function FilterSheet({ onClose }) {
  const { t, db, act, fmt } = useApp();
  const f = db.user.filters;
  const ref = useRef(null);
  const count = searchRecipes(db, f).length;

  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);

  const set = (patch) => act(setFilters, patch);
  const toggle = (key, value) => set({ [key]: f[key] === value ? null : value });

  return (
    <div className="sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="filter-title" ref={ref} tabIndex={-1}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2 id="filter-title">{t('filter.title')}</h2>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {activeFilterCount(f) > 0 ? <button className="btn-link" onClick={() => act(resetFilters)}>{t('filter.reset')}</button> : null}
            <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}><Icon name="close" /></button>
          </div>
        </div>

        <div className="group">
          <h3>{t('filter.time')}</h3>
          <div className="chips">
            <Choice pressed={!f.maxMinutes} onClick={() => set({ maxMinutes: null })}>{t('filter.any')}</Choice>
            {TIMES.map((m) => (
              <Choice key={m} pressed={f.maxMinutes === m} onClick={() => toggle('maxMinutes', m)}>{t('filter.time.upTo', { n: fmt.num(m) })}</Choice>
            ))}
          </div>
        </div>

        <div className="group">
          <h3>{t('filter.difficulty')}</h3>
          <div className="chips">
            <Choice pressed={!f.maxDifficulty} onClick={() => set({ maxDifficulty: null })}>{t('filter.any')}</Choice>
            {[1, 2].map((d) => (
              <Choice key={d} pressed={f.maxDifficulty === d} onClick={() => toggle('maxDifficulty', d)}>{t(`diff.${d}`)}</Choice>
            ))}
          </div>
        </div>

        <div className="group">
          <h3>{t('filter.budget')}</h3>
          <div className="chips">
            <Choice pressed={!f.maxCostPerServing} onClick={() => set({ maxCostPerServing: null })}>{t('filter.any')}</Choice>
            {BUDGETS.map((b) => (
              <Choice key={b} pressed={f.maxCostPerServing === b} onClick={() => toggle('maxCostPerServing', b)}>{t('filter.budget.upTo', { price: fmt.toman(b) })}</Choice>
            ))}
          </div>
        </div>

        <div className="group">
          <h3>{t('filter.ingredients')}</h3>
          <div className="chips">
            <Choice pressed={f.maxMissing === null} onClick={() => set({ maxMissing: null })}>{t('filter.any')}</Choice>
            <Choice pressed={f.maxMissing === 0} onClick={() => toggle('maxMissing', 0)}>{t('filter.missing.0')}</Choice>
            <Choice pressed={f.maxMissing === 2} onClick={() => toggle('maxMissing', 2)}>{t('filter.missing.2')}</Choice>
          </div>
        </div>

        <div className="group">
          <div className="chips">
            <Choice pressed={f.onlyMyEquipment} onClick={() => set({ onlyMyEquipment: !f.onlyMyEquipment })}>{t('filter.equipment')}</Choice>
          </div>
        </div>

        <div className="sheet-foot">
          <button className="btn btn-primary" onClick={onClose}>{t('filter.show', { n: fmt.num(count) })}</button>
        </div>
      </div>
    </div>
  );
}
