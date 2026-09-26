import { completion, formatDate } from '../lib/stats.js';

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  onToggleTarget,
}) {
  const percent = completion(project);
  const done = project.targets.filter((t) => t.done).length;

  return (
    <article className="min-w-0 rounded-[5px] border border-[#e7e5dc] bg-[#fbfaf6f2] p-[19px_20px_16px] transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(59,67,48,0.055)] max-sm:p-[18px]">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[9px] tracking-[0.04em] text-[#a0a196]">
          STARTED {formatDate(project.createdAt || project.updatedAt)}
        </span>
        <div className="flex gap-[7px]">
          <button
            type="button"
            onClick={() => onEdit(project)}
            aria-label={`Edit ${project.name}`}
            title="Edit project"
            className="cursor-pointer border-0 bg-transparent p-0 text-[13px] text-[#9a9d93] hover:text-[#52684b]"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={() => onDelete(project)}
            aria-label={`Delete ${project.name}`}
            title="Delete project"
            className="cursor-pointer border-0 bg-transparent p-0 text-[13px] text-[#9a9d93] hover:text-[#52684b]"
          >
            ×
          </button>
        </div>
      </div>

      <h3 className="mb-[7px] mt-[9px] break-words font-display text-[17px] font-semibold leading-[1.35] tracking-[-0.45px] text-[#30382f]">
        {project.name}
      </h3>

      <div className="mt-3 grid gap-2">
        <div>
          <span className="font-mono text-[8px] tracking-[0.1em] text-[#9a9c92]">
            THE PROBLEM
          </span>
          <p
            title={project.problem}
            className="m-0 mt-[3px] line-clamp-2 min-h-[15px] text-[10px] leading-[1.5] text-[#777b72]"
          >
            {project.problem || 'Not defined yet.'}
          </p>
        </div>
        <div>
          <span className="font-mono text-[8px] tracking-[0.1em] text-[#9a9c92]">
            PROPOSED APPROACH
          </span>
          <p
            title={project.solution}
            className="m-0 mt-[3px] line-clamp-2 min-h-[15px] text-[10px] leading-[1.5] text-[#777b72]"
          >
            {project.solution || 'Not defined yet.'}
          </p>
        </div>
      </div>

      <div className="mt-[17px] flex items-center justify-between">
        <span className="font-mono text-[8px] tracking-[0.12em] text-[#989a91]">
          TARGETS · {done} OF {project.targets.length}
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
            No targets yet — edit to add some.
          </span>
        ) : (
          project.targets.map((target, index) => (
            <label
              key={index}
              className={`flex cursor-pointer items-start gap-[9px] text-[11px] leading-[1.45] ${
                target.done ? 'text-[#a2a59b]' : 'text-[#62665e]'
              }`}
            >
              <input
                type="checkbox"
                className="fn-checkbox"
                checked={target.done}
                onChange={(e) =>
                  onToggleTarget(project.id, index, e.target.checked)
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
    </article>
  );
}
