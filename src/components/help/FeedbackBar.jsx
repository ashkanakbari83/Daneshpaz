import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import Button from '@/components/common/Button/Button';
import { useToast } from '@/components/common/Toast/Toast';
import { createLocalStore } from '@/store/localStore';
import styles from './FeedbackBar.module.css';

const feedbackStore = createLocalStore('daneshpaz:feedback', []);

/** Feedback is kept in this browser for now; sending it to admins arrives with the backend. */
export default function FeedbackBar({ slug }) {
  const toast = useToast();
  const [vote, setVote] = useState(null);

  const send = (type) => {
    feedbackStore.set([...feedbackStore.getSnapshot(), { slug, type, at: new Date().toISOString() }]);
    if (type !== 'report') setVote(type);
    toast.success(type === 'report' ? 'گزارشت ثبت شد. ممنون!' : 'ممنون از بازخوردت!', { duration: 2500 });
  };

  return (
    <div className={styles.bar}>
      <p className={styles.question}>این پاسخ به دردت خورد؟</p>
      <div className={styles.row}>
        <Button variant={vote === 'helpful' ? 'primary' : 'secondary'} aria-pressed={vote === 'helpful'} iconStart={<ThumbsUp size={18} aria-hidden="true" />} onClick={() => send('helpful')}>پاسخ مفید بود</Button>
        <Button variant={vote === 'not-helpful' ? 'primary' : 'secondary'} aria-pressed={vote === 'not-helpful'} iconStart={<ThumbsDown size={18} aria-hidden="true" />} onClick={() => send('not-helpful')}>پاسخ مفید نبود</Button>
        <Button variant="ghost" iconStart={<Flag size={18} aria-hidden="true" />} onClick={() => send('report')}>گزارش مشکل</Button>
      </div>
      <p className={styles.note}>بازخورد فعلاً فقط روی همین دستگاه ذخیره می‌شود.</p>
    </div>
  );
}
