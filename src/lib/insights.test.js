import { describe, expect, it } from 'vitest';
import {
  activityHeatmap,
  averageDaysToComplete,
  completedThisWeek,
  currentStreak,
  longestRunning,
  nearestToDone,
  progressSeries,
  summaryStats,
} from './insights.js';
import { normalizeProject } from './schema.js';
import { startOfDay } from './stats.js';

const DAY = 86400000;
const NOW = new Date(2024, 0, 10, 12, 0, 0).getTime();
const ago = (days) => NOW - days * DAY;

const p = (over) => normalizeProject(over);

describe('summaryStats', () => {
  it('aggregates across projects', () => {
    const stats = summaryStats([
      p({ targets: [{ text: 'a', done: true }, { text: 'b', done: false }] }),
      p({ targets: [{ text: 'c', done: true }] }),
    ]);
    expect(stats.doneTargets).toBe(2);
    expect(stats.totalTargets).toBe(3);
    expect(stats.overall).toBe(67);
    expect(stats.activeCount).toBe(1);
  });

  it('returns zeroes for an empty list', () => {
    expect(summaryStats([])).toEqual({
      activeCount: 0,
      doneTargets: 0,
      totalTargets: 0,
      overall: 0,
    });
  });
});

describe('currentStreak', () => {
  it('is 0 with no completed targets', () => {
    expect(currentStreak([], NOW)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const project = p({
      targets: [
        { text: 'a', done: true, doneAt: ago(0) },
        { text: 'b', done: true, doneAt: ago(1) },
        { text: 'c', done: true, doneAt: ago(2) },
      ],
    });
    expect(currentStreak([project], NOW)).toBe(3);
  });

  it('tolerates nothing done yet today', () => {
    const project = p({
      targets: [
        { text: 'a', done: true, doneAt: ago(1) },
        { text: 'b', done: true, doneAt: ago(2) },
      ],
    });
    expect(currentStreak([project], NOW)).toBe(2);
  });

  it('breaks on a gap', () => {
    const project = p({
      targets: [
        { text: 'a', done: true, doneAt: ago(0) },
        { text: 'b', done: true, doneAt: ago(5) },
      ],
    });
    expect(currentStreak([project], NOW)).toBe(1);
  });

  it('is 0 when the last activity is too old', () => {
    const project = p({ targets: [{ text: 'a', done: true, doneAt: ago(9) }] });
    expect(currentStreak([project], NOW)).toBe(0);
  });

  it('counts one day once even with several completions', () => {
    const project = p({
      targets: [
        { text: 'a', done: true, doneAt: ago(0) },
        { text: 'b', done: true, doneAt: ago(0) },
      ],
    });
    expect(currentStreak([project], NOW)).toBe(1);
  });
});

describe('completedThisWeek', () => {
  it('counts only the trailing 7 days', () => {
    const project = p({
      targets: [
        { text: 'a', done: true, doneAt: ago(1) },
        { text: 'b', done: true, doneAt: ago(6) },
        { text: 'c', done: true, doneAt: ago(30) },
        { text: 'd', done: false },
      ],
    });
    expect(completedThisWeek([project], NOW)).toBe(2);
  });
});

describe('averageDaysToComplete', () => {
  it('returns null when nothing has been completed', () => {
    expect(averageDaysToComplete([])).toBeNull();
  });

  it('averages creation-to-completion spans', () => {
    const project = p({
      targets: [
        // 2-day span and a 4-day span average to 3.
        { text: 'a', done: true, createdAt: ago(4), doneAt: ago(2) },
        { text: 'b', done: true, createdAt: ago(4), doneAt: ago(0) },
      ],
    });
    expect(averageDaysToComplete([project])).toBe(3);
  });
});

describe('longestRunning / nearestToDone', () => {
  it('returns null when there is nothing active', () => {
    expect(longestRunning([])).toBeNull();
    expect(nearestToDone([])).toBeNull();
  });

  it('finds the oldest active project', () => {
    const projects = [
      p({ name: 'newer', createdAt: ago(1), targets: [{ text: 'a' }] }),
      p({ name: 'older', createdAt: ago(50), targets: [{ text: 'a' }] }),
      p({ name: 'archived', createdAt: ago(90), status: 'archived' }),
    ];
    expect(longestRunning(projects).name).toBe('older');
  });

  it('finds the most complete project', () => {
    const projects = [
      p({ name: 'half', targets: [{ text: 'a', done: true }, { text: 'b' }] }),
      p({ name: 'done', targets: [{ text: 'a', done: true }] }),
    ];
    expect(nearestToDone(projects).name).toBe('done');
  });
});

describe('activityHeatmap', () => {
  it('returns one bucket per day, oldest first', () => {
    const { days } = activityHeatmap([], 2, NOW);
    expect(days).toHaveLength(14);
    expect(days[0].start).toBeLessThan(days[days.length - 1].start);
  });

  it('buckets completed targets into their day', () => {
    const project = p({
      targets: [{ text: 'a', done: true, doneAt: ago(1) }],
    });
    const { days, max } = activityHeatmap([project], 2, NOW);
    expect(days[days.length - 2].count).toBe(1);
    expect(max).toBeGreaterThan(0);
  });

  it('reports max 0 for an empty log', () => {
    expect(activityHeatmap([], 4, NOW).max).toBe(0);
  });
});

describe('progressSeries', () => {
  it('ends at the current completion percentage', () => {
    const project = p({
      createdAt: ago(20),
      targets: [
        { text: 'a', done: true, createdAt: ago(20), doneAt: ago(10) },
        { text: 'b', done: true, createdAt: ago(20), doneAt: ago(1) },
        { text: 'c', done: false, createdAt: ago(20) },
      ],
    });
    const { series } = progressSeries(project, 10, NOW);
    expect(series[0].percent).toBe(0);
    expect(series[series.length - 1].percent).toBe(67);
  });

  it('handles a project with no completed targets', () => {
    const project = p({ createdAt: ago(5), targets: [{ text: 'a' }] });
    const { series } = progressSeries(project, 5, NOW);
    expect(series.every((s) => s.percent === 0)).toBe(true);
  });
});

describe('startOfDay (used by the insight helpers)', () => {
  it('zeroes the time component', () => {
    const d = new Date(startOfDay(ago(3)));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});
