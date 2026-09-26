import { useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import {
  completion,
  formatDate,
  formatDateTime,
  relativeDay,
} from '../lib/stats.js';
import { progressSeries } from '../lib/insights.js';
import { renderMarkdown } from '../lib/markdown.js';

/** Tiny inline SVG line chart of completion over time. */
function Sparkline({ project }) {
  const { series, max } = useMemo(
    () => progressSeries(project, 12),
    [project]
  );
  const width = 260;
  const height = 44;
  const step = width / Math.max(series.length - 1, 1);
  const points = series
    .map((p, i) => `${i * step},${height - (p.percent / max) * height}`)
    .join(' ');
  const last = series[series.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[44px] w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Progress over time, currently ${last.percent} percent`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Section({ title, children, markdown }) {
  if (!children) return null;
  return (
    <section className="mt-5">
      <h3 className="fn-eyebrow-small">{title}</h3>
      {markdown ? (
        // renderMarkdown escapes its input, so this is safe by construction.
        <div
          className="fn-prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(children) }}
        />
      ) : (
        <p className="fn-drawer-text">{children}</p>
      )}
    </section>
  );
}
export default function ProjectDrawer({
  project,
  onClose,
  onEdit,
  onDelete,
  onToggleTarget,
  onAddTarget,
  onTogglePin,
  onToggleArchive,
}) {
  const [newTarget, setNewTarget] = useState('');

  if (!project) return null;

  const percent = completion(project);
  const done = project.targets.filter((t) => t.done).length;

  const submitTarget = (event) => {
    event.preventDefault();
    if (!newTarget.trim()) return;
    onAddTarget(project.id, newTarget);
    setNewTarget('');
  };

  return (
    <Modal
      open={Boolean(project)}
      onClose={onClose}
      variant="drawer"
      labelledBy="drawer-title"
      className="fn-drawer"
    >
      <header className="flex items-start justify-between gap-3 border-b border-[#eeece4] pb-4">
        <div className="min-w-0">
          <span className="font-mono text-[8px] tracking-[0.12em] text-[#a0a196]">
            STARTED {formatDate(project.createdAt).toUpperCase()}
            {project.dueDate
              ? ` - DUE ${formatDate(project.dueDate).toUpperCase()} (${relativeDay(
                  project.dueDate
                )})`
              : ''}
          </span>
          <h2 id="drawer-title" className="fn-drawer-title">
            {project.name}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {project.tags.map((tag) => (
              <span key={tag} className="fn-chip">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="fn-icon-btn text-[24px] leading-none"
        >
          &times;
        </button>
      </header>

      <div className="mt-4">
        <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.1em] text-muted">
          <span>
            {done} OF {project.targets.length} TARGETS
          </span>
          <span className="text-[12px] text-[#64765b]">{percent}%</span>
        </div>
        <div
          className="mt-2 h-[3px] overflow-hidden rounded-[6px] bg-[#e9e8e0]"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Completion"
        >
          <span
            className="block h-full rounded-[6px] bg-[#788b6c] transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        {project.targets.length > 0 && (
          <div className="mt-3 text-[#7c8a72]">
            <Sparkline project={project} />
          </div>
        )}
      </div>

      <Section title="THE PROBLEM">{project.problem}</Section>
      <Section title="PROPOSED APPROACH">{project.solution}</Section>
      <Section title="NOTES" markdown>
        {project.notes}
      </Section>

      <section className="mt-5">
        <h3 className="fn-eyebrow-small">TARGETS</h3>
        {project.targets.length === 0 && (
          <p className="fn-drawer-text">No targets yet.</p>
        )}
        <ul className="mt-1 grid gap-2">
          {project.targets.map((target) => (
            <li key={target.id} className="flex items-start gap-[9px]">
              <input
                type="checkbox"
                className="fn-checkbox"
                checked={target.done}
                onChange={(e) =>
                  onToggleTarget(project.id, target.id, e.target.checked)
                }
                aria-label={`Mark ${target.text} ${
                  target.done ? 'incomplete' : 'complete'
                }`}
              />
              <span
                className={`text-[12px] leading-[1.5] ${
                  target.done
                    ? 'text-[#a2a59b] line-through'
                    : 'text-[#62665e]'
                }`}
              >
                {target.text}
              </span>
            </li>
          ))}
        </ul>
        <form onSubmit={submitTarget} className="mt-3 flex gap-2">
          <input
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="Add a target..."
            aria-label="Add a target"
            className="fn-text-field"
          />
          <button type="submit" className="fn-btn-secondary shrink-0">
            Add
          </button>
        </form>
      </section>

      {project.activity?.length > 0 && (
        <section className="mt-5">
          <h3 className="fn-eyebrow-small">HISTORY</h3>
          <ol className="mt-2 grid gap-1.5">
            {project.activity.slice(0, 12).map((entry) => (
              <li
                key={entry.id}
                className="flex items-baseline justify-between gap-3 font-mono text-[9px] text-[#8a8d85]"
              >
                <span className="truncate">{entry.text}</span>
                <time
                  dateTime={new Date(entry.at).toISOString()}
                  className="shrink-0 text-[#b0b2a8]"
                >
                  {formatDateTime(entry.at)}
                </time>
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="mt-6 flex flex-wrap gap-2 border-t border-[#eeece4] pt-4">
        <button
          type="button"
          onClick={() => onEdit(project)}
          className="fn-btn-secondary"
        >
          Edit details
        </button>
        <button
          type="button"
          onClick={() => onTogglePin(project)}
          className="fn-btn-secondary"
        >
          {project.pinned ? 'Unpin' : 'Pin to top'}
        </button>
        <button
          type="button"
          onClick={() => onToggleArchive(project)}
          className="fn-btn-secondary"
        >
          {project.status === 'archived' ? 'Restore' : 'Archive'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(project)}
          className="fn-btn-danger-ghost"
        >
          Delete
        </button>
      </footer>
    </Modal>
  );
}
