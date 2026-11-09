import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/components/common/Toast/Toast';
import { cx } from '@/utils/classNames';
import styles from './FavoriteButton.module.css';

export default function FavoriteButton({ slug, title, className }) {
  const { has, toggle } = useFavorites();
  const toast = useToast();
  const active = has(slug);

  const handleClick = () => {
    toggle(slug);
    toast.success(active ? 'از علاقه‌مندی‌ها حذف شد.' : 'به علاقه‌مندی‌ها اضافه شد.', { duration: 2200 });
  };

  return (
    <button
      type="button"
      className={cx(styles.button, active && styles.active, className)}
      aria-pressed={active}
      aria-label={active ? `حذف «${title}» از علاقه‌مندی‌ها` : `افزودن «${title}» به علاقه‌مندی‌ها`}
      onClick={handleClick}
    >
      <Heart size={20} aria-hidden="true" fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
