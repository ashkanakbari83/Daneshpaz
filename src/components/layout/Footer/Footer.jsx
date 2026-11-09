import { Link } from 'react-router-dom';
import { LogoMark } from '../Logo/Logo';
import { OPEN_WHATS_NEW_EVENT } from '@/store/releaseStore';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.row}>
          <LogoMark size={22} />
          <p className={styles.slogan}>آشپزی کن، حتی اگه بلد نیستی!</p>
        </div>
        <div className={styles.links}>
          <button type="button" className={styles.link} onClick={() => window.dispatchEvent(new Event(OPEN_WHATS_NEW_EVENT))}>تازه‌ها</button>
          <Link to="/admin/login" className={styles.link}>ورود مدیر</Link>
        </div>
      </div>
    </footer>
  );
}
