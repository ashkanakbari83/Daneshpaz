import Skeleton from '@/components/common/Skeleton/Skeleton';

/** Shown while a lazy-loaded route chunk downloads. */
export default function PageLoader() {
  return (
    <div className="container page" role="status" aria-label="در حال بارگذاری">
      <Skeleton width="55%" height="1.75rem" />
      <div style={{ height: 'var(--space-3)' }} />
      <Skeleton shape="text" lines={4} />
      <div style={{ height: 'var(--space-3)' }} />
      <Skeleton height="6rem" />
    </div>
  );
}
