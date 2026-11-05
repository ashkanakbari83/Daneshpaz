import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import Button from '@/components/common/Button/Button';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('صفحه پیدا نشد');
  return (
    <div className="container page">
      <EmptyState
        icon={SearchX}
        title="این صفحه پیدا نشد"
        description="آدرس را اشتباه وارد کرده‌ای یا صفحه جابه‌جا شده است."
        action={<Button as={Link} to="/">برگشت به خانه</Button>}
      />
    </div>
  );
}
