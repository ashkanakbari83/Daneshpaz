import Skeleton from '@/components/common/Skeleton/Skeleton';

/** Shown while a lazy-loaded route chunk downloads. */
export default function PageLoader() {
  return (
    <div className="container page" role="status" aria-label="در حال بارگذاری">
      <Skeleton width="55%" height="2.5rem" />
      <div style={{ height: 'var(--space-5)' }} />
      <Skeleton shape="text" lines={4} />
      <div style={{ height: 'var(--space-5)' }} />
      <Skeleton height="9rem" />
    </div>
  );
}
