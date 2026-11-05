import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './BottomSheet.module.css';

/**
 * Modal sheet built on the native <dialog>: focus is trapped, Esc closes it,
 * and the page behind becomes inert. Slides up from the bottom on phones and
 * becomes a centered dialog from 768px. Click the dimmed backdrop to close.
 */
export default function BottomSheet({ open, onClose, title, children, footer }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className={styles.panel}>
          <div className={styles.grabber} aria-hidden="true" />
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="بستن">
              <X size={22} aria-hidden="true" />
            </button>
          </header>
          <div className={styles.body}>{children}</div>
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
