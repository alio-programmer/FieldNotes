import { uid } from './id.js';

/** Bump when the persisted project shape changes. */
export const CURRENT_VERSION = 2;

export const LEGACY_KEY = 'fieldnotes.projects.v1';
export const STORAGE_KEY = 'fieldnotes.projects.v2';

export const STATUSES = ['active', 'paused', 'archived'];
export const PRIORITIES = ['low', 'medium', 'high'];
export const SORT_OPTIONS = [
  { key: 'updated', label: 'Recently updated' },
  { key: 'created', label: 'Recently created' },
  { key: 'name', label: 'Name A–Z' },
  { key: 'progress', label: 'Progress' },
  { key: 'due', label: 'Due date' },
];

const str = (value, fallback = '') =>
  typeof value === 'string' ? value : fallback;

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toTags(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((t) => str(t).trim()).filter(Boolean))].slice(
    0,
    12
  );
}

/**
 * Targets now carry a stable id and timestamps. Older records only had
 * { text, done }, and text was used as the identity key — see
 * normalizeTarget for how we upgrade them.
 */
function normalizeTarget(target, index) {
  if (typeof target === 'string') {
    return {
      id: uid('t'),
      text: target,
      done: false,
      createdAt: Date.now(),
      doneAt: null,
    };
  }
  const done = Boolean(target?.done);
  return {
    id: str(target?.id) || uid('t'),
    text: str(target?.text),
    done,
    createdAt: toNumber(target?.createdAt, Date.now()),
    doneAt: done ? toNumber(target?.doneAt, Date.now()) : null,
    order: toNumber(target?.order, index),
  };
}

export function completion(project) {
  const targets = project?.targets ?? [];
  if (!targets.length) return 0;
  const done = targets.filter((t) => t.done).length;
  return Math.round((done / targets.length) * 100);
}

/**
 * Fills in every field with a sane default so the rest of the app can
 * assume a complete shape. Never throws.
 */
export function normalizeProject(input) {
  const source = input && typeof input === 'object' ? input : {};
  const now = Date.now();
  const createdAt = toNumber(source.createdAt, now);
  const targets = Array.isArray(source.targets)
    ? source.targets.map(normalizeTarget).filter((t) => t.text.trim())
    : [];

  const status = STATUSES.includes(source.status) ? source.status : 'active';

  return {
    id: str(source.id) || uid('p'),
    name: str(source.name).slice(0, 200) || 'Untitled project',
    problem: str(source.problem).slice(0, 4000),
    solution: str(source.solution).slice(0, 4000),
    notes: str(source.notes).slice(0, 20000),
    status,
    priority: PRIORITIES.includes(source.priority) ? source.priority : 'medium',
    tags: toTags(source.tags),
    pinned: Boolean(source.pinned),
    dueDate: Number.isFinite(Number(source.dueDate)) && source.dueDate
      ? Number(source.dueDate)
      : null,
    targets,
    activity: Array.isArray(source.activity)
      ? source.activity
          .filter((a) => a && Number.isFinite(Number(a.at)))
          .map((a) => ({
            id: str(a.id) || uid('a'),
            type: str(a.type, 'updated'),
            text: str(a.text).slice(0, 300),
            at: Number(a.at),
          }))
          .slice(0, 200)
      : [],
    createdAt,
    updatedAt: toNumber(source.updatedAt, createdAt),
    completedAt: toNumber(source.completedAt, null),
  };
}

function isEnvelope(raw) {
  return (
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    Array.isArray(raw.projects)
  );
}

/**
 * Accepts a v2 envelope, a bare v1 array, or anything else, and returns
 * `{ version, projects }` with every project normalized.
 */
export function migrate(raw) {
  if (raw == null) return { version: CURRENT_VERSION, projects: [] };

  const source = isEnvelope(raw) ? raw.projects : raw;

  if (!Array.isArray(source)) {
    return { version: CURRENT_VERSION, projects: [] };
  }

  const projects = source
    .filter((p) => p && typeof p === 'object')
    .map(normalizeProject);

  return { version: CURRENT_VERSION, projects };
}

export function serialize(projects) {
  return JSON.stringify({ version: CURRENT_VERSION, projects });
}
