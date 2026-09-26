/**
 * Stable id generation. Prefers crypto.randomUUID but falls back to a
 * collision-resistant string for older browsers and insecure contexts,
 * where crypto.randomUUID is undefined.
 */
export function uid(prefix = '') {
  const raw =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}-${raw}` : raw;
}
