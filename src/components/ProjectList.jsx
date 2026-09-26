import ProjectCard from './ProjectCard.jsx';

function EmptyState({ hasProjects, onNew }) {
  return (
    <div className="col-span-full rounded-[5px] border border-dashed border-[#d9dace] bg-[#fbfaf680] px-5 py-[45px] text-center">
      <div className="text-[25px] text-[#75866d]">
        {hasProjects ? '⌕' : '✳'}
      </div>
      <h3 className="mb-[6px] mt-[10px] font-display text-[17px] font-semibold">
        {hasProjects
          ? 'Nothing found just yet.'
          : 'Every good thing starts somewhere.'}
      </h3>
      <p className="mb-[18px] mt-0 text-[12px] text-[#898c83]">
        {hasProjects
          ? 'Try another search or switch the filter.'
          : 'Make a little space for the project on your mind.'}
      </p>
      {!hasProjects && (
        <button
          type="button"
          onClick={onNew}
          className="inline-flex h-9 cursor-pointer items-center gap-2.5 rounded border-0 bg-btn px-[17px] font-sans text-[11px] font-medium text-white transition hover:-translate-y-px hover:bg-moss-dark"
        >
          <span className="text-[19px] font-light">+</span> Start a project
        </button>
      )}
    </div>
  );
}

export default function ProjectList({
  projects,
  hasProjects,
  onNew,
  onEdit,
  onDelete,
  onToggleTarget,
}) {
  return (
    <div className="mt-[17px] grid grid-cols-2 gap-[15px] max-sm:grid-cols-1">
      {projects.length === 0 ? (
        <EmptyState hasProjects={hasProjects} onNew={onNew} />
      ) : (
        projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleTarget={onToggleTarget}
          />
        ))
      )}
    </div>
  );
}
