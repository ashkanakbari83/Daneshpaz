import { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { useHashRoute } from './hooks/useHashRoute.js';
import BottomNav from './components/BottomNav.jsx';
import Skeleton from './components/Skeleton.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Recipe = lazy(() => import('./pages/Recipe.jsx'));
const Cook = lazy(() => import('./pages/Cook.jsx'));
const Pantry = lazy(() => import('./pages/Pantry.jsx'));
const Favorites = lazy(() => import('./pages/Favorites.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function Shell() {
  const { db } = useApp();
  const nav = useHashRoute();
  const cookingNow = nav.name === 'cook' && Boolean(db.user.cooking);
  const showNav = ['home', 'pantry', 'favorites', 'cook'].includes(nav.name) && !cookingNow;

  let page;
  switch (nav.name) {
    case 'home': page = <Home />; break;
    case 'pantry': page = <Pantry />; break;
    case 'favorites': page = <Favorites />; break;
    case 'cook': page = <Cook nav={nav} />; break;
    case 'recipe': page = <Recipe key={nav.params.id} id={nav.params.id} nav={nav} />; break;
    default: page = <NotFound />;
  }

  return (
    <div className="app">
      <ErrorBoundary key={nav.path}>
        <Suspense fallback={<Skeleton />}>{page}</Suspense>
      </ErrorBoundary>
      {showNav ? <BottomNav current={nav.name} /> : null}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
