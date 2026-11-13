import { Outlet, ScrollRestoration } from 'react-router-dom';
import Header from '../Header/Header';
import AppStatus from '../AppStatus/AppStatus';
import BottomNav from '../BottomNav/BottomNav';
import Footer from '../Footer/Footer';
import WhatsNew from '../WhatsNew/WhatsNew';
import styles from './AppShell.module.css';

/** Public layout: header, page content, footer and the fixed mobile bottom bar. */
export default function AppShell() {
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>پرش به محتوای اصلی</a>
      <Header />
      <AppStatus />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <WhatsNew />
      <ScrollRestoration />
    </div>
  );
}
