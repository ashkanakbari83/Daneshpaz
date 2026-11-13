import { useApp } from '../context/AppContext.jsx';

export default function Skeleton({ rows = 5 }) {
  const { t } = useApp();
  return (
    <div className="page" role="status" aria-label={t('common.loading')}>
      <div className="skeleton">
        {Array.from({ length: rows }, (_, i) => <i key={i} />)}
      </div>
    </div>
  );
}
