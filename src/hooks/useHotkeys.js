import { useEffect, useRef } from 'react';

/**
 * True when the user is typing into a field, so shortcuts should stand down.
 * Covers contenteditable and inputs/textareas/selects.
 */
export function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable === true
  );
}

/**
 * Global keyboard shortcuts.
 *
 * `bindings` is a map of `combo` -> handler, where combo is a lowercase
 * character optionally prefixed with `mod+` (Cmd on macOS, Ctrl elsewhere).
 * Bare letters fire even with modifiers, which is convenient for single-key
 * shortcuts like `n`; use `mod+k` style for modifier combos.
 *
 * @param {Record<string, (event: KeyboardEvent) => void>} bindings
 * @param {{ enabled?: boolean }} [options]
 */
export function useHotkeys(bindings, options = {}) {
  const { enabled = true } = options;
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event) {
      // Never hijack keys the browser or the OS needs.
      if (event.defaultPrevented) return;
      if (event.altKey) return;

      const key = event.key?.toLowerCase();
      if (!key) return;

      const mod = event.ctrlKey || event.metaKey;
      const isModifierCombo =
        key === 'control' || key === 'meta' || key === 'shift' || key === 'alt';
      if (isModifierCombo) return;

      // A bare key must not fire while the user is typing.
      if (!mod && isTypingTarget(event.target)) return;

      const handler = ref.current[mod ? `mod+${key}` : key];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
