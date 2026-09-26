export function completion(project) {
  if (!project.targets.length) return 0;
  const done = project.targets.filter((t) => t.done).length;
  return Math.round((done / project.targets.length) * 100);
}

export function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

export function todayLabel(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
    .format(date)
    .toUpperCase();
}

export function periodLabel(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase();
}
