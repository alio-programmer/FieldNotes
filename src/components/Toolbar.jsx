import { Eyebrow } from './Hero.jsx';
import { SORT_OPTIONS } from '../lib/schema.js';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'In progress' },
  { key: 'paused', label: 'Paused' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
];

export default function Toolbar({
  query,
  onQueryChange,
  searchRef,
  status,
  counts,
  onStatusChange,
  sort,
  onSortChange,
  projectCount,
  visibleCount,
  tag,
  tags,
  onTagChange,
  onClearFilters,
  view,
  onViewChange,
  selectionCount,
  onSelectAll,
  onBulkArchive,
  onBulkDelete,
  onClearSelection,
}) {
  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <div>
          <Eyebrow>THE WORK</Eyebrow>
          <h2 className="mb-0 mt-[9px] font-display text-[25px] font-semibold tracking-[-1px]">
            Your projects
            <span className="ml-2.5 align-top font-mono text-[11px] font-normal text-[#a1a398]">
              {String(projectCount).padStart(2, '0')}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center rounded border border-[#e4e2d9] p-[2px]"
            role="group"
            aria-label="Layout"
          >
            {['grid', 'row'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onViewChange(v)}
                aria-pressed={view === v}
                title={v === 'grid' ? 'Grid view' : 'List view'}
                className={`fn-toggle ${view === v ? 'fn-toggle-on' : ''}`}
              >
                <span aria-hidden="true">{v === 'grid' ? '▦' : '☰'}</span>
                <span className="sr-only">{v === 'grid' ? 'Grid' : 'List'}</span>
              </button>
            ))}
          </div>

          <label>
            <span className="sr-only">Sort projects</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="fn-select"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3 border-y border-[#e4e2d9] py-3 max-[420px]:flex-col max-[420px]:items-start max-[420px]:gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-[#8b9186]">
          <span aria-hidden="true" className="text-[20px] leading-none">
            ⌕
          </span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Find a project...  ( / )"
            aria-label="Search projects"
            className="w-full max-w-[200px] border-0 bg-transparent font-sans text-[11px] text-ink outline-none placeholder:text-[#a5a69e]"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
              className="fn-icon-btn"
            >
              &times;
            </button>
          )}
        </div>

        <div
          className="flex flex-wrap items-center gap-1 max-[420px]:w-full"
          role="group"
          aria-label="Filter projects"
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onStatusChange(f.key)}
              aria-pressed={status === f.key}
              className={`fn-pill ${status === f.key ? 'fn-pill-on' : ''}`}
            >
              {f.label}
              <span className="ml-[3px] font-mono text-[9px] opacity-70">
                {counts[f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[8px] tracking-[0.12em] text-[#9a9c92]">
            TAGS
          </span>
          <button
            type="button"
            onClick={() => onTagChange(null)}
            aria-pressed={tag === null}
            className={`fn-chip-btn ${tag === null ? 'fn-chip-btn-on' : ''}`}
          >
            all
          </button>
          {tags.map(({ tag: name, count }) => (
            <button
              key={name}
              type="button"
              onClick={() => onTagChange(name)}
              aria-pressed={tag === name}
              className={`fn-chip-btn ${tag === name ? 'fn-chip-btn-on' : ''}`}
            >
              #{name}
              <span className="ml-1 font-mono text-[9px] opacity-70">{count}</span>
            </button>
          ))}
        </div>
      )}

      {(query || tag || status !== 'all') && (
        <p className="mt-3 font-mono text-[9px] text-[#9a9c92]">
          SHOWING {visibleCount} OF {projectCount}
          <button
            type="button"
            onClick={onClearFilters}
            className="ml-2 cursor-pointer border-0 bg-transparent font-sans text-[10px] text-[#596d50] underline underline-offset-2"
          >
            Clear filters
          </button>
        </p>
      )}

      {selectionCount > 0 && (
        <div
          className="mt-3 flex flex-wrap items-center gap-2 rounded border border-[#dfe3d6] bg-[#eef1e6] px-3 py-2"
          role="region"
          aria-label="Bulk actions"
        >
          <span className="font-mono text-[9px] tracking-[0.1em] text-[#4f6648]">
            {selectionCount} SELECTED
          </span>
          <button type="button" onClick={onSelectAll} className="fn-mini-btn">
            Select all
          </button>
          <button type="button" onClick={onBulkArchive} className="fn-mini-btn">
            Archive
          </button>
          <button type="button" onClick={onBulkDelete} className="fn-mini-btn">
            Delete
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="fn-mini-btn ml-auto"
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
}
