import Icon from './Icon.jsx';
import { useApp } from '../context/AppContext.jsx';

const TABS = [
  { name: 'home', path: '/', icon: 'grid', label: 'nav.home' },
  { name: 'pantry', path: '/pantry', icon: 'basket', label: 'nav.pantry' },
  { name: 'cook', path: '/cook', icon: 'flame', label: 'nav.cook' },
  { name: 'favorites', path: '/favorites', icon: 'heart', label: 'nav.favorites' },
];

export default function BottomNav({ current }) {
  const { t, db } = useApp();
  const cooking = Boolean(db.user.cooking);
  return (
    <nav className="nav" aria-label={t('nav.label')}>
      <div className="nav-inner">
        {TABS.map((tab) => (
          <a key={tab.name} href={`#${tab.path}`} aria-current={current === tab.name ? 'page' : undefined}>
            <Icon name={tab.icon} />
            <span className="ellipsis">{t(tab.label)}</span>
            {tab.name === 'cook' && cooking ? <span className="dot" aria-hidden="true" /> : null}
          </a>
        ))}
      </div>
    </nav>
  );
}
