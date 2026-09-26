import { describe, expect, it } from 'vitest';
import { IMPORT_ERRORS, mergeProjects, parseImport, toMarkdown } from './transfer.js';
import { serialize } from './schema.js';
import { normalizeProject } from './schema.js';

const p = (over) => normalizeProject(over);

describe('parseImport', () => {
  it('rejects unparseable JSON', () => {
    const result = parseImport('{ not json');
    expect(result).toEqual({ ok: false, error: IMPORT_ERRORS.unreadable });
  });

  it('rejects a file with no projects', () => {
    expect(parseImport('[]')).toEqual({
      ok: false,
      error: IMPORT_ERRORS.shape,
    });
    expect(parseImport('{}')).toEqual({
      ok: false,
      error: IMPORT_ERRORS.shape,
    });
  });

  it('accepts a v2 envelope', () => {
    const result = parseImport(
      serialize([p({ name: 'Imported', targets: [{ text: 'a', done: true }] })])
    );
    expect(result.ok).toBe(true);
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].name).toBe('Imported');
    expect(result.projects[0].targets[0].done).toBe(true);
  });

  it('accepts a legacy v1 array', () => {
    const result = parseImport(
      JSON.stringify([
        { name: 'Legacy', targets: [{ text: 'x', done: true }] },
      ])
    );
    expect(result.ok).toBe(true);
    expect(result.projects[0].name).toBe('Legacy');
    expect(result.projects[0].targets[0].id).toBeTruthy();
  });

  it('normalizes partial records on the way in', () => {
    const result = parseImport(JSON.stringify([{ name: 'Sparse' }]));
    expect(result.ok).toBe(true);
    expect(result.projects[0].status).toBe('active');
    expect(result.projects[0].targets).toEqual([]);
  });
});

describe('mergeProjects', () => {
  it('replaces matching ids and appends new ones', () => {
    const current = [p({ id: '1', name: 'Old' }), p({ id: '2', name: 'Keep' })];
    const incoming = [p({ id: '1', name: 'New' }), p({ id: '3', name: 'Fresh' })];

    const merged = mergeProjects(current, incoming);
    const byId = Object.fromEntries(merged.map((x) => [x.id, x.name]));

    expect(merged).toHaveLength(3);
    expect(byId['1']).toBe('New');
    expect(byId['2']).toBe('Keep');
    expect(byId['3']).toBe('Fresh');
  });

  it('does not duplicate when ids overlap', () => {
    const a = [p({ id: '1', name: 'Same' })];
    expect(mergeProjects(a, [p({ id: '1', name: 'Same' })])).toHaveLength(1);
  });
});

describe('toMarkdown', () => {
  it('renders a project with a title and checkboxes', () => {
    const md = toMarkdown([
      p({
        name: 'My project',
        problem: 'The problem',
        solution: 'The approach',
        tags: ['web'],
        targets: [
          { text: 'First', done: true },
          { text: 'Second', done: false },
        ],
      }),
    ]);

    expect(md).toContain('# My project');
    expect(md).toContain('## The problem');
    expect(md).toContain('The approach');
    expect(md).toContain('#web');
    expect(md).toContain('- [x] First');
    expect(md).toContain('- [ ] Second');
  });

  it('omits empty sections', () => {
    const md = toMarkdown([p({ name: 'Bare' })]);
    expect(md).not.toContain('## The problem');
    expect(md).not.toContain('## Targets');
  });

  it('separates multiple projects', () => {
    const md = toMarkdown([p({ name: 'One' }), p({ name: 'Two' })]);
    expect(md).toContain('---');
  });
});
