import { useRef, useState } from 'react';
import Modal from './Modal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { storageSize } from '../lib/storage.js';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Second step of an import: merge into the current log, or replace it. */
function ImportChoiceDialog({ pending, currentCount, onCancel, onConfirm }) {
  return (
    <Modal
      open={Boolean(pending)}
      onClose={onCancel}
      labelledBy="import-title"
      className="fn-panel fn-panel-narrow"
    >
      <h2 id="import-title" className="fn-dialog-title">
        Import {pending?.projects.length ?? 0} projects?
      </h2>
      <p className="fn-dialog-sub">
        Merge keeps your current {currentCount} projects and updates the ones
        that share an id. Replace discards everything you have now.
      </p>
      <div className="fn-dialog-actions">
        <button
          type="button"
          onClick={onCancel}
          data-autofocus
          className="fn-btn-quiet"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm('replace')}
          className="fn-btn-danger-ghost"
        >
          Replace all
        </button>
        <button
          type="button"
          onClick={() => onConfirm('merge')}
          className="fn-btn-primary"
        >
          Merge
        </button>
      </div>
    </Modal>
  );
}

export default function DataDialog({
  open,
  onClose,
  projects,
  onExportJson,
  onExportMarkdown,
  onPrint,
  onImport,
  onLoadSample,
  onClearAll,
}) {
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    try {
      const result = await onImport(file);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPending(result);
    } catch (err) {
      setError(err.message || 'That file could not be read.');
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        labelledBy="data-title"
        className="fn-panel fn-panel-narrow"
      >
        <h2 id="data-title" className="fn-dialog-title">
          Your data
        </h2>
        <p className="fn-dialog-sub">
          Everything lives in this browser only. Export a backup now and then,
          and you will never lose a project to a cleared cache.
        </p>

        <p className="mt-3 font-mono text-[9px] text-[#989a91]">
          {projects.length} PROJECTS &middot; {formatBytes(storageSize())} USED
        </p>

        <div className="mt-4 grid gap-2">
          <button type="button" onClick={onExportJson} className="fn-btn-secondary">
            Export as JSON (full backup)
          </button>
          <button
            type="button"
            onClick={onExportMarkdown}
            className="fn-btn-secondary"
          >
            Export as Markdown
          </button>
          <button type="button" onClick={onPrint} className="fn-btn-secondary">
            Print this log
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="fn-btn-secondary"
          >
            Import from a file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="hidden"
            aria-label="Import projects from a JSON file"
          />
          {onLoadSample && projects.length === 0 && (
            <button
              type="button"
              onClick={onLoadSample}
              className="fn-btn-secondary"
            >
              Load sample projects
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="fn-btn-danger-ghost"
          >
            Delete everything
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-[12px] text-[#a8543f]">
            {error}
          </p>
        )}

        <div className="fn-dialog-actions">
          <button
            type="button"
            onClick={onClose}
            data-autofocus
            className="fn-btn-primary"
          >
            Close
          </button>
        </div>
      </Modal>

      <ImportChoiceDialog
        pending={pending}
        currentCount={projects.length}
        onCancel={() => setPending(null)}
        onConfirm={(mode) => {
          onImport(pending.projects, mode);
          setPending(null);
          onClose();
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Delete every project?"
        description="This cannot be undone. Export a backup first if you might want any of it back."
        confirmLabel="Delete everything"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          onClearAll();
          onClose();
        }}
      />
    </>
  );
}