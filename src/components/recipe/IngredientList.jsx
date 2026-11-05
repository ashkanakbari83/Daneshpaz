import Badge from '@/components/common/Badge/Badge';
import { formatIngredientAmount, formatCurrencyCompact, formatNumber } from '@/utils';
import styles from './IngredientList.module.css';

function Row({ line, onToggle }) {
  const { ingredient, quantity, unit, optional, estimate, atHome, unknown, consumedCost } = line;
  return (
    <li>
      <label className={styles.row}>
        <input
          type="checkbox"
          className={styles.check}
          checked={atHome}
          onChange={() => onToggle(ingredient.id)}
          aria-label={`${ingredient.name} را در خانه دارم`}
        />
        <span className={styles.main}>
          <span className={styles.name}>{ingredient.name}</span>
          <span className={styles.amount}>{formatIngredientAmount(quantity, unit)}</span>
          <span className={styles.badges}>
            {optional && <Badge>اختیاری</Badge>}
            {estimate && <Badge tone="accent">تقریبی؛ با چشم تنظیم کن</Badge>}
          </span>
        </span>
        <span className={styles.price}>{unknown ? 'قیمت نامشخص' : `≈ ${formatCurrencyCompact(consumedCost)}`}</span>
      </label>
    </li>
  );
}

/** Splits lines into «باید بخری» and «از قبل داری». Ticking a box moves the item. */
export default function IngredientList({ lines, onToggleAtHome }) {
  const toBuy = lines.filter((l) => !l.atHome);
  const have = lines.filter((l) => l.atHome);
  return (
    <div className={styles.wrap}>
      <section aria-labelledby="to-buy">
        <h3 id="to-buy" className={styles.heading}>باید بخری <Badge tone="terracotta">{formatNumber(toBuy.length)}</Badge></h3>
        {toBuy.length ? (
          <ul className={styles.list}>{toBuy.map((l) => <Row key={l.ingredient.id} line={l} onToggle={onToggleAtHome} />)}</ul>
        ) : (
          <p className={styles.empty}>همه‌ی مواد را در خانه داری.</p>
        )}
      </section>
      <section aria-labelledby="have-home">
        <h3 id="have-home" className={styles.heading}>از قبل داری <Badge tone="success">{formatNumber(have.length)}</Badge></h3>
        {have.length ? (
          <ul className={styles.list}>{have.map((l) => <Row key={l.ingredient.id} line={l} onToggle={onToggleAtHome} />)}</ul>
        ) : (
          <p className={styles.empty}>ماده‌ای را که در خانه داری تیک بزن تا از هزینه‌ی خرید کم شود.</p>
        )}
      </section>
    </div>
  );
}
