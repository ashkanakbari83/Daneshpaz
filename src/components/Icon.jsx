const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
  heart: <path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.7 4.5 6.7 4.5c1.9 0 3.3 1 5.3 3.2 2-2.2 3.4-3.2 5.3-3.2 3 0 5.1 2.9 3.9 6.2C19.500 15.400 12 20 12 20z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  flame: <path d="M12 3c1 3.500 5 5.500 5 10a5 5 0 0 1-10 0c0-2 1-3.200 2-4.200.300 1.200 1 2 2 2.200C10.500 8.500 11 6 12 3z" />,
  basket: <><path d="M3 10h18l-1.800 9a2 2 0 0 1-2 1.600H6.800a2 2 0 0 1-2-1.600L3 10z" /><path d="M8 10l3-6M16 10l-3-6" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>,
  check: <path d="m5 12.500 4.500 4.500L19 7.500" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  back: <path d="m9 5 7 7-7 7" />, // points "back" in RTL (toward the right edge)
  chevron: <path d="m6 9 6 6 6-6" />,
  coin: <><circle cx="12" cy="12" r="9" /><path d="M9.500 9.500c.400-1 1.300-1.500 2.500-1.500 1.500 0 2.500.800 2.500 2 0 2.500-5 1.500-5 4 0 1.200 1 2 2.500 2 1.200 0 2.100-.500 2.500-1.500M12 6.500V8M12 16v1.500" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 4-6 8-6s7 2 8 6" /></>,
  play: <path d="M8 5v14l11-7z" />,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.500 1.500M9 2.500h6" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
};

export default function Icon({ name, fill = false, className = '' }) {
  return (
    <svg className={`icon${fill ? ' fill' : ''} ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
