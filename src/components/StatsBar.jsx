import { periodLabel } from '../lib/stats.js';
import { averageDaysToComplete } from '../lib/insights.js';
function Cell({ label, value, suffix, children }) {
  return (
    <div className="border-l border-[#e5e3db] px-6 first:border-l-0 first:pl-0 max-sm:px-4">
      <span className="mb-2 block font-mono text-[9px] tracking-[0.09em] text-[#95988f]">
        {label}
      </span>
      <div className="flex items-center gap-4">
        <div>
          <strong className="font-display text-[25px] font-semibold tracking-[-1px]">
            {value}
          </strong>
          {suffix && (
            <span className="text-[11px] text-[#8a8d85]"> {suffix}</span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function StatsBar({ stats, projects, streak, weekCount }) {
  const avgDays = averageDaysToComplete(projects);

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

      <div className="mt-[21px] grid grid-cols-4 max-sm:grid-cols-2 max-sm:gap-y-[18px]">
        <Cell label="IN MOTION" value={stats.activeCount} suffix="active" />
        <Cell label="MILESTONES" value={stats.doneTargets} suffix="checked off" />
        <Cell label="OVERALL MOMENTUM" value={`${stats.overall}%`}>
          <span className="h-[3px] max-w-[110px] flex-1 rounded-[5px] bg-[#e6e7df]">
            <i
              className="block h-full rounded-[5px] bg-[#708566] transition-[width] duration-300"
              style={{ width: `${stats.overall}%` }}
            />
          </span>
        </Cell>
        <Cell
          label="THIS WEEK"
          value={weekCount}
          suffix="completed"
        >
          <span className="font-mono text-[10px] text-[#989a91]">
            {streak > 0 ? `${streak}d streak` : 'no streak'}
          </span>
        </Cell>
      </div>

      {avgDays !== null && (
        <p className="mt-4 font-mono text-[9px] text-[#989a91]">
          Targets take about {avgDays} {avgDays === 1 ? 'day' : 'days'} to
          complete on average.
        </p>
      )}
    </section>
  );
}