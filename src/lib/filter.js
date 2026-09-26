import { completion } from './schema.js';

export const STATUS_LABEL = {
  active: 'In progress',
  paused: 'Paused',
  archived: 'Archived',
};

/** Everything the search box looks at, lowercased and collapsed. */
function haystack(project) {
  return [
    project.name,
    project.problem,
    project.solution,
    project.notes,
    (project.tags || []).join(' '),
    (project.targets || []).map((t) => t.text).join(' '),
  ]
    .join(' ')
    .toLowerCase();
}

export function isCompleted(project) {
  return (project.targets || []).length > 0 && completion(project) === 100;
}

/**
 * @param {object[]} projects
 * @param {{ query?:string, status?:string, tag?:string|null, sort?:string }} options
 */
export function selectVisible(projects, options = {}) {
  const {
    query = '',
    status = 'all',
    tag = null,
    sort = 'updated',
  } = options;

  const q = query.trim().toLowerCase();

  let list = projects.filter((project) => {
    // Archived projects are hidden unless explicitly requested.
    if (project.status === 'archived' && status !== 'archived') return false;

    if (status === 'active') {
      if (project.status !== 'active') return false;
    } else if (status === 'paused') {
      if (project.status !== 'paused') return false;
    } else if (status === 'completed') {
      if (!isCompleted(project)) return false;
    } else if (status === 'archived') {
      if (project.status !== 'archived') return false;
    }

    if (tag && !(project.tags || []).includes(tag)) return false;
    if (q && !haystack(project).includes(q)) return false;

    return true;
  });

  const byName = (a, b) => a.name.localeCompare(b.name);

  switch (sort) {
    case 'created':
      list.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'name':
      list.sort(byName);
      break;
    case 'progress':
      list.sort((a, b) => completion(b) - completion(a) || byName(a, b));
      break;
    case 'due':
      // Projects with no due date sort last, then earliest first.
      list.sort(
        (a, b) =>
          (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity) || byName(a, b)
      );
      break;
    case 'updated':
    default:
      list.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Pinned projects float to the top, preserving the chosen sort within.
  const pinned = list.filter((p) => p.pinned);
  const rest = list.filter((p) => !p.pinned);
  return [...pinned, ...rest];
}

/** Tag -> project count, ordered by most used then alphabetical. */
export function tagCounts(projects) {
  const counts = new Map();
  for (const project of projects) {
    for (const tag of project.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Counts for the status filter buttons.
 *
 * Bucket order matters: a project that is both paused and 100% complete is
 * counted as completed, so these numbers always agree with what the
 * "Completed" filter actually shows.
 */
export function statusCounts(projects) {
  return projects.reduce(
    (acc, p) => {
      acc.all += 1;
      if (p.status === 'archived') acc.archived += 1;
      else if (isCompleted(p)) acc.completed += 1;
      else if (p.status === 'paused') acc.paused += 1;
      else acc.active += 1;
      return acc;
    },
    { all: 0, active: 0, paused: 0, completed: 0, archived: 0 }
  );
}

/** Shared by the dialog and the detail drawer. */
export function parseTagInput(raw) {
  return [
    ...new Set(
      String(raw || '')
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean)
    ),
  ].slice(0, 12);
}
