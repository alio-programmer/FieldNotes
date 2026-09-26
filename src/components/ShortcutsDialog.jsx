import Modal from './Modal.jsx';

const SHORTCUTS = [
  { keys: ['N'], label: 'New project' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['Ctrl', 'K'], label: 'Command palette' },
  { keys: ['E'], label: 'Edit project' },
  { keys: ['Esc'], label: 'Close dialog or drawer' },
  { keys: ['?'], label: 'Show this list' },
  { keys: ['Ctrl', 'Enter'], label: 'Save from the project form' },
];

export default function ShortcutsDialog({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="shortcuts-title"
      className="fn-panel fn-panel-narrow"
    >
      <h2 id="shortcuts-title" className="fn-dialog-title">
        Keyboard shortcuts
      </h2>
      <p className="fn-dialog-sub">
        Shortcuts stand down while you are typing in a field.
      </p>
      <dl className="mt-2 grid gap-2">
        {SHORTCUTS.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-4">
            <dt className="text-[12px] text-[#62665e]">{s.label}</dt>
            <dd className="flex gap-1">
              {s.keys.map((k) => (
                <kbd key={k} className="fn-kbd">
                  {k}
                </kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <div className="fn-dialog-actions">
        <button
          type="button"
          onClick={onClose}
          data-autofocus
          className="fn-btn-primary"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}