import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Topbar from './components/Topbar.jsx';
import Hero from './components/Hero.jsx';
import StatsBar from './components/StatsBar.jsx';
import ActivityHeatmap from './components/ActivityHeatmap.jsx';
import Toolbar from './components/Toolbar.jsx';
import ProjectList from './components/ProjectList.jsx';
import ProjectDialog from './components/ProjectDialog.jsx';
import ProjectDrawer from './components/ProjectDrawer.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import ShortcutsDialog from './components/ShortcutsDialog.jsx';
import DataDialog from './components/DataDialog.jsx';
import Toast from './components/Toast.jsx';
import { useProjects } from './hooks/useProjects.js';
import { useSettings } from './hooks/useSettings.js';
import { useHotkeys } from './hooks/useHotkeys.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { selectVisible, statusCounts, tagCounts } from './lib/filter.js';
import {
  completedThisWeek,
  currentStreak,
  summaryStats,
} from './lib/insights.js';
import { uid } from './lib/id.js';
import {
  exportJson,
  exportMarkdown,
  printLog,
  parseImport,
  readFile,
  mergeProjects,
} from './lib/transfer.js';
import { buildSampleProjects } from './lib/sample.js';

const UNDO_WINDOW = 6000;

export default function App() {
  const {
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
  } = useProjects();

  const { settings, set: setSettings, toggleTheme, isDark } = useSettings();

  const [query, setQuery] = useLocalStorage('fieldnotes.query.v1', '');
  const [status, setStatus] = useLocalStorage('fieldnotes.status.v1', 'all');
  const [sort, setSort] = useLocalStorage('fieldnotes.sort.v1', 'updated');
  const [tag, setTag] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [drawerId, setDrawerId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [selection, setSelection] = useState(new Set());

  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  const searchRef = useRef(null);

  const showToast = useCallback((message, options = {}) => {
    clearTimeout(toastTimer.current);
    setToast({ message, ...options });
    toastTimer.current = setTimeout(
      () => setToast(null),
      options.action ? UNDO_WINDOW : 2600
    );
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const stats = useMemo(() => summaryStats(projects), [projects]);
  const counts = useMemo(() => statusCounts(projects), [projects]);
  const tags = useMemo(() => tagCounts(projects), [projects]);
  const streak = useMemo(() => currentStreak(projects), [projects]);
  const weekCount = useMemo(() => completedThisWeek(projects), [projects]);

  const visible = useMemo(
    () => selectVisible(projects, { query, status, tag, sort }),
    [projects, query, status, tag, sort]
  );

  const drawerProject = useMemo(
    () => projects.find((p) => p.id === drawerId) || null,
    [projects, drawerId]
  );

  // Surface a real message when storage is full or blocked, instead of
  // silently losing writes.
  useEffect(() => {
    if (storageError === 'quota') {
      showToast('Storage is full. Export a backup and remove a project.', {
        tone: 'error',
      });
    } else if (storageError === 'blocked') {
      showToast('This browser is blocking local storage, so changes will not save.', {
        tone: 'warn',
      });
    }
  }, [storageError, showToast]);
  const openNew = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((project) => {
    setEditing(project);
    setDialogOpen(false);
    setTimeout(() => setDialogOpen(true), 0);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditing(null);
  }, []);

  /**
   * Save handler for the create/edit form.
   *
   * The form edits targets as a plain list of lines, so a target's identity
   * is its position in that list. Matching by position (with a text check
   * first, so reordering keeps the right records) means renaming a target
   * keeps its done state instead of resetting it.
   */
  const handleSave = useCallback(
    (draft) => {
      const previous = draft.existingTargets || [];
      const now = Date.now();

      const targets = draft.targetLines.map((text, index) => {
        // Prefer an untouched line at the same position.
        const positional = previous[index];
        if (positional && positional.text === text) {
          return positional;
        }
        // The line was edited or moved: look for the same text elsewhere
        // before treating it as a brand new target.
        const elsewhere = previous.find((t) => t.text === text);
        if (elsewhere) {
          return { ...elsewhere, order: index };
        }
        // A renamed line: keep the record that used to sit here.
        if (positional && !previous.some((t) => t.text === text)) {
          return { ...positional, text, order: index };
        }
        return {
          id: uid('t'),
          text,
          done: false,
          createdAt: now,
          doneAt: null,
          order: index,
        };
      });

      const fields = {
        name: draft.name,
        problem: draft.problem,
        solution: draft.solution,
        notes: draft.notes,
        tags: draft.tags,
        status: draft.status,
        priority: draft.priority,
        dueDate: draft.dueDate,
        targets,
      };

      if (draft.id) {
        updateProject(draft.id, fields, 'Project updated');
        showToast('Project updated.');
      } else {
        createProject({ ...fields, targetLines: draft.targetLines });
        showToast('Project added to your log.');
      }
      closeDialog();
    },
    [createProject, updateProject, showToast, closeDialog]
  );

  const handleToggleTarget = useCallback(
    (projectId, targetId, done) => {
      toggleTarget(projectId, targetId, done);
    },
    [toggleTarget]
  );

  const handleTogglePin = useCallback(
    (project) => {
      updateProject(project.id, { pinned: !project.pinned });
    },
    [updateProject]
  );

  const handleToggleArchive = useCallback(
    (project) => {
      const next = project.status === 'archived' ? 'active' : 'archived';
      updateProject(
        project.id,
        { status: next, pinned: next === 'archived' ? false : project.pinned },
        next === 'archived' ? 'Archived' : 'Restored from archive'
      );
      showToast(next === 'archived' ? 'Project archived.' : 'Project restored.');
    },
    [updateProject, showToast]
  );

  const handleDuplicate = useCallback(
    (project) => {
      duplicateProject(project.id);
      showToast('Project duplicated.');
    },
    [duplicateProject, showToast]
  );

  /** Removes projects and offers an undo for a short window. */
  const performDelete = useCallback(
    (targets) => {
      const list = Array.isArray(targets) ? targets : [targets];
      if (!list.length) return;
      const removed = projects.filter((p) => list.includes(p.id));
      removeProjects(list);
      setPendingDelete(null);
      setSelection(new Set());
      showToast(
        `${removed.length} project${removed.length === 1 ? '' : 's'} removed.`,
        {
          tone: 'error',
          action: 'Undo',
          onAction: () => {
            restoreProjects(removed);
            showToast('Restored.');
          },
        }
      );
    },
    [projects, removeProjects, restoreProjects, showToast]
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    performDelete(pendingDelete.map((p) => p.id));
  }, [pendingDelete, performDelete]);

  const bulkDelete = useCallback(() => {
    performDelete([...selection]);
  }, [selection, performDelete]);

  const bulkArchive = useCallback(() => {
    const ids = [...selection];
    if (!ids.length) return;
    setProjects((prev) =>
      prev.map((p) =>
        ids.includes(p.id) ? { ...p, status: 'archived', updatedAt: Date.now() } : p
      )
    );
    setSelection(new Set());
    showToast(`${ids.length} project${ids.length === 1 ? '' : 's'} archived.`);
  }, [selection, setProjects, showToast]);

  const toggleSelect = useCallback((id) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelection(new Set()), []);

  const selectAll = useCallback(() => {
    setSelection(new Set(visible.map((p) => p.id)));
  }, [visible]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setStatus('all');
    setTag(null);
  }, [setQuery, setStatus]);

  // Keep the open drawer in sync after an edit or a delete.
  useEffect(() => {
    if (drawerId && !projects.some((p) => p.id === drawerId)) {
      setDrawerId(null);
    }
  }, [projects, drawerId]);

  const handleImportFile = useCallback(
    async (file) => parseImport(await readFile(file)),
    []
  );

  const applyImport = useCallback(
    (incoming, mode) => {
      if (mode === 'replace') {
        replaceAll(incoming);
        showToast(`Replaced your log with ${incoming.length} projects.`);
        setSelection(new Set());
        return;
      }

      const currentIds = new Set(projects.map((p) => p.id));
      const added = incoming.filter((p) => !currentIds.has(p.id)).length;
      replaceAll(mergeProjects(projects, incoming));
      showToast(
        `Merged ${incoming.length} in. ${added} new, ${
          incoming.length - added
        } updated.`
      );
      setSelection(new Set());
    },
    [projects, replaceAll, showToast]
  );

  const commands = useMemo(
    () => [
      { label: 'New project', hint: 'N', keywords: 'add create', action: openNew },
      { label: 'Show archived projects', keywords: 'archive', action: () => setStatus('archived') },
      { label: 'Show all projects', keywords: 'filter reset', action: clearFilters },
      { label: 'Toggle dark theme', keywords: 'dark light appearance', action: toggleTheme },
      { label: 'Export as JSON', keywords: 'backup download', action: () => exportJson(projects) },
      { label: 'Export as Markdown', keywords: 'backup download', action: () => exportMarkdown(projects) },
      { label: 'Print this log', keywords: 'pdf paper', action: () => printLog(projects) },
      { label: 'Import from a file', keywords: 'restore upload', action: () => setDataOpen(true) },
      { label: 'Show keyboard shortcuts', hint: '?', keywords: 'help keys', action: () => setShortcutsOpen(true) },
    ],
    [openNew, clearFilters, toggleTheme, projects]
  );

  useHotkeys(
    {
      n: openNew,
      '/': () => searchRef.current?.focus(),
      '?': () => setShortcutsOpen((v) => !v),
      e: () => {
        if (visible[0]) openEdit(visible[0]);
      },
      'mod+k': () => setPaletteOpen((v) => !v),
    },
    { enabled: !dialogOpen && !drawerProject && !paletteOpen && !dataOpen && !shortcutsOpen }
  );

  return (
    <div className="mx-auto min-h-screen max-w-[1140px] px-[54px] max-sm:px-[23px] max-[420px]:px-[17px]">
      <a href="#main" className="fn-skip">
        Skip to content
      </a>

      <Topbar
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenData={() => setDataOpen(true)}
      />

      <main id="main" className="mx-auto max-w-[900px]">
        <Hero onNew={openNew} projectCount={projects.length} />

        <StatsBar
          stats={stats}
          projects={projects}
          streak={streak}
          weekCount={weekCount}
        />

        <ActivityHeatmap projects={projects} />

        <section className="pb-[58px] pt-[43px] max-sm:pt-[34px]">
          <Toolbar
            query={query}
            onQueryChange={setQuery}
            searchRef={searchRef}
            status={status}
            counts={counts}
            onStatusChange={setStatus}
            sort={sort}
            onSortChange={setSort}
            projectCount={projects.length}
            visibleCount={visible.length}
            tag={tag}
            tags={tags}
            onTagChange={setTag}
            onClearFilters={clearFilters}
            view={settings.view}
            onViewChange={(v) => setSettings({ view: v })}
            selectionCount={selection.size}
            onSelectAll={selectAll}
            onBulkArchive={bulkArchive}
            onBulkDelete={bulkDelete}
            onClearSelection={clearSelection}
          />

          <ProjectList
            projects={visible}
            hasProjects={projects.length}
            onNew={openNew}
            onClearFilters={clearFilters}
            view={settings.view}
            selection={selection}
            onOpen={(p) => setDrawerId(p.id)}
            onEdit={openEdit}
            onDelete={(p) => setPendingDelete([p])}
            onDuplicate={handleDuplicate}
            onToggleTarget={handleToggleTarget}
            onTogglePin={handleTogglePin}
            onToggleSelect={toggleSelect}
            onToggleArchive={handleToggleArchive}
          />
        </section>
      </main>

      <footer className="flex justify-between gap-4 border-t border-[#56674e2e] py-[17px] pb-[22px] font-mono text-[8px] tracking-[0.09em] text-[#989a91]">
        <span>
          FIELDNOTES <span className="mx-[5px] text-[#7a8a6e]">*</span> BUILT
          FOR THE LONG GAME
        </span>
        <span className="font-sans text-[10px] tracking-normal">
          Your work is saved on this device.
        </span>
      </footer>

      <ProjectDialog
        open={dialogOpen}
        editing={editing}
        onClose={closeDialog}
        onSave={handleSave}
      />

      <ProjectDrawer
        project={drawerProject}
        onClose={() => setDrawerId(null)}
        onEdit={openEdit}
        onDelete={(p) => setPendingDelete([p])}
        onToggleTarget={handleToggleTarget}
        onAddTarget={addTarget}
        onTogglePin={handleTogglePin}
        onToggleArchive={handleToggleArchive}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={
          pendingDelete?.length > 1
            ? `Delete ${pendingDelete.length} projects?`
            : `Delete "${pendingDelete?.[0]?.name}"?`
        }
        description="This cannot be undone, but you will get a chance to undo it."
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        projects={visible}
        commands={commands}
        onOpenProject={(p) => setDrawerId(p.id)}
      />

      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <DataDialog
        open={dataOpen}
        onClose={() => setDataOpen(false)}
        projects={projects}
        onExportJson={() => {
          exportJson(projects);
          showToast('Backup downloaded.');
        }}
        onExportMarkdown={() => {
          exportMarkdown(projects);
          showToast('Markdown downloaded.');
        }}
        onPrint={() => printLog(projects)}
        onImport={handleImportFile}
        onLoadSample={() => {
          replaceAll(buildSampleProjects());
          showToast('Sample projects loaded.');
        }}
        onClearAll={() => {
          replaceAll([]);
          setSelection(new Set());
          setDrawerId(null);
          showToast('All projects deleted.', { tone: 'error' });
        }}
      />

      <Toast
        message={toast?.message}
        action={toast?.action}
        onAction={toast?.onAction}
        tone={toast?.tone}
      />
    </div>
  );
}
