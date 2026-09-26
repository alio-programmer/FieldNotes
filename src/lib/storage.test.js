import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BLOCKED_ERROR,
  QUOTA_ERROR,
  clearProjects,
  loadProjects,
  readRaw,
  storageSize,
  writeProjects,
} from './storage.js';
import { LEGACY_KEY, STORAGE_KEY, serialize } from './schema.js';

const project = (name) => ({ name, targets: [] });

describe('loadProjects', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(loadProjects()).toEqual([]);
  });

  it('reads the v2 store', () => {
    localStorage.setItem(STORAGE_KEY, serialize([project('A')]));
    expect(loadProjects()).toHaveLength(1);
    expect(loadProjects()[0].name).toBe('A');
  });

  it('migrates a legacy v1 array on first read', () => {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify([
        {
          id: 'legacy-1',
          name: 'Old project',
          targets: [{ text: 'Task', done: true }],
        },
      ])
    );

    const projects = loadProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('legacy-1');
    expect(projects[0].targets[0].done).toBe(true);
    expect(projects[0].targets[0].id).toBeTruthy();
  });

  it('rewrites the legacy data into the v2 store', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify([project('Old')]));
    loadProjects();
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });

  it('leaves the legacy key intact as a backup', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify([project('Old')]));
    loadProjects();
    expect(localStorage.getItem(LEGACY_KEY)).toBeTruthy();
  });

  it('falls back to the legacy key when v2 is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{ broken');
    localStorage.setItem(LEGACY_KEY, JSON.stringify([project('Rescued')]));
    expect(loadProjects()[0].name).toBe('Rescued');
  });

  it('returns an empty array when both keys are unusable', () => {
    localStorage.setItem(STORAGE_KEY, '{ broken');
    localStorage.setItem(LEGACY_KEY, 'also broken');
    expect(loadProjects()).toEqual([]);
  });
});

describe('writeProjects', () => {
  it('reports success', () => {
    const result = writeProjects([project('A')]);
    expect(result).toEqual({ ok: true, error: null });
  });

  it('classifies a quota error', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const error = new Error('full');
      error.name = 'QuotaExceededError';
      throw error;
    });
    const result = writeProjects([project('A')]);
    expect(result).toEqual({ ok: false, error: QUOTA_ERROR });
    spy.mockRestore();
  });

  it('classifies a blocked-storage error', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const result = writeProjects([project('A')]);
    expect(result).toEqual({ ok: false, error: BLOCKED_ERROR });
    spy.mockRestore();
  });
});

describe('helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clearProjects empties the v2 key', () => {
    writeProjects([project('A')]);
    expect(clearProjects()).toBe(true);
    expect(loadProjects()).toEqual([]);
  });

  it('readRaw returns a string even with nothing stored', () => {
    expect(typeof readRaw()).toBe('string');
  });

  it('readRaw prefers the v2 payload', () => {
    writeProjects([project('A')]);
    expect(readRaw()).toContain('A');
  });

  it('storageSize grows with the payload', () => {
    expect(storageSize()).toBe(0);
    writeProjects([project('A reasonably long project name')]);
    expect(storageSize()).toBeGreaterThan(0);
  });
});
