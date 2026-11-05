import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../Button/Button';
import styles from './ErrorState.module.css';

/** Say what went wrong and how to fix it. Pass onRetry to show «تلاش دوباره». */
export default function ErrorState({
  title = 'مشکلی پیش آمد',
  message = 'لطفاً دوباره تلاش کن. اگه مشکل ادامه داشت، اینترنتت را بررسی کن.',
  onRetry,
  children,
}) {
  return (
    <div className={styles.error} role="alert">
      <span className={styles.badge} aria-hidden="true">
        <AlertTriangle size={32} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="secondary" iconStart={<RefreshCw size={18} aria-hidden="true" />} onClick={onRetry}>
          تلاش دوباره
        </Button>
      )}
      {children}
    </div>
  );
}
