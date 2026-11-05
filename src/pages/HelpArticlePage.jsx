import { Link } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import PlaceholderPage from '@/components/layout/PlaceholderPage';
import Button from '@/components/common/Button/Button';

export default function HelpArticlePage() {
  return (
    <PlaceholderPage
      title="پاسخ مشکل آشپزی"
      icon={LifeBuoy}
      description="علت‌ها و راه‌حل قدم‌به‌قدم هر مشکل اینجا نمایش داده می‌شود."
      action={<Button as={Link} to="/help" variant="secondary">همه‌ی راهنماها</Button>}
    />
  );
}
