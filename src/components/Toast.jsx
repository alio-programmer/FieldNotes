/**
 * Bottom-of-screen status message. When `action` is supplied (used for
 * delete/undo) the toast stays up until the user acts or it times out.
 */
export default function Toast({ message, action, onAction, tone = 'default' }) {
  const visible = Boolean(message);
  const toneClass =
    tone === 'error'
      ? 'bg-[#7a2f24]'
      : tone === 'warn'
        ? 'bg-[#7a5a24]'
        : 'bg-[#344433]';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[25px] z-[60] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        data-visible={visible ? 'true' : 'false'}
        className={`fn-toast ${toneClass} ${visible ? '' : 'fn-toast-hidden'}`}
      >
        <span>{message}</span>
        {action && (
          <button
            type="button"
            onClick={onAction}
            className="ml-3 cursor-pointer border-0 border-l border-white/30 bg-transparent pl-3 font-sans text-[11px] font-medium text-white underline underline-offset-2"
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

