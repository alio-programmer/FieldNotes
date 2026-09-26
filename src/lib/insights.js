import { completion } from './schema.js';
import { daysBetween, startOfDay } from './stats.js';

const DAY = 86400000;

/** Headline numbers for the stats bar. */
export function summaryStats(projects) {
  const totalTargets = projects.reduce(
    (sum, p) => sum + (p.targets?.length || 0),
    0
  );
  const doneTargets = projects.reduce(
    (sum, p) => sum + (p.targets || []).filter((t) => t.done).length,
    0
  );
  const active = projects.filter(
    (p) => p.status === 'active' && completion(p) < 100
  ).length;

  return {
    activeCount: active,
    doneTargets,
    totalTargets,
    overall: totalTargets ? Math.round((doneTargets / totalTargets) * 100) : 0,
  };
}

/**
 * Consecutive days (ending today or yesterday) with at least one
 * completed target. An empty log means no streak, not an infinite one.
 */
export function currentStreak(projects, now = Date.now()) {
  const days = new Set();
  for (const project of projects) {
    for (const target of project.targets || []) {
      if (target.done && target.doneAt) {
        days.add(startOfDay(target.doneAt));
      }
    }
  }
  if (!days.size) return 0;

  const today = startOfDay(now);
  // Allow the streak to start yesterday so it does not break before you
  // have done anything today.
  let cursor = days.has(today) ? today : today - DAY;
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

/** Targets completed in the trailing 7 days. */
export function completedThisWeek(projects, now = Date.now()) {
  const cutoff = now - 7 * DAY;
  let count = 0;
  for (const project of projects) {
    for (const target of project.targets || []) {
      if (target.done && target.doneAt && target.doneAt >= cutoff) count += 1;
    }
  }
  return count;
}

/** Mean days between a target being created and completed. */
export function averageDaysToComplete(projects) {
  const spans = [];
  for (const project of projects) {
    for (const target of project.targets || []) {
      if (target.done && target.doneAt && target.createdAt) {
        const days = daysBetween(target.createdAt, target.doneAt);
        if (days >= 0) spans.push(days);
      }
    }
  }
  if (!spans.length) return null;
  return Math.round(spans.reduce((a, b) => a + b, 0) / spans.length);
}

/** The active project that has been going the longest. */
export function longestRunning(projects) {
  const active = projects.filter(
    (p) => p.status === 'active' && completion(p) < 100
  );
  if (!active.length) return null;
  return active.reduce((oldest, p) =>
    p.createdAt < oldest.createdAt ? p : oldest
  );
}

/** The project closest to finishing. */
export function nearestToDone(projects) {
  const candidates = projects.filter(
    (p) => p.status !== 'archived' && (p.targets?.length || 0) > 0
  );
  if (!candidates.length) return null;
  return candidates.reduce((best, p) =>
    completion(p) > completion(best) ? p : best
  );
}

/**
 * Per-day completion counts for the last `weeks` weeks, oldest first.
 * @returns {{ days: {date:number, start:number, count:number}[], max:number }}
 */
export function activityHeatmap(projects, weeks = 12, now = Date.now()) {
  const today = startOfDay(now);
  const start = today - (weeks * 7 - 1) * DAY;
  const counts = new Map();

  for (const project of projects) {
    for (const entry of project.activity || []) {
      const day = startOfDay(entry.at);
      if (day >= start) counts.set(day, (counts.get(day) || 0) + 1);
    }
    for (const target of project.targets || []) {
      if (!target.done || !target.doneAt) continue;
      const day = startOfDay(target.doneAt);
      if (day >= start) counts.set(day, (counts.get(day) || 0) + 1);
    }
  }

  const days = [];
  let max = 0;
  for (let i = 0; i < weeks * 7; i += 1) {
    const dayStart = start + i * DAY;
    const count = counts.get(dayStart) || 0;
    if (count > max) max = count;
    days.push({ date: dayStart, start: dayStart, count });
  }

  return { days, max };
}

/**
 * Completion percentage over time for one project, sampled weekly, for
 * the drawer sparkline. Points are derived from target doneAt timestamps.
 */
export function progressSeries(project, points = 12, now = Date.now()) {
  const targets = project?.targets || [];
  const total = targets.length;
  const series = [{ at: project?.createdAt ?? now, percent: 0 }];

  const completed = targets
    .filter((t) => t.done && t.doneAt)
    .map((t) => t.doneAt)
    .sort((a, b) => a - b);

  if (!total || !completed.length) {
    return { series, max: 100 };
  }

  const from = project.createdAt ?? completed[0];
  const span = Math.max(now - from, DAY);
  const step = span / Math.max(points - 1, 1);

  for (let i = 1; i < points; i += 1) {
    const at = from + step * i;
    const doneBy = completed.filter((t) => t <= at).length;
    series.push({ at, percent: Math.round((doneBy / total) * 100) });
  }

  return { series, max: 100 };
}
