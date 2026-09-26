import { useEffect, useMemo, useRef, useState } from 'react';
import Topbar from './components/Topbar.jsx';
import Hero from './components/Hero.jsx';
import StatsBar from './components/StatsBar.jsx';
import Toolbar from './components/Toolbar.jsx';
import ProjectList from './components/ProjectList.jsx';
import ProjectDialog from './components/ProjectDialog.jsx';
import Toast from './components/Toast.jsx';
import { useProjects } from './hooks/useProjects.js';
import { completion } from './lib/stats.js';

export default function App() {
  const [projects, setProjects] = useProjects();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [newestFirst, setNewestFirst] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const toastTimer = useRef();

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const { activeCount, doneTargets, overall } = useMemo(() => {
    const active = projects.filter((p) => completion(p) < 100).length;
    const done = projects.reduce(
      (sum, p) => sum + p.targets.filter((t) => t.done).length,
      0
    );
    const total = projects.reduce((sum, p) => sum + p.targets.length, 0);
    return {
      activeCount: active,
      doneTargets: done,
      overall: total ? Math.round((done / total) * 100) : 0,
    };
  }, [projects]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects.filter((p) => {
      const percent = completion(p);
      const matches =
        filter === 'all' ||
        (filter === 'active' && percent < 100) ||
        (filter === 'completed' && percent === 100);
      const searchable =
        `${p.name} ${p.problem} ${p.solution} ${p.targets.map((t) => t.text).join(' ')}`.toLowerCase();
      return matches && searchable.includes(q);
    });
    return [...list].sort((a, b) =>
      newestFirst ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt
    );
  }, [projects, query, filter, newestFirst]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setDialogOpen(true);
  };

  const handleSave = ({ name, problem, solution, targetLines }) => {
    const targets = targetLines.map((text) => {
      const old = editing?.targets.find((t) => t.text === text);
      return { text, done: old?.done || false };
    });
    if (editing) {
      const updated = {
        ...editing,
        name,
        problem,
        solution,
        targets,
        updatedAt: Date.now(),
      };
      setProjects((prev) =>
        prev.map((p) => (p.id === editing.id ? updated : p))
      );
      showToast('Project updated.');
    } else {
      const project = {
        id: crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now() + Math.random()),
        name,
        problem,
        solution,
        targets,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setProjects((prev) => [project, ...prev]);
      showToast('Project added to your log.');
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const handleToggleTarget = (id, index, checked) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              targets: p.targets.map((t, i) =>
                i === index ? { ...t, done: checked } : t
              ),
              updatedAt: Date.now(),
            }
          : p
      )
    );
  };

  const requestDelete = (project) => setPendingDelete(project);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setProjects((prev) => prev.filter((p) => p.id !== pendingDelete.id));
    showToast('Project removed.');
    setPendingDelete(null);
  };

  return (
    <div className="mx-auto min-h-screen max-w-[1140px] px-[54px] max-sm:px-[23px] max-[420px]:px-[17px]">
      <Topbar />

      <main className="mx-auto max-w-[900px]">
        <Hero onNew={openNew} />

        <StatsBar
          activeCount={activeCount}
          doneTargets={doneTargets}
          overall={overall}
        />

        <section className="pb-[58px] pt-[43px] max-sm:pt-[34px]">
          <Toolbar
            query={query}
            setQuery={setQuery}
            filter={filter}
            setFilter={setFilter}
            total={projects.length}
            newestFirst={newestFirst}
            onToggleSort={() => setNewestFirst((v) => !v)}
            projectCount={projects.length}
          />
          <ProjectList
            projects={visible}
            hasProjects={projects.length > 0}
            onNew={openNew}
            onEdit={openEdit}
            onDelete={requestDelete}
            onToggleTarget={handleToggleTarget}
          />
        </section>
      </main>

      <footer className="flex justify-between gap-4 border-t border-[#56674e2e] py-[17px] pb-[22px] font-mono text-[8px] tracking-[0.09em] text-[#989a91]">
        <span>
          FIELDNOTES <span className="mx-[5px] text-[#7a8a6e]">✳</span> BUILT
          FOR THE LONG GAME
        </span>
        <span className="font-sans text-[10px] tracking-normal">
          Your work is saved on this device.
        </span>
      </footer>

      <ProjectDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#22291f75] p-4">
          <div className="w-[min(420px,100%)] rounded-md border border-[#e4e3d9] bg-[#faf9f4] p-6">
            <h3 className="m-0 font-display text-[18px] font-semibold">
              Delete “{pendingDelete.name}”?
            </h3>
            <p className="mb-0 mt-2 text-[12px] text-[#898c83]">
              This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="cursor-pointer border-0 bg-transparent px-3 py-2.5 font-sans text-[11px] text-[#85877f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="cursor-pointer rounded border-0 bg-[#8a3b2e] px-4 py-2.5 font-sans text-[12px] font-medium text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}
