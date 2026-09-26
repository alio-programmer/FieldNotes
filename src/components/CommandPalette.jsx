import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal.jsx';

/**
 * Ctrl/Cmd+K palette. Runs commands and jumps to projects without leaving
 * the keyboard. Filtering is a plain substring match over the project list.
 */
export default function CommandPalette({
  open,
  onClose,
  projects,
  commands,
  onOpenProject,
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const q = query.trim().toLowerCase();

  const matchedProjects = useMemo(() => {
    if (!q) return projects.slice(0, 6);
    return projects
      .filter((p) => `${p.name} ${p.tags.join(' ')}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [projects, q]);

  const matchedCommands = useMemo(() => {
    const list = commands.filter(
      (c) => !c.keywords || `${c.label} ${c.keywords}`.toLowerCase().includes(q)
    );
    return q ? list : list.slice(0, 6);
  }, [commands, q]);

  if (!open) return null;

  const runCommand = (command) => {
    onClose();
    // Let the dialog finish unmounting before running the action.
    setTimeout(() => command.action(), 0);
  };

  const nothing = !matchedProjects.length && !matchedCommands.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="palette-label"
      className="fn-panel fn-panel-palette"
    >
      <h2 id="palette-label" className="sr-only">
        Command palette
      </h2>
      <input
        data-autofocus
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Jump to a project or run a command..."
        aria-label="Search commands and projects"
        className="fn-text-field"
      />

      {nothing && (
        <p className="mt-4 text-[12px] text-muted">Nothing matches that.</p>
      )}

      {matchedProjects.length > 0 && (
        <div className="mt-4">
          <span className="fn-eyebrow-small">PROJECTS</span>
          <ul className="mt-1 grid">
            {matchedProjects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setTimeout(() => onOpenProject(p), 0);
                  }}
                  className="fn-palette-item"
                >
                  <span className="truncate">{p.name}</span>
                  <span className="font-mono text-[9px] text-[#a0a196]">
                    {p.tags.slice(0, 2).join(' ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {matchedCommands.length > 0 && (
        <div className="mt-4">
          <span className="fn-eyebrow-small">COMMANDS</span>
          <ul className="mt-1 grid">
            {matchedCommands.map((c) => (
              <li key={c.label}>
                <button
                  type="button"
                  onClick={() => runCommand(c)}
                  className="fn-palette-item"
                >
                  <span>{c.label}</span>
                  {c.hint && (
                    <span className="font-mono text-[9px] text-[#a0a196]">
                      {c.hint}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}