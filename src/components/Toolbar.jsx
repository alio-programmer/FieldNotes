import { Eyebrow } from './Hero.jsx';

export default function Toolbar({
  query,
  setQuery,
  filter,
  setFilter,
  total,
  newestFirst,
  onToggleSort,
  projectCount,
}) {
  const btn = (key, label, count) => (
    <button
      key={key}
      type="button"
      onClick={() => setFilter(key)}
      className={`cursor-pointer rounded border-0 px-2.5 py-[7px] font-sans text-[11px] max-[420px]:px-2 ${
        filter === key
          ? 'bg-[#e9ecdf] text-[#4f6648]'
          : 'bg-transparent text-[#898c83]'
      }`}
    >
      {label}
      {typeof count === 'number' && (
        <span className="ml-[3px] font-mono text-[9px] text-[#8c9983]">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <Eyebrow>THE WORK</Eyebrow>
          <h2 className="mb-0 mt-[9px] font-display text-[25px] font-semibold tracking-[-1px]">
            Your projects
            <span className="ml-2.5 align-top font-mono text-[11px] font-normal text-[#a1a398]">
              {String(projectCount).padStart(2, '0')}
            </span>
          </h2>
        </div>
        <button
          type="button"
          onClick={onToggleSort}
          aria-label="Sort projects"
          className="cursor-pointer border-0 bg-transparent py-2 font-sans text-[11px] text-[#84877f]"
        >
          <span className="text-[17px]">↕ </span>
          <span className="max-sm:hidden">
            {newestFirst ? 'Recently updated' : 'Oldest first'}
          </span>
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between border-y border-[#e4e2d9] py-3 max-[420px]:flex-col max-[420px]:items-start max-[420px]:gap-2">
        <label className="flex items-center gap-2 text-[#8b9186]">
          <span aria-hidden="true" className="text-[20px] leading-none">
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a project…"
            aria-label="Search projects"
            className="w-[180px] border-0 bg-transparent font-sans text-[11px] text-ink outline-none placeholder:text-[#a5a69e]"
          />
        </label>
        <div
          className="flex items-center gap-1 max-[420px]:w-full"
          role="group"
          aria-label="Filter projects"
        >
          {btn('all', 'All', total)}
          {btn('active', 'In progress')}
          {btn('completed', 'Completed')}
        </div>
      </div>
    </>
  );
}
