import { useEffect, useState } from 'react';
import BottomSheet from '@/components/common/BottomSheet/BottomSheet';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import { RELEASES, CHANGE_TYPES } from '@/data/changelog';
import {
  getLastSeenRelease, markReleaseSeen, hasExistingUserData, OPEN_WHATS_NEW_EVENT,
} from '@/store/releaseStore';
import { pickReleasesToShow, recentReleases, formatVersion } from '@/utils/releases';
import { formatDate } from '@/utils/time';
import styles from './WhatsNew.module.css';

const LATEST = RELEASES[0]?.id;

/**
 * «تازه‌های دانشپز»: opens by itself the first time a returning visitor loads the site after an
 * update, and again on demand (footer button, or ?whatsnew=1). Mounted only in the public shell,
 * so it never interrupts guided cooking.
 */
export default function WhatsNew() {
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (!LATEST) return;
    const forced = new URLSearchParams(window.location.search).get('whatsnew') === '1';
    const lastSeen = getLastSeenRelease();
    const toShow = forced
      ? RELEASES.slice(0, 1)
      : pickReleasesToShow({ releases: RELEASES, lastSeen, hasExistingData: hasExistingUserData() });
    if (toShow.length) setShown(toShow);
    else if (lastSeen !== LATEST) markReleaseSeen(LATEST); // new visitor: nothing to catch up on
  }, []);

  useEffect(() => {
    const open = () => setShown(recentReleases(RELEASES));
    window.addEventListener(OPEN_WHATS_NEW_EVENT, open);
    return () => window.removeEventListener(OPEN_WHATS_NEW_EVENT, open);
  }, []);

  const close = () => {
    if (LATEST) markReleaseSeen(LATEST);
    setShown(null);
  };

  return (
    <BottomSheet
      open={Boolean(shown)}
      onClose={close}
      title="تازه‌های دانشپز"
      footer={<Button fullWidth onClick={close}>متوجه شدم</Button>}
    >
      {shown?.map((release) => (
        <section key={release.id} className={styles.release} aria-labelledby={`release-${release.id}`}>
          <h3 id={`release-${release.id}`} className={styles.title}>{release.title}</h3>
          <p className={styles.meta}><span>نسخه‌ی <bdi>{formatVersion(release.id)}</bdi></span><span>{formatDate(release.date)}</span></p>
          <ul className={styles.list}>
            {release.changes.map((change) => (
              <li key={change.text} className={styles.item}>
                <Badge tone={CHANGE_TYPES[change.type].tone}>{CHANGE_TYPES[change.type].label}</Badge>
                <span>{change.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </BottomSheet>
  );
}
