import { todayLabel } from '../lib/stats.js';

export default function Topbar() {
  return (
    <header className="flex h-[82px] max-sm:h-[68px] items-center justify-between border-b border-[#56674e29]">
      <a
        href="#"
        aria-label="Fieldnotes home"
        onClick={(e) => e.preventDefault()}
        className="flex items-center gap-2.5 font-display text-[17px] font-extrabold tracking-[-0.7px] text-ink no-underline"
      >
        <span className="font-mono text-[20px] font-normal text-moss">▦</span>
        <span>
          fieldnotes<span className="text-[#b97f58]">.</span>
        </span>
      </a>
      <div className="flex items-center gap-[18px]">
        <span className="font-mono text-[10px] tracking-[0.09em] text-muted max-sm:text-[9px]">
          {todayLabel()}
        </span>
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
