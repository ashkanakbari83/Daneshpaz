import { Download } from 'lucide-react';
import { useInstallPrompt } from '@/pwa/install';

/** Shows only when the browser offers to install the app; renders nothing otherwise. */
export default function InstallButton({ className, iconSize = 16, children = 'نصب برنامه' }) {
  const { canInstall, install } = useInstallPrompt();
  if (!canInstall) return null;
  return (
    <button type="button" className={className} onClick={install}>
      <Download size={iconSize} aria-hidden="true" />
      {children}
    </button>
  );
}
