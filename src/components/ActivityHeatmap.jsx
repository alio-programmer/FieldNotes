import { useMemo } from 'react';
import { activityHeatmap } from '../lib/insights.js';
import { formatDate } from '../lib/stats.js';

/** Shade level 0-4, scaled against the busiest day in the window. */
function level(count, max) {
  if (!count) return 0;
  if (count >= max) return 4;
  return Math.max(1, Math.ceil((count / max) * 4));
}

const LEVEL_CLASS = [
  'fn-heat-0',
  'fn-heat-1',
  'fn-heat-2',
  'fn-heat-3',
  'fn-heat-4',
];

/**
 * 12-week contribution-style grid, built from activity entries and
 * target completions. Pure CSS grid, no chart library.
 */
export default function ActivityHeatmap({ projects, weeks = 12 }) {
  const { days, max } = useMemo(
    () => activityHeatmap(projects, weeks),
    [projects, weeks]
  );

  if (!max) return null;

  const total = days.reduce((sum, d) => sum + d.count, 0);

  // Column-major: each column is one week, so chunk the flat day list.
  const columns = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  return (
    <section className="mt-6" aria-label="Activity over the last 12 weeks">
      <div className="flex items-center gap-3 font-mono text-[9px] tracking-[0.16em] text-muted">
        <span>RECENT ACTIVITY</span>
        <span className="h-px flex-1 bg-[#e4e2d9]" />
        <span>{total} ENTRIES</span>
      </div>

      <div
        className="mt-3 grid gap-[3px]"
        style={{
          gridTemplateRows: 'repeat(7, 9px)',
          gridAutoFlow: 'column',
          gridAutoColumns: '9px',
          width: columns.length * 12,
          maxWidth: '100%',
          overflowX: 'auto',
        }}
      >
        {columns.flat().map((day) => {
          const shade = level(day.count, max);
          return (
            <span
              key={day.start}
              className={`rounded-[2px] ${LEVEL_CLASS[shade]}`}
              title={`${formatDate(day.start)}: ${day.count} ${
                day.count === 1 ? 'entry' : 'entries'
              }`}
              aria-label={`${formatDate(day.start)}: ${day.count}`}
              role="img"
            />
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-1.5 font-mono text-[8px] text-[#a0a196]">
        <span>LESS</span>
        {LEVEL_CLASS.map((cls) => (
          <span key={cls} className={`h-[8px] w-[8px] rounded-[2px] ${cls}`} />
        ))}
        <span>MORE</span>
      </div>
    </section>
  );
}
