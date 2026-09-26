import { useCallback, useEffect, useState } from 'react';
import { loadProjects, writeProjects } from '../lib/storage.js';
import { uid } from '../lib/id.js';

const ACTIVITY_LIMIT = 100;

function withActivity(project, entry) {
  const now = Date.now();
  return {
    ...project,
    updatedAt: now,
    activity: [{ id: uid('a'), at: now, ...entry }, ...(project.activity || [])]
      .slice(0, ACTIVITY_LIMIT),
  };
}

/**
 * Owns the project collection and persists it. Migration from the legacy
 * schema happens inside storage.loadProjects.
 */
export function useProjects() {
  const [projects, setProjects] = useState(loadProjects);
  const [storageError, setStorageError] = useState(null);

  useEffect(() => {
    const { ok, error } = writeProjects(projects);
    setStorageError(ok ? null : error);
  }, [projects]);

  const createProject = useCallback((draft) => {
    const now = Date.now();
    const project = {
      id: uid('p'),
      name: draft.name?.trim() || 'Untitled project',
      problem: draft.problem?.trim() || '',
      solution: draft.solution?.trim() || '',
      notes: draft.notes?.trim() || '',
      status: draft.status || 'active',
      priority: draft.priority || 'medium',
      tags: draft.tags || [],
      pinned: false,
      dueDate: draft.dueDate || null,
      targets: (draft.targetLines || [])
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text) => ({
          id: uid('t'),
          text,
          done: false,
          createdAt: now,
          doneAt: null,
        })),
      activity: [
        { id: uid('a'), type: 'created', text: 'Project created', at: now },
      ],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    setProjects((prev) => [project, ...prev]);
    return project;
  }, []);

  /**
   * Updates a project. Targets are matched by stable id, so renaming a
   * target no longer resets its done state.
   */
  const updateProject = useCallback((id, patch, activityText) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...patch };
        return activityText
          ? withActivity(next, { type: 'updated', text: activityText })
          : { ...next, updatedAt: Date.now() };
      })
    );
  }, []);

  const toggleTarget = useCallback((projectId, targetId, done) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const target = p.targets.find((t) => t.id === targetId);
        return withActivity(
          {
            ...p,
            targets: p.targets.map((t) =>
              t.id === targetId
                ? { ...t, done, doneAt: done ? Date.now() : null }
                : t
            ),
          },
          {
            type: done ? 'target-done' : 'target-undone',
            text: `${done ? 'Completed' : 'Reopened'} “${
              target?.text ?? 'target'
            }”`,
          }
        );
      })
    );
  }, []);

  const addTarget = useCallback((projectId, text) => {
    const clean = text.trim();
    if (!clean) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? withActivity(
              {
                ...p,
                targets: [
                  ...p.targets,
                  {
                    id: uid('t'),
                    text: clean,
                    done: false,
                    createdAt: Date.now(),
                    doneAt: null,
                  },
                ],
              },
              { type: 'target-added', text: `Added “${clean}”` }
            )
          : p
      )
    );
  }, []);

  const removeProjects = useCallback((ids) => {
    const set = new Set(Array.isArray(ids) ? ids : [ids]);
    setProjects((prev) => prev.filter((p) => !set.has(p.id)));
  }, []);

  /** Re-inserts previously deleted projects, preserving their ids. */
  const restoreProjects = useCallback((projectsToRestore) => {
    setProjects((prev) => {
      const existing = new Set(prev.map((p) => p.id));
      return [...projectsToRestore.filter((p) => !existing.has(p.id)), ...prev];
    });
  }, []);

  const replaceAll = useCallback((next) => setProjects(next), []);

  const duplicateProject = useCallback((id) => {
    setProjects((prev) => {
      const source = prev.find((p) => p.id === id);
      if (!source) return prev;
      const now = Date.now();
      const copy = {
        ...source,
        id: uid('p'),
        name: `${source.name} (copy)`,
        pinned: false,
        status: 'active',
        completedAt: null,
        createdAt: now,
        updatedAt: now,
        targets: source.targets.map((t) => ({
          ...t,
          id: uid('t'),
          done: false,
          doneAt: null,
          createdAt: now,
        })),
        activity: [
          { id: uid('a'), type: 'created', text: 'Duplicated', at: now },
        ],
      };
      return [copy, ...prev];
    });
  }, []);

  return {
    projects,
    setProjects,
    storageError,
    createProject,
    updateProject,
    toggleTarget,
    addTarget,
    removeProjects,
    restoreProjects,
    replaceAll,
    duplicateProject,
  };
}

