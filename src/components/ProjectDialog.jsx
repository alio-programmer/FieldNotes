import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import { Eyebrow } from './Hero.jsx';
import { PRIORITIES, STATUSES } from '../lib/schema.js';
import { parseTagInput } from '../lib/filter.js';
import { toDateInput } from '../lib/stats.js';

const STATUS_LABEL = {
  active: 'In progress',
  paused: 'Paused',
  archived: 'Archived',
};

const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' };

/** Label row with an optional right-aligned hint. */
function FieldLabel({ text, hint, htmlFor }) {
  return (
    <label className="fn-label" htmlFor={htmlFor}>
      <span>
        {text} {hint && <span className="fn-label-hint">{hint}</span>}
      </span>
    </label>
  );
}

/**
 * Create/edit form. Targets are edited as one-per-line text; on save the
 * caller matches lines to existing targets by id so a rename keeps its
 * done state.
 */
export default function ProjectDialog({ open, editing, onClose, onSave }) {
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [notes, setNotes] = useState('');
  const [targets, setTargets] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('active');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name || '');
    setProblem(editing?.problem || '');
    setSolution(editing?.solution || '');
    setNotes(editing?.notes || '');
    setTags((editing?.tags || []).join(', '));
    setStatus(editing?.status || 'active');
    setPriority(editing?.priority || 'medium');
    setDueDate(toDateInput(editing?.dueDate));
    setTargets((editing?.targets || []).map((t) => t.text).join('\n'));
    setShowAdvanced(
      Boolean(
        editing?.notes ||
          editing?.tags?.length ||
          editing?.dueDate ||
          (editing && editing.status !== 'active') ||
          (editing && editing.priority !== 'medium')
      )
    );
  }, [open, editing]);

  // Cmd/Ctrl+Enter saves without leaving the textarea.
  const onKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const parsedTags = useMemo(() => parseTagInput(tags), [tags]);

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      problem: problem.trim(),
      solution: solution.trim(),
      notes: notes.trim(),
      targetLines: targets
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean),
      tags: parsedTags,
      status,
      priority,
      dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).getTime() : null,
      existingTargets: editing?.targets || [],
      id: editing?.id,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="project-dialog-title"
      className="fn-panel"
    >
      <form onSubmit={handleSubmit} onKeyDown={onKeyDown}>
        <div className="flex items-center justify-between">
          <Eyebrow>{editing ? 'REFINING' : 'A NEW BEGINNING'}</Eyebrow>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="fn-icon-btn text-[24px] leading-none"
          >
            ×
          </button>
        </div>
        <h2 id="project-dialog-title" className="fn-dialog-title">
          {editing ? 'Shape this project' : 'Start a project'}
        </h2>
        <p className="fn-dialog-sub">
          Give the idea a name, then make the next steps visible.
        </p>

        <FieldLabel text="PROJECT NAME" hint="Required" />
        <input
          data-autofocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          placeholder="e.g. A better morning routine"
          className="fn-text-field"
        />

        <FieldLabel text="THE PROBLEM" hint="What needs to change?" />
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Describe the challenge you’re taking on…"
          className="fn-text-field"
        />

        <FieldLabel text="YOUR APPROACH" hint="What might help?" />
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Sketch out your proposed solution…"
          className="fn-text-field"
        />

        <FieldLabel text="TARGETS" hint="One per line" />
        <textarea
          value={targets}
          onChange={(e) => setTargets(e.target.value)}
          rows={4}
          placeholder={
            'Talk to three potential users\nMap the first version\nShare a working prototype'
          }
          className="fn-text-field"
        />
        {editing && editing.targets.length > 0 && (
          <p className="fn-field-note">
            Renaming a target keeps it checked. Deleting a line removes the
            target.
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="fn-disclosure"
        >
          <span
            className={`inline-block transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            aria-hidden="true"
          >
            ›
          </span>{' '}
          More details
        </button>

        {showAdvanced && (
          <div className="fn-advanced">
            <FieldLabel text="NOTES" hint="Markdown supported" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={20000}
              placeholder={
                '# Findings\n\n- Interviews point to **speed**\n- Latency matters most'
              }
              className="fn-text-field font-mono"
            />

            <FieldLabel text="TAGS" hint="Comma separated" />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              maxLength={200}
              placeholder="web, design, q1"
              className="fn-text-field"
            />
            {parsedTags.length > 0 && (
              <p className="fn-field-note">
                {parsedTags.map((t) => `#${t}`).join(' ')}
              </p>
            )}

            <div className="fn-grid-2">
              <div>
                <FieldLabel text="STATUS" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="fn-text-field"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel text="PRIORITY" />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="fn-text-field"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <FieldLabel text="DUE DATE" hint="Optional" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="fn-text-field"
            />
          </div>
        )}

        <div className="fn-dialog-actions">
          <button type="button" onClick={onClose} className="fn-btn-quiet">
            Cancel
          </button>
          <button type="submit" className="fn-btn-primary">
            Save project <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
