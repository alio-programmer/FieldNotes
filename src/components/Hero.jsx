export function Eyebrow({ children }) {
  return (
    <div className="flex items-center gap-[9px] font-mono text-[9px] font-medium tracking-[0.17em] text-[#83897f]">
      <span className="h-px w-[18px] bg-[#a5ad9a]" />
      {children}
    </div>
  );
}

export default function Hero({ onNew, projectCount = 0 }) {
  return (
    <section className="py-[57px] pb-9 max-sm:pt-[43px]">
      <Eyebrow>YOUR WORKSPACE</Eyebrow>
      <div className="mt-[21px] flex items-end justify-between max-sm:items-start max-sm:gap-5 max-[420px]:block">
        <div>
          <h1 className="clamp-title m-0 font-display font-semibold text-[#29332c] max-sm:text-[45px]">
            Make room for
            <br />
            <span className="text-[#78866e]">good work.</span>
          </h1>
          <p className="mb-0 mt-[17px] text-[13px] leading-[1.85] text-[#85877f] max-sm:text-[12px]">
            A quiet place to keep track of what you&rsquo;re building
            <br className="max-[420px]:hidden" /> and the small steps that move
            it forward.
          </p>
          {projectCount > 0 && (
            <p className="mb-0 mt-2 font-mono text-[9px] tracking-[0.1em] text-[#a0a197]">
              PRESS <kbd className="fn-kbd">N</kbd> FOR A NEW PROJECT OR{' '}
              <kbd className="fn-kbd">?</kbd> FOR SHORTCUTS
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex h-[43px] shrink-0 cursor-pointer items-center gap-2.5 rounded border-0 bg-btn px-[17px] font-sans text-[12px] font-medium text-white transition hover:-translate-y-px hover:bg-moss-dark max-sm:mt-[5px] max-sm:whitespace-nowrap max-sm:px-3 max-[420px]:mt-5"
        >
          <span className="text-[19px] font-light" aria-hidden="true">
            +
          </span>{' '}
          New project
        </button>
      </div>
    </section>
  );
}
