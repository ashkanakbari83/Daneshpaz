import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SW_UPDATE_EVENT, applyUpdate, hasPendingUpdate } from '@/pwa/register';
import styles from './AppStatus.module.css';

/** Slim notices under the header: offline mode, and «a new version is ready». */
export default function AppStatus() {
  const online = useOnlineStatus();
  const [updateReady, setUpdateReady] = useState(hasPendingUpdate());

  useEffect(() => {
    const onReady = () => setUpdateReady(true);
    window.addEventListener(SW_UPDATE_EVENT, onReady);
    return () => window.removeEventListener(SW_UPDATE_EVENT, onReady);
  }, []);

  if (online && !updateReady) return null;
  return (
    <div className={styles.wrap} role="status">
      {!online && (
        <p className={styles.note}>
          <WifiOff size={16} aria-hidden="true" />
          <span>آفلاین هستی. دستورهایی که قبلاً باز کرده‌ای در دسترس‌اند؛ قیمت‌های تازه و ورود مدیر به اینترنت نیاز دارند.</span>
        </p>
      )}
      {updateReady && (
        <p className={styles.note}>
          <RefreshCw size={16} aria-hidden="true" />
          <span>نسخه‌ی جدید دانشپز آماده است.</span>
          <Button size="sm" variant="secondary" onClick={applyUpdate}>به‌روزرسانی</Button>
        </p>
      )}
    </div>
  );
}
