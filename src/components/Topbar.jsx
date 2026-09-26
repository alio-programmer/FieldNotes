import { useEffect, useState } from 'react';
import { todayLabel } from '../lib/stats.js';

export default function Topbar({
  onOpenPalette,
  onOpenShortcuts,
  onOpenData,
  isDark,
  onToggleTheme,
}) {
  const [today, setToday] = useState(() => todayLabel());

  // The topbar shows today's date, so refresh it if the tab stays open
  // across midnight.
  useEffect(() => {
    const id = setInterval(() => setToday(todayLabel()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex h-[82px] max-sm:h-[68px] items-center justify-between border-b border-[#56674e29]">
      <a
        href="#main"
        className="flex items-center gap-2.5 font-display text-[17px] font-extrabold tracking-[-0.7px] text-ink no-underline"
      >
        <span className="font-mono text-[20px] font-normal text-moss">▦</span>
        <span>
          fieldnotes<span className="text-[#b97f58]">.</span>
        </span>
      </a>

      <div className="flex items-center gap-[14px]">
        <span className="font-mono text-[10px] tracking-[0.09em] text-muted max-sm:hidden">
          {today}
        </span>

        <button
          type="button"
          onClick={onOpenPalette}
          className="fn-topbar-btn"
          title="Command palette (Ctrl+K)"
        >
          <span aria-hidden="true">⌘</span>
          <span className="max-sm:hidden">Search</span>
        </button>

        <button
          type="button"
          onClick={onOpenData}
          className="fn-topbar-btn"
          title="Import, export and print"
        >
          <span aria-hidden="true">⇅</span>
          <span className="max-sm:hidden">Data</span>
        </button>

        <button
          type="button"
          onClick={onOpenShortcuts}
          className="fn-topbar-btn"
          title="Keyboard shortcuts (?)"
        >
          <span aria-hidden="true">?</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-pressed={Boolean(isDark)}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Light theme' : 'Dark theme'}
          className="fn-topbar-btn"
        >
          <span aria-hidden="true">{isDark ? '☾' : '☀'}</span>
        </button>

        <span
          className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#e7e9dc] font-mono text-[12px] font-medium text-moss"
          aria-label="Your workspace"
        >
          Y
        </span>
      </div>
    </header>
  );
}

