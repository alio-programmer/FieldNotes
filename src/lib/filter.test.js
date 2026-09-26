import { describe, expect, it } from 'vitest';
import {
  isCompleted,
  parseTagInput,
  selectVisible,
  statusCounts,
  tagCounts,
} from './filter.js';
import { normalizeProject } from './schema.js';

const p = (over) => normalizeProject(over);

const sample = () => [
  p({
    id: 'a',
    name: 'Alpha website',
    problem: 'Need a landing page',
    tags: ['web', 'design'],
    status: 'active',
    updatedAt: 300,
    createdAt: 100,
    targets: [
      { id: 'a1', text: 'Sketch', done: true, doneAt: 10 },
      { id: 'a2', text: 'Build', done: false },
    ],
  }),
  p({
    id: 'b',
    name: 'Beta mobile app',
    problem: 'Customers want an app',
    tags: ['mobile'],
    status: 'paused',
    updatedAt: 200,
    createdAt: 200,
    targets: [
      { id: 'b1', text: 'Spec', done: true },
      { id: 'b2', text: 'Build', done: true },
    ],
  }),
  p({
    id: 'd',
    name: 'Delta research',
    problem: 'Gather user interviews',
    tags: ['research'],
    status: 'paused',
    updatedAt: 400,
    createdAt: 400,
    targets: [
      { id: 'd1', text: 'Recruit', done: true },
      { id: 'd2', text: 'Interview', done: false },
    ],
  }),
  p({
    id: 'c',
    name: 'Gamma docs',
    status: 'archived',
    updatedAt: 100,
    createdAt: 50,
    tags: ['web'],
  }),
];

describe('isCompleted', () => {
  it('is false when there are no targets', () => {
    expect(isCompleted(p({ targets: [] }))).toBe(false);
  });

  it('is true only when every target is done', () => {
    expect(
      isCompleted(
        p({ targets: [{ text: 'a', done: true }, { text: 'b', done: true }] })
      )
    ).toBe(true);
    expect(
      isCompleted(
        p({ targets: [{ text: 'a', done: true }, { text: 'b', done: false }] })
      )
    ).toBe(false);
  });
});

describe('selectVisible', () => {
  it('hides archived projects by default', () => {
    const names = selectVisible(sample()).map((x) => x.name);
    expect(names).not.toContain('Gamma docs');
  });

  it('shows only archived projects for the archived filter', () => {
    const names = selectVisible(sample(), { status: 'archived' }).map(
      (x) => x.name
    );
    expect(names).toEqual(['Gamma docs']);
  });

  it('separates active, paused and completed', () => {
    const s = sample();
    // Beta is paused yet 100% done, so the completed filter still shows it.
    expect(
      selectVisible(s, { status: 'completed' }).map((x) => x.name).sort()
    ).toEqual(['Beta mobile app']);
    expect(
      selectVisible(s, { status: 'paused' }).map((x) => x.name).sort()
    ).toEqual(['Beta mobile app', 'Delta research']);
    expect(selectVisible(s, { status: 'active' }).map((x) => x.name)).toEqual([
      'Alpha website',
    ]);
  });

  it('searches name, problem, notes, tags and target text', () => {
    const s = sample();
    expect(selectVisible(s, { query: 'beta' })).toHaveLength(1);
    expect(selectVisible(s, { query: 'landing' })).toHaveLength(1);
    expect(selectVisible(s, { query: 'mobile' })[0].name).toBe('Beta mobile app');
    expect(selectVisible(s, { query: 'sketch' })[0].name).toBe('Alpha website');
    expect(selectVisible(s, { query: 'ZZZ' })).toHaveLength(0);
  });

  it('ignores case and surrounding whitespace in the query', () => {
    expect(selectVisible(sample(), { query: '  ALPHA  ' })).toHaveLength(1);
  });

  it('filters by tag', () => {
    const names = selectVisible(sample(), { tag: 'web' }).map((x) => x.name);
    expect(names).toEqual(['Alpha website']);
  });

  it('sorts by name, created and progress', () => {
    const s = [sample()[0], sample()[1]];
    expect(selectVisible(s, { sort: 'name' }).map((x) => x.name)).toEqual([
      'Alpha website',
      'Beta mobile app',
    ]);
    expect(selectVisible(s, { sort: 'created' })[0].name).toBe(
      'Beta mobile app'
    );
    // Beta is 100% complete, Alpha is 50%, so Beta sorts first.
    expect(selectVisible(s, { sort: 'progress' })[0].name).toBe(
      'Beta mobile app'
    );
  });

  it('sorts projects without a due date last', () => {
    const s = [
      p({ id: 'x', name: 'No due', updatedAt: 2 }),
      p({ id: 'y', name: 'Has due', updatedAt: 1, dueDate: 5000 }),
    ];
    expect(selectVisible(s, { sort: 'due' }).map((o) => o.name)).toEqual([
      'Has due',
      'No due',
    ]);
  });

  it('floats pinned projects to the top', () => {
    const s = [
      p({ id: 'new', name: 'Newest', updatedAt: 999, pinned: false }),
      p({ id: 'old', name: 'Pinned', updatedAt: 1, pinned: true }),
    ];
    expect(selectVisible(s).map((x) => x.name)).toEqual(['Pinned', 'Newest']);
  });

  it('combines search, tag and status filters', () => {
    const s = sample();
    const out = selectVisible(s, { status: 'active', tag: 'web', query: 'alpha' });
    expect(out).toHaveLength(1);
  });

  it('returns an empty array for an empty collection', () => {
    expect(selectVisible([])).toEqual([]);
  });
});

describe('tagCounts', () => {
  it('counts tag usage, most used first', () => {
    expect(tagCounts(sample())).toEqual([
      { tag: 'web', count: 2 },
      { tag: 'design', count: 1 },
      { tag: 'mobile', count: 1 },
      { tag: 'research', count: 1 },
    ]);
  });
});

describe('statusCounts', () => {
  it('tallies each bucket', () => {
    const counts = statusCounts(sample());
    expect(counts.all).toBe(4);
    // Alpha (50%) and Delta (50%) are not done, so they count as active/paused.
    expect(counts.active).toBe(1);
    expect(counts.paused).toBe(1);
    expect(counts.archived).toBe(1);
    // Beta is paused but 100% done, so it counts as completed.
    expect(counts.completed).toBe(1);
  });
});

describe('parseTagInput', () => {
  it('splits, trims, de-duplicates and strips leading #', () => {
    expect(parseTagInput('a, #b ,a, c')).toEqual(['a', 'b', 'c']);
  });

  it('handles empty and non-string input', () => {
    expect(parseTagInput('')).toEqual([]);
    expect(parseTagInput(null)).toEqual([]);
    expect(parseTagInput(undefined)).toEqual([]);
  });
});
