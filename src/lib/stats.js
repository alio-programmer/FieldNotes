const DAY = 86400000;

export function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

export function formatDateTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/** For <input type="date">, which needs a plain YYYY-MM-DD string. */
export function toDateInput(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

/** Midnight of the given day, local time. */
export function startOfDay(input = Date.now()) {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole days between two instants, ignoring the time of day. */
export function daysBetween(from, to = Date.now()) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY);
}

/** Whole days until a due date; negative when overdue. */
export function daysUntil(timestamp, now = Date.now()) {
  if (!timestamp) return null;
  return daysBetween(now, timestamp);
}

/** "today" / "tomorrow" / "in 4 days" / "3 days ago" / "overdue by 2 days" */
export function relativeDay(timestamp, now = Date.now()) {
  const diff = daysUntil(timestamp, now);
  if (diff === null) return '';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `in ${diff} days`;
}

export { completion } from './schema.js';

