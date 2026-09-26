import { useEffect, useState } from 'react';
import { Eyebrow } from './Hero.jsx';

export default function ProjectDialog({ open, editing, onClose, onSave }) {
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [targets, setTargets] = useState('');

  useEffect(() => {
    if (open) {
      setName(editing?.name || '');
      setProblem(editing?.problem || '');
      setSolution(editing?.solution || '');
      setTargets(editing?.targets.map((t) => t.text).join('\n') || '');
    }
  }, [open, editing]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      problem: problem.trim(),
      solution: solution.trim(),
      targetLines: targets
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#22291f75] p-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[calc(100%-30px)] w-[min(540px,calc(100%-28px))] overflow-y-auto rounded-md border border-[#e4e3d9] bg-[#faf9f4] p-[25px_30px_28px] text-ink shadow-[0_20px_80px_#20281d33] max-[420px]:p-[22px_19px]">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between">
            <Eyebrow>A NEW BEGINNING</Eyebrow>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="cursor-pointer border-0 bg-transparent text-[24px] leading-none text-[#8b8e85]"
            >
              ×
            </button>
          </div>
          <h2 className="mb-1 ml-0 mr-0 mt-4 font-display text-[26px] font-semibold tracking-[-1px]">
            {editing ? 'Shape this project' : 'Start a project'}
          </h2>
          <p className="mb-[21px] mt-0 text-[12px] text-[#898c83]">
            Give the idea a name, then make the next steps visible.
          </p>

          <label className="mb-[7px] mt-[15px] flex justify-between gap-2.5 font-mono text-[9px] tracking-[0.1em] text-[#72796c]">
            PROJECT NAME{' '}
            <span className="font-sans text-[10px] tracking-normal text-[#a0a197]">
              Required
            </span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            placeholder="e.g. A better morning routine"
            className="fn-text-field"
            autoFocus
          />

          <label className="mb-[7px] mt-[15px] flex justify-between gap-2.5 font-mono text-[9px] tracking-[0.1em] text-[#72796c]">
            THE PROBLEM{' '}
            <span className="font-sans text-[10px] tracking-normal text-[#a0a197]">
              What needs to change?
            </span>
          </label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Describe the challenge you’re taking on…"
            className="fn-text-field"
          />

          <label className="mb-[7px] mt-[15px] flex justify-between gap-2.5 font-mono text-[9px] tracking-[0.1em] text-[#72796c]">
            YOUR APPROACH{' '}
            <span className="font-sans text-[10px] tracking-normal text-[#a0a197]">
              What might help?
            </span>
          </label>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Sketch out your proposed solution…"
            className="fn-text-field"
          />

          <label className="mb-[7px] mt-[15px] flex justify-between gap-2.5 font-mono text-[9px] tracking-[0.1em] text-[#72796c]">
            TARGETS{' '}
            <span className="font-sans text-[10px] tracking-normal text-[#a0a197]">
              One per line
            </span>
          </label>
          <textarea
            value={targets}
            onChange={(e) => setTargets(e.target.value)}
            rows={4}
            placeholder={'Talk to three potential users\nMap the first version\nShare a working prototype'}
            className="fn-text-field"
          />

          <div className="mt-[22px] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer border-0 bg-transparent px-3 py-2.5 font-sans text-[11px] text-[#85877f]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-[43px] cursor-pointer items-center gap-2.5 rounded border-0 bg-btn px-[17px] font-sans text-[12px] font-medium text-white transition hover:-translate-y-px hover:bg-moss-dark"
            >
              Save project <span>↗</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
