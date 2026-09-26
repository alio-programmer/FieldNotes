import { completion, formatDate, daysUntil } from '../lib/stats.js';

const PRIORITY_DOT = {
  high: 'bg-[#a8543f]',
  medium: 'bg-[#b79a55]',
  low: 'bg-[#7d8a72]',
};

export default function ProjectCard({
  project,
  selected = false,
  onOpen,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleTarget,
  onTogglePin,
  onToggleSelect,
  onToggleArchive,
}) {
  const percent = completion(project);
  const done = project.targets.filter((t) => t.done).length;
  const overdue = project.dueDate ? daysUntil(project.dueDate) < 0 : false;
  const dueSoon =
    project.dueDate && !overdue && daysUntil(project.dueDate) <= 7;

  return (
    <article
      className={`fn-card ${project.pinned ? 'fn-card-pinned' : ''} ${
        selected ? 'fn-card-selected' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {onToggleSelect && (
            <input
              type="checkbox"
              className="fn-checkbox"
              checked={selected}
              onChange={() => onToggleSelect(project.id)}
              aria-label={`Select ${project.name} for bulk actions`}
            />
          )}
          <span className="font-mono text-[9px] tracking-[0.04em] text-[#a0a196]">
            STARTED {formatDate(project.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-[7px]">
          <span
            className={`h-[6px] w-[6px] rounded-full ${PRIORITY_DOT[project.priority]}`}
            title={`${project.priority} priority`}
            aria-label={`${project.priority} priority`}
          />
          <button
            type="button"
            onClick={() => onTogglePin(project)}
            aria-pressed={project.pinned}
            aria-label={`${project.pinned ? 'Unpin' : 'Pin'} ${project.name}`}
            title={project.pinned ? 'Unpin' : 'Pin to top'}
            className={`fn-icon-btn ${project.pinned ? 'text-[#b97f58]' : ''}`}
          >
            {project.pinned ? '★' : '☆'}
          </button>
          <button
            type="button"
            onClick={() => onOpen(project)}
            aria-label={`Open ${project.name}`}
            title="Open details"
            className="fn-icon-btn"
          >
            &#8680;
          </button>
          <button
            type="button"
            onClick={() => onEdit(project)}
            aria-label={`Edit ${project.name}`}
            title="Edit project"
            className="fn-icon-btn"
          >
            &#9998;
          </button>
          <button
            type="button"
            onClick={() => onDelete(project)}
            aria-label={`Delete ${project.name}`}
            title="Delete project"
            className="fn-icon-btn"
          >
            &times;
          </button>
        </div>
      </div>

      <h3 className="fn-card-title">
        <button
          type="button"
          onClick={() => onOpen(project)}
          className="fn-card-title-btn text-left"
        >
          {project.name}
        </button>
      </h3>

      {(project.tags.length > 0 || project.status !== 'active') && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {project.status !== 'active' && (
            <span className="fn-chip fn-chip-status">
              {project.status === 'paused' ? 'Paused' : 'Archived'}
            </span>
          )}
          {project.tags.map((tag) => (
            <span key={tag} className="fn-chip">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 grid gap-2">
        <div>
          <span className="fn-eyebrow-small">THE PROBLEM</span>
          <p title={project.problem} className="fn-clamp">
            {project.problem || 'Not defined yet.'}
          </p>
        </div>
        <div>
          <span className="fn-eyebrow-small">PROPOSED APPROACH</span>
          <p title={project.solution} className="fn-clamp">
            {project.solution || 'Not defined yet.'}
          </p>
        </div>
      </div>

      {project.dueDate && (
        <p
          className={`mt-2 font-mono text-[9px] tracking-[0.06em] ${
            overdue
              ? 'text-[#a8543f]'
              : dueSoon
                ? 'text-[#8a7433]'
                : 'text-[#989a91]'
          }`}
        >
          DUE {formatDate(project.dueDate).toUpperCase()}
          {overdue ? '  &middot; OVERDUE' : ''}
        </p>
      )}

      <div className="mt-[17px] flex items-center justify-between">
        <span className="font-mono text-[8px] tracking-[0.12em] text-[#989a91]">
          TARGETS &middot; {done} OF {project.targets.length}
        </span>
        <span className="font-mono text-[11px] text-[#64765b]">{percent}%</span>
      </div>
      <div
        className="mt-2 h-[3px] overflow-hidden rounded-[6px] bg-[#e9e8e0]"
        role="progressbar"
        aria-label={`${project.name} completion`}
        aria-valuenow={percent}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span
          className="block h-full rounded-[6px] bg-[#788b6c] transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-[14px] grid gap-2 border-t border-[#eeece4] pt-[10px]">
        {project.targets.length === 0 ? (
          <span className="font-mono text-[9px] text-[#a0a196]">
            No targets yet &mdash; edit to add some.
          </span>
        ) : (
          project.targets.map((target) => (
            <label
              key={target.id}
              className={`flex cursor-pointer items-start gap-[9px] text-[11px] leading-[1.45] ${
                target.done ? 'text-[#a2a59b]' : 'text-[#62665e]'
              }`}
            >
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
              <span className={target.done ? 'line-through' : ''}>
                {target.text}
              </span>
            </label>
          ))
        )}
      </div>

      {onDuplicate && onToggleArchive && (
        <div className="mt-[12px] flex gap-2 border-t border-[#eeece4] pt-[9px]">
          <button
            type="button"
            onClick={() => onDuplicate(project)}
            className="fn-mini-btn"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => onToggleArchive(project)}
            className="fn-mini-btn"
          >
            {project.status === 'archived' ? 'Restore' : 'Archive'}
          </button>
        </div>
      )}
    </article>
  );
}
