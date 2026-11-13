import EmptyState from '../components/EmptyState.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function NotFound() {
  const { t } = useApp();
  return (
    <main className="page">
      <EmptyState emoji="🧭" title={t('notFound.title')} action={<a className="btn btn-soft" href="#/">{t('notFound.cta')}</a>} />
    </main>
  );
}
