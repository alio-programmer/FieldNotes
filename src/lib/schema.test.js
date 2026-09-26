import { describe, expect, it } from 'vitest';
import {
  CURRENT_VERSION,
  completion,
  migrate,
  normalizeProject,
  serialize,
} from './schema.js';

describe('migrate', () => {
  it('returns an empty store for null/undefined', () => {
    expect(migrate(null).projects).toEqual([]);
    expect(migrate(undefined).projects).toEqual([]);
  });

  it('returns an empty store for corrupt non-array input', () => {
    expect(migrate('nonsense').projects).toEqual([]);
    expect(migrate(42).projects).toEqual([]);
    expect(migrate({ nope: true }).projects).toEqual([]);
  });

  it('drops entries that are not objects', () => {
    const result = migrate([null, 'x', 7, { name: 'Real' }]);
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].name).toBe('Real');
  });

  it('upgrades a v1 array into the current envelope', () => {
    const legacy = [
      {
        id: 'abc',
        name: 'Legacy project',
        problem: 'old problem',
        solution: 'old solution',
        targets: [
          { text: 'First', done: true },
          { text: 'Second', done: false },
        ],
        createdAt: 1000,
        updatedAt: 2000,
      },
    ];

    const { version, projects } = migrate(legacy);

    expect(version).toBe(CURRENT_VERSION);
    expect(projects).toHaveLength(1);

    const p = projects[0];
    expect(p.id).toBe('abc');
    expect(p.name).toBe('Legacy project');
    expect(p.createdAt).toBe(1000);
    expect(p.updatedAt).toBe(2000);
    // done-state must survive the upgrade
    expect(p.targets.map((t) => t.text)).toEqual(['First', 'Second']);
    expect(p.targets[0].done).toBe(true);
    expect(p.targets[1].done).toBe(false);
  });

  it('gives every migrated target a unique stable id', () => {
    const { projects } = migrate([
      { name: 'Dupes', targets: [{ text: 'Same' }, { text: 'Same' }] },
    ]);
    const [a, b] = projects[0].targets;
    expect(a.id).toBeTruthy();
    expect(b.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
  });

  it('accepts a string target as a not-done item', () => {
    const { projects } = migrate([{ name: 'P', targets: ['One', 'Two'] }]);
    expect(projects[0].targets.map((t) => t.text)).toEqual(['One', 'Two']);
    expect(projects[0].targets.every((t) => t.done === false)).toBe(true);
  });

  it('reads back its own serialized output losslessly', () => {
    const original = [
      {
        name: 'Round trip',
        problem: 'p',
        solution: 's',
        notes: '# hi',
        tags: ['a', 'b'],
        targets: [{ text: 'x', done: true }],
      },
    ];
    const { projects: first } = migrate(original);
    const { projects: second } = migrate(JSON.parse(serialize(first)));

    expect(second[0].name).toBe(first[0].name);
    expect(second[0].tags).toEqual(['a', 'b']);
    expect(second[0].notes).toBe('# hi');
    expect(second[0].targets[0].id).toBe(first[0].targets[0].id);
    expect(second[0].targets[0].done).toBe(true);
  });
});

describe('normalizeProject', () => {
  it('supplies defaults for every missing field', () => {
    const p = normalizeProject({});
    expect(p.name).toBe('Untitled project');
    expect(p.status).toBe('active');
    expect(p.priority).toBe('medium');
    expect(p.tags).toEqual([]);
    expect(p.pinned).toBe(false);
    expect(p.dueDate).toBeNull();
    expect(p.targets).toEqual([]);
    expect(p.activity).toEqual([]);
    expect(typeof p.id).toBe('string');
    expect(p.createdAt).toBeGreaterThan(0);
  });

  it('rejects invalid status and priority values', () => {
    const p = normalizeProject({ status: 'bogus', priority: 'urgent' });
    expect(p.status).toBe('active');
    expect(p.priority).toBe('medium');
  });

  it('de-duplicates and trims tags', () => {
    const p = normalizeProject({ tags: [' x ', 'x', '', 'y'] });
    expect(p.tags).toEqual(['x', 'y']);
  });

  it('drops targets with empty text', () => {
    const p = normalizeProject({ targets: [{ text: '  ' }, { text: 'ok' }] });
    expect(p.targets).toHaveLength(1);
  });

  it('nulls doneAt when a target is not done', () => {
    const p = normalizeProject({ targets: [{ text: 'x', done: false, doneAt: 5 }] });
    expect(p.targets[0].doneAt).toBeNull();
  });

  it('survives being handed a non-object', () => {
    expect(() => normalizeProject(null)).not.toThrow();
    expect(() => normalizeProject(undefined)).not.toThrow();
  });
});

describe('completion', () => {
  it('returns 0 for no targets', () => {
    expect(completion({ targets: [] })).toBe(0);
    expect(completion({})).toBe(0);
  });

  it('rounds to a whole percentage', () => {
    expect(completion({ targets: [{ done: true }, { done: false }] })).toBe(50);
    expect(
      completion({ targets: [{ done: true }, { done: false }, { done: false }] })
    ).toBe(33);
    expect(completion({ targets: [{ done: true }] })).toBe(100);
  });
});
