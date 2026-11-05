import Badge from '@/components/common/Badge/Badge';
import { EQUIPMENT } from '@/constants/labels';
import styles from './EquipmentList.module.css';

export default function EquipmentList({ equipment }) {
  return (
    <ul className={styles.list}>
      {equipment.map(({ key, required }) => (
        <li key={key} className={styles.item}>
          <span>{EQUIPMENT[key] ?? key}</span>
          <Badge tone={required ? 'primary' : 'neutral'}>{required ? 'ضروری' : 'اختیاری'}</Badge>
        </li>
      ))}
    </ul>
  );
}
