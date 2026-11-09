import { useEffect, useState } from 'react';
import BottomSheet from '@/components/common/BottomSheet/BottomSheet';
import Button from '@/components/common/Button/Button';
import OptionGroup from '@/components/common/OptionGroup/OptionGroup';
import {
  COST_OPTIONS, PREP_OPTIONS, COOK_OPTIONS, TOTAL_OPTIONS, INGREDIENT_COUNT_OPTIONS,
  SERVING_OPTIONS, MEAL_TYPES, DIFFICULTY, EQUIPMENT,
} from '@/constants/labels';
import { DEFAULT_FILTERS } from '@/utils/filters';
import styles from './FilterSheet.module.css';

const toOptions = (map, pick = (v) => v) => Object.entries(map).map(([value, v]) => ({ value, label: pick(v) }));

/** Edits a draft copy; nothing changes until «اعمال فیلترها». */
export default function FilterSheet({ open, onClose, filters, onApply, ingredients }) {
  const [draft, setDraft] = useState(filters);
  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="فیلترها"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => setDraft({ ...DEFAULT_FILTERS, q: draft.q, sort: draft.sort })}>
            پاک کردن همه
          </Button>
          <Button onClick={() => onApply(draft)}>اعمال فیلترها</Button>
        </div>
      }
    >
      <div className={styles.stack}>
        <div>
          <OptionGroup legend="مواد موجود در خانه" multiple value={draft.have} onChange={set('have')}
            options={ingredients.map((i) => ({ value: i.id, label: i.name }))} />
          <p className={styles.hint}>نمک، روغن و ادویه‌های پایه (فلفل، زردچوبه) و شکر همیشه موجود حساب می‌شوند.</p>
        </div>
        <OptionGroup legend="نوع وعده" multiple value={draft.meal} onChange={set('meal')} options={toOptions(MEAL_TYPES)} />
        <OptionGroup legend="سطح سختی" multiple value={draft.diff} onChange={set('diff')} options={toOptions(DIFFICULTY, (d) => d.label)} />
        <OptionGroup legend="هزینه‌ی تقریبی (قیمت نمونه)" value={draft.cost} onChange={set('cost')} options={COST_OPTIONS} />
        <OptionGroup legend="زمان آماده‌سازی" value={draft.prep} onChange={set('prep')} options={PREP_OPTIONS} />
        <OptionGroup legend="زمان پخت" value={draft.cook} onChange={set('cook')} options={COOK_OPTIONS} />
        <OptionGroup legend="کل زمان" value={draft.total} onChange={set('total')} options={TOTAL_OPTIONS} />
        <OptionGroup legend="تعداد مواد" value={draft.ing} onChange={set('ing')} options={INGREDIENT_COUNT_OPTIONS} />
        <OptionGroup legend="تعداد نفرات" value={draft.serv} onChange={set('serv')} options={SERVING_OPTIONS} />
        <OptionGroup legend="وسایل موجود (فقط غذاهایی که با این‌ها می‌شود)" multiple value={draft.equip} onChange={set('equip')} options={toOptions(EQUIPMENT)} />
      </div>
    </BottomSheet>
  );
}
