import { Link } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import PlaceholderPage from '@/components/layout/PlaceholderPage';
import Button from '@/components/common/Button/Button';

export default function HelpPage() {
  return (
    <PlaceholderPage
      title="راهنمای آشپزی"
      icon={LifeBuoy}
      description="جواب مشکل‌های رایج مثل برنج شفته یا غذای شور اینجا جمع می‌شود."
      action={<Button as={Link} to="/" variant="secondary">برگشت به خانه</Button>}
    />
  );
}
