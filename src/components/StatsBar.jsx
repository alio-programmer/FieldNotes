import { periodLabel } from '../lib/stats.js';

export default function StatsBar({ activeCount, doneTargets, overall }) {
  return (
    <section
      aria-label="Project overview"
      className="border-y border-[#56674e30] py-[23px] pb-[25px]"
    >
      <div className="flex items-center gap-3 font-mono text-[9px] tracking-[0.16em] text-muted">
        <span>AT A GLANCE</span>
        <span className="h-px flex-1 bg-[#e4e2d9]" />
        <span>{periodLabel()}</span>
      </div>
      <div className="mt-[21px] grid grid-cols-[1fr_1fr_1.35fr] max-sm:grid-cols-2 max-sm:gap-y-[18px]">
        <div className="border-l border-[#e5e3db] px-6 first:border-l-0 first:pl-0">
          <span className="mb-2 block font-mono text-[9px] tracking-[0.09em] text-[#95988f]">
            IN MOTION
          </span>
          <div>
            <strong className="font-display text-[25px] font-semibold tracking-[-1px]">
              {activeCount}
            </strong>
            <span className="text-[11px] text-[#8a8d85]"> active projects</span>
          </div>
        </div>
        <div className="border-l border-[#e5e3db] px-6 first:border-l-0 first:pl-0 max-sm:pr-0">
          <span className="mb-2 block font-mono text-[9px] tracking-[0.09em] text-[#95988f]">
            MILESTONES
          </span>
          <div>
            <strong className="font-display text-[25px] font-semibold tracking-[-1px]">
              {doneTargets}
            </strong>
            <span className="text-[11px] text-[#8a8d85]"> checked off</span>
          </div>
        </div>
        <div className="border-l border-[#e5e3db] px-6 pr-0 first:border-l-0 first:pl-0 max-sm:col-span-full max-sm:border-0 max-sm:p-0">
          <span className="mb-2 block font-mono text-[9px] tracking-[0.09em] text-[#95988f]">
            OVERALL MOMENTUM
          </span>
          <div className="flex items-center gap-4">
            <strong className="font-display text-[25px] font-semibold tracking-[-1px]">
              {overall}%
            </strong>
            <span className="h-[3px] max-w-[145px] flex-1 rounded-[5px] bg-[#e6e7df]">
              <i
                className="block h-full rounded-[5px] bg-[#708566] transition-[width] duration-300"
                style={{ width: `${overall}%` }}
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
