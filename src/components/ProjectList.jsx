import ProjectCard from './ProjectCard.jsx';

function EmptyState({ hasProjects, onNew, onClearFilters, filtered }) {
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
      {hasProjects ? (
        filtered && (
          <button
            type="button"
            onClick={onClearFilters}
            className="fn-btn-secondary"
          >
            Clear filters
          </button>
        )
      ) : (
        <button
          type="button"
          onClick={onNew}
          className="fn-btn-primary"
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
  onClearFilters,
  view = 'grid',
  selection = new Set(),
  ...cardHandlers
}) {
  const filtered = projects.length !== hasProjects;

  return (
    <div
      className={`mt-[17px] grid gap-[15px] ${
        view === 'row'
          ? 'grid-cols-1'
          : 'grid-cols-2 max-sm:grid-cols-1'
      }`}
    >
      {projects.length === 0 ? (
        <EmptyState
          hasProjects={hasProjects}
          onNew={onNew}
          onClearFilters={onClearFilters}
          filtered={filtered}
        />
      ) : (
        projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            selected={selection.has(p.id)}
            {...cardHandlers}
          />
        ))
      )}
    </div>
  );
}

