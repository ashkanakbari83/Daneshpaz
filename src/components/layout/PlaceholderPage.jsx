import { ChefHat } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState/EmptyState';
import { usePageTitle } from '@/hooks/usePageTitle';

/** Honest stand-in for screens that belong to a later phase. */
export default function PlaceholderPage({ title, icon = ChefHat, description, action, children }) {
  usePageTitle(title);
  return (
    <div className="container page">
      <h1 className="page-title">{title}</h1>
      <EmptyState icon={icon} title="این بخش به‌زودی آماده می‌شود" description={description} action={action} />
      {children}
    </div>
  );
}
