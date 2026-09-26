import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog shell: focus trap, Escape to close, backdrop click,
 * body scroll lock and focus restoration. Used by the project form, the
 * confirm prompt, the detail drawer, the command palette and the shortcuts
 * help — so focus and scroll behaviour live in exactly one place.
 */
export default function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  variant = 'dialog',
  className = '',
  children,
  closeOnBackdrop = true,
}) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement;

    // Move focus into the dialog, preferring an explicit autofocus target.
    const timer = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const preferred = panel.querySelector('[data-autofocus]');
      const target = preferred || panel.querySelector(FOCUSABLE) || panel;
      target.focus?.();
    }, 0);

    // Lock scrolling without shifting layout when a scrollbar disappears.
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const nodes = [...panel.querySelectorAll(FOCUSABLE)].filter(
        (n) => n.offsetParent !== null || n === document.activeElement
      );
      if (!nodes.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown, true);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fn-overlay ${variant === 'drawer' ? 'fn-overlay-drawer' : ''}`}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={className}
      >
        {children}
      </div>
    </div>
  );
}
