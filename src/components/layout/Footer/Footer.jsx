import { Link } from 'react-router-dom';
import { LogoMark } from '../Logo/Logo';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.row}>
          <LogoMark size={22} />
          <p className={styles.slogan}>آشپزی کن، حتی اگه بلد نیستی!</p>
        </div>
        <Link to="/admin/login" className={styles.link}>ورود مدیر</Link>
      </div>
    </footer>
  );
}
