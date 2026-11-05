import { useState } from 'react';
import { Heart, Search, ChefHat } from 'lucide-react';
import {
  Button, Input, Card, Badge, BottomSheet, Skeleton, EmptyState, ErrorState, useToast,
} from '@/components/common';
import {
  formatNumber, formatCurrency, formatCurrencyCompact, formatIngredientAmount, formatDuration, formatClock,
} from '@/utils';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './DesignSystemPage.module.css';

const COLORS = [
  ['پس‌زمینه', '--color-bg'],
  ['سبز اصلی', '--color-primary'],
  ['نارنجی', '--color-accent'],
  ['تراکوتا', '--color-terracotta'],
  ['متن', '--color-text'],
  ['سطح', '--color-surface'],
];

function Section({ title, children }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      {children}
    </section>
  );
}

/** Reviewer page for Phase 1: every shared component and formatter in one place. */
export default function DesignSystemPage() {
  usePageTitle('نمونه‌ی اجزای طراحی');
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="container page">
      <h1 className="page-title">نمونه‌ی اجزای طراحی</h1>

      <Section title="رنگ‌ها">
        <ul className={styles.swatches}>
          {COLORS.map(([name, variable]) => (
            <li key={variable} className={styles.swatch}>
              <span className={styles.chip} style={{ background: `var(${variable})` }} />
              <span>{name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="دکمه‌ها">
        <div className={styles.row}>
          <Button>اصلی</Button>
          <Button variant="accent">شروع آشپزی</Button>
          <Button variant="secondary">ثانویه</Button>
          <Button variant="ghost">ساده</Button>
          <Button variant="danger">حذف</Button>
          <Button loading>در حال ذخیره</Button>
          <Button disabled>غیرفعال</Button>
          <Button variant="secondary" iconStart={<Heart size={18} aria-hidden="true" />}>ذخیره</Button>
        </div>
      </Section>

      <Section title="فیلدها">
        <div className={styles.stack}>
          <Input label="نام غذا" placeholder="مثلاً املت گوجه" startIcon={<Search size={20} />} />
          <Input label="تعداد نفرات" hint="عددی بین ۱ تا ۱۰" inputMode="numeric" defaultValue="2" />
          <Input label="نام غذا" error="نام غذا را وارد کن." defaultValue="" />
        </div>
      </Section>

      <Section title="کارت و نشان">
        <Card>
          <div className={styles.row}>
            <Badge tone="primary">آسان</Badge>
            <Badge tone="accent">۲۰ دقیقه</Badge>
            <Badge tone="terracotta">تند</Badge>
            <Badge tone="success">موجود</Badge>
            <Badge tone="neutral">نمونه</Badge>
            <Badge tone="danger">نیاز به خرید</Badge>
          </div>
        </Card>
      </Section>

      <Section title="اعلان و برگه‌ی پایین">
        <div className={styles.row}>
          <Button variant="secondary" onClick={() => toast.success('دستور ذخیره شد.')}>اعلان موفق</Button>
          <Button variant="secondary" onClick={() => toast.error('ذخیره نشد. دوباره تلاش کن.')}>اعلان خطا</Button>
          <Button variant="secondary" onClick={() => toast.info('تایمر شروع شد.')}>اعلان اطلاع‌رسانی</Button>
          <Button onClick={() => setSheetOpen(true)}>باز کردن برگه</Button>
        </div>
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="فیلترها"
          footer={<Button fullWidth onClick={() => setSheetOpen(false)}>اعمال فیلتر</Button>}
        >
          <p>محتوای برگه اینجا قرار می‌گیرد. با کشیدن پشت‌زمینه یا کلید Esc بسته می‌شود.</p>
        </BottomSheet>
      </Section>

      <Section title="در حال بارگذاری">
        <Card>
          <Skeleton height="8rem" />
          <div style={{ height: 'var(--space-3)' }} />
          <Skeleton shape="text" lines={3} />
        </Card>
      </Section>

      <Section title="حالت خالی و خطا">
        <div className={styles.stack}>
          <Card padding="none"><EmptyState icon={ChefHat} title="هنوز چیزی ذخیره نکرده‌ای" description="روی قلب کنار هر دستور بزن تا اینجا ببینی‌اش." /></Card>
          <Card padding="none"><ErrorState onRetry={() => toast.info('دوباره تلاش شد.')} /></Card>
        </div>
      </Section>

      <Section title="قالب‌بندی فارسی">
        <Card>
          <dl className={styles.formats}>
            <dt>عدد</dt><dd>{formatNumber(1234567.5)}</dd>
            <dt>قیمت</dt><dd>{formatCurrency(85000)}</dd>
            <dt>قیمت کوتاه</dt><dd>{formatCurrencyCompact(85000)}</dd>
            <dt>مقدار ماده</dt><dd>{formatIngredientAmount(1.5, 'cup')}</dd>
            <dt>زمان</dt><dd>{formatDuration(80)}</dd>
            <dt>تایمر</dt><dd>{formatClock(330)}</dd>
          </dl>
        </Card>
      </Section>
    </div>
  );
}
