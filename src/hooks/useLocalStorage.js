import { useCallback, useEffect, useRef, useState } from 'react';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * State mirrored into localStorage. Writes are debounced so rapid changes
 * (e.g. dragging through a list) do not hammer storage.
 *
 * @param {string} key
 * @param {*} fallback used when nothing is stored yet
 * @param {{ validate?: (value:any)=>boolean }} [options] when validate returns
 *   false the stored value is ignored and the fallback is used
 */
export function useLocalStorage(key, fallback, options = {}) {
  const [value, setValue] = useState(() => {
    const initial = read(key, fallback);
    if (options.validate && !options.validate(initial)) return fallback;
    return initial;
  });

  const timer = useRef();
  const validate = options.validate;

  useEffect(() => {
    if (validate && !validate(value)) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage full or blocked — callers that care use
        // src/lib/storage.js and surface a real error.
      }
    }, 150);
    return () => clearTimeout(timer.current);
  }, [key, value, validate]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    function onStorage(event) {
      if (event.key !== key || event.newValue == null) return;
      try {
        setValue(JSON.parse(event.newValue));
      } catch {
        /* ignore malformed cross-tab payloads */
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  const reset = useCallback(() => setValue(fallback), [fallback]);

  return [value, setValue, reset];
}
