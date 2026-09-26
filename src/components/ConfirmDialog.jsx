import Modal from './Modal.jsx';

/**
 * Destructive-action prompt. Defaults to the safe option ("Cancel") being
 * focused so a stray Enter will not delete anything.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      labelledBy="confirm-title"
      className="fn-panel fn-panel-narrow"
    >
      <h2 id="confirm-title" className="fn-dialog-title">
        {title}
      </h2>
      {description && <p className="fn-dialog-sub">{description}</p>}

      {children}

      <div className="fn-dialog-actions">
        <button
          type="button"
          onClick={onCancel}
          data-autofocus
          className="fn-btn-quiet"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={destructive ? 'fn-btn-danger' : 'fn-btn-primary'}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
