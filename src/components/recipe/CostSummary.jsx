import { Info } from 'lucide-react';
import Badge from '@/components/common/Badge/Badge';
import { PRICE_STATUS } from '@/constants/labels';
import { formatCurrency, formatDate, formatNumber } from '@/utils';
import styles from './CostSummary.module.css';

/** Always shows two numbers: what the recipe uses, and what you must buy. */
export default function CostSummary({ cost, servings }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        <div className={styles.stat}>
          <span className={styles.label}>هزینه‌ی مواد مصرف‌شده</span>
          <strong className={styles.value}>{formatCurrency(cost.consumedTotal)}</strong>
          <span className={styles.hint}>سهم مواد این غذا برای {formatNumber(servings)} نفر</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>هزینه‌ی خرید</span>
          <strong className={styles.value}>{formatCurrency(cost.purchaseTotal)}</strong>
          <span className={styles.hint}>بسته‌های کامل مواد، بدون چیزهایی که در خانه داری</span>
        </div>
      </div>
      <p className={styles.note}>
        <Info size={18} aria-hidden="true" />
        <span>
          <Badge tone="accent">{PRICE_STATUS[cost.priceStatus]}</Badge>{' '}
          قیمت‌ها فقط نمونه‌اند و قیمت واقعی بازار نیستند.
          {cost.pricesUpdatedAt && ` تاریخ ثبت: ${formatDate(cost.pricesUpdatedAt)}.`}
          {cost.unknownCount > 0 && ` برای ${formatNumber(cost.unknownCount)} ماده قیمت نداریم و در جمع نیامده است.`}
          {' '}مواد اختیاری در جمع نیستند.
        </span>
      </p>
    </div>
  );
}
