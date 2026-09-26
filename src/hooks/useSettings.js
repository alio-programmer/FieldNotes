import { useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

const DEFAULTS = {
  theme: 'system', // 'system' | 'light' | 'dark'
  density: 'comfortable', // 'comfortable' | 'compact'
  view: 'grid', // 'grid' | 'row'
  reduceMotion: false,
  showArchived: false,
  seeded: false,
};

const validate = (value) =>
  value &&
  typeof value === 'object' &&
  typeof value.theme === 'string' &&
  typeof value.density === 'string' &&
  typeof value.view === 'string';

function systemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );
}

/** Applies the resolved theme to <html> so Tailwind's dark: variant works. */
function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

/** Applies the user's motion preference to <html>. */
function applyMotion(reduce) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('reduce-motion', reduce);
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage(
    'fieldnotes.settings.v1',
    DEFAULTS,
    { validate }
  );

  const resolved = { ...DEFAULTS, ...settings };

  useEffect(() => applyTheme(resolved.theme), [resolved.theme]);
  useEffect(() => applyMotion(resolved.reduceMotion), [resolved.reduceMotion]);

  // Follow the OS while the theme is set to 'system'.
  useEffect(() => {
    if (resolved.theme !== 'system') return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = () => applyTheme('system');
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [resolved.theme]);

  const set = useCallback(
    (patch) => setSettings((prev) => ({ ...DEFAULTS, ...prev, ...patch })),
    [setSettings]
  );

  const toggleTheme = useCallback(
    () =>
      setSettings((prev) => {
        const current = { ...DEFAULTS, ...prev };
        const isDark =
          current.theme === 'dark' ||
          (current.theme === 'system' && systemPrefersDark());
        return { ...current, theme: isDark ? 'light' : 'dark' };
      }),
    [setSettings]
  );

  return { settings: resolved, set, toggleTheme, isDark: document.documentElement.classList.contains('dark') };
}
