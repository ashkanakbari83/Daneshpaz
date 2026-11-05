import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import PlaceholderPage from '@/components/layout/PlaceholderPage';
import Button from '@/components/common/Button/Button';

export default function FavoritesPage() {
  return (
    <PlaceholderPage
      title="علاقه‌مندی‌ها"
      icon={Heart}
      description="دستورهایی که ذخیره کنی بدون نیاز به ثبت‌نام همین‌جا در همین مرورگر نگه داشته می‌شوند."
      action={<Button as={Link} to="/search" variant="secondary">جست‌وجوی غذا</Button>}
    />
  );
}
