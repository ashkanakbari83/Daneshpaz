import { Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import PlaceholderPage from '@/components/layout/PlaceholderPage';
import Button from '@/components/common/Button/Button';

export default function RecipePage() {
  return (
    <PlaceholderPage
      title="دستور غذا"
      icon={UtensilsCrossed}
      description="مواد لازم، هزینه‌ی تقریبی و ماشین‌حساب تعداد نفرات اینجا نمایش داده می‌شود."
      action={<Button as={Link} to="/search" variant="secondary">جست‌وجوی غذا</Button>}
    />
  );
}
