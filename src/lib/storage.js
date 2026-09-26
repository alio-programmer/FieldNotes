import { LEGACY_KEY, STORAGE_KEY, migrate, serialize } from './schema.js';

export const QUOTA_ERROR = 'quota';
export const BLOCKED_ERROR = 'blocked';

function classify(error) {
  if (!error) return BLOCKED_ERROR;
  const name = error.name || '';
  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22) {
    return QUOTA_ERROR;
  }
  return BLOCKED_ERROR;
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Reads the v2 store, transparently upgrading the legacy v1 array on first
 * run. The legacy key is left untouched as a backup. Never throws.
 */
export function loadProjects() {
  const current = safeGet(STORAGE_KEY);
  if (current) {
    try {
      return migrate(JSON.parse(current)).projects;
    } catch {
      // Corrupt v2 payload — fall through and try the legacy key.
    }
  }

  const legacy = safeGet(LEGACY_KEY);
  if (legacy) {
    try {
      const projects = migrate(JSON.parse(legacy)).projects;
      writeProjects(projects);
      return projects;
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * @returns {{ ok: boolean, error: string|null }} `error` is QUOTA_ERROR or
 * BLOCKED_ERROR so the UI can tell the user what went wrong.
 */
export function writeProjects(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(projects));
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: classify(error) };
  }
}

export function clearProjects() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Best-effort raw snapshot, used by the error boundary's escape hatch. */
export function readRaw() {
  return safeGet(STORAGE_KEY) ?? safeGet(LEGACY_KEY) ?? '[]';
}

/** Rough byte size of the stored payload, for the storage meter. */
export function storageSize() {
  const raw = safeGet(STORAGE_KEY);
  return raw ? new Blob([raw]).size : 0;
}
