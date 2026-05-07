import { useLayoutEffect, useState } from 'react';

function isAllowedPortfolioReturn(u: URL): boolean {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  if (u.username || u.password) return false;
  if (u.protocol === 'http:') {
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  }
  return true;
}

function parsePortfolioReturn(search: string): string | null {
  let raw: string | null;
  try {
    raw = new URLSearchParams(search).get('portfolioReturn');
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    raw = decodeURIComponent(raw.trim());
  } catch {
    return null;
  }
  try {
    const u = new URL(raw);
    if (!isAllowedPortfolioReturn(u)) return null;
    return u.href;
  } catch {
    return null;
  }
}

/** Fixed top-center link when opened from design portfolio (?portfolioReturn=…). */
export function PortfolioReturnLink() {
  const [href, setHref] = useState<string | null>(null);
  useLayoutEffect(() => {
    setHref(parsePortfolioReturn(window.location.search));
  }, []);
  if (!href) return null;
  return (
    <a
      href={href}
      className="fixed left-1/2 top-4 z-[2147483647] max-w-[min(calc(100vw-2rem),20rem)] -translate-x-1/2 whitespace-normal text-center text-[12px] leading-tight font-semibold text-neutral-950 rounded-[10px] border border-neutral-200 bg-white px-3 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] transition-[box-shadow,border-color,background-color] duration-150 hover:border-neutral-300 hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
    >
      Back to Adelaide's portfolio
    </a>
  );
}
