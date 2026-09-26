import { completion, migrate, serialize } from './schema.js';
import { formatDate } from './stats.js';

/** Triggers a browser download without leaving the page. */
export function downloadFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function timestampSlug(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}`
  );
}

export function exportJson(projects) {
  return downloadFile(
    `fieldnotes-${timestampSlug()}.json`,
    serialize(projects)
  );
}

function projectToMarkdown(p) {
  const lines = [];
  lines.push(`# ${p.name}`);
  lines.push('');
  lines.push(
    `_${p.status} · ${completion(p)}% complete · started ${formatDate(
      p.createdAt
    )}_`
  );
  if (p.tags?.length) lines.push(`\nTags: ${p.tags.map((t) => `#${t}`).join(' ')}`);
  if (p.dueDate) lines.push(`\nDue: ${formatDate(p.dueDate)}`);

  const section = (heading, body) => {
    if (!body) return;
    lines.push('', `## ${heading}`, '', body);
  };

  section('The problem', p.problem);
  section('Proposed approach', p.solution);
  section('Notes', p.notes);

  if (p.targets?.length) {
    lines.push('', '## Targets', '');
    for (const t of p.targets) {
      lines.push(`- [${t.done ? 'x' : ' '}] ${t.text}`);
    }
  }

  return lines.join('\n');
}

export function toMarkdown(projects) {
  return projects.map(projectToMarkdown).join('\n\n---\n\n');
}

export function exportMarkdown(projects) {
  return downloadFile(
    `fieldnotes-${timestampSlug()}.md`,
    toMarkdown(projects),
    'text/markdown'
  );
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function projectToHtml(p) {
  const section = (heading, body) =>
    body
      ? `<h3>${escapeHtml(heading)}</h3><p>${escapeHtml(body).replace(/\n/g, '<br>')}</p>`
      : '';

  const targets = p.targets?.length
    ? `<h3>Targets</h3><ul>${p.targets
        .map(
          (t) =>
            `<li${t.done ? ' class="done"' : ''}>${escapeHtml(t.text)}</li>`
        )
        .join('')}</ul>`
    : '';

  return `<div class="project">
  <h1>${escapeHtml(p.name)}</h1>
  <div class="meta">${escapeHtml(p.status)} · ${completion(p)}% complete ·
  started ${formatDate(p.createdAt)}${
    p.tags?.length ? ` · ${p.tags.map((t) => escapeHtml(t)).join(', ')}` : ''
  }</div>
  ${section('The problem', p.problem)}
  ${section('Proposed approach', p.solution)}
  ${section('Notes', p.notes)}
  ${targets}
</div>`;
}

export function printLog(projects) {
  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Fieldnotes — ${formatDate(Date.now())}</title>
<style>
  body { font: 14px/1.6 system-ui, sans-serif; color:#252d28; margin:32px; }
  h1 { font-size:20px; margin:0 0 4px; }
  .meta { color:#858b82; font-size:11px; margin-bottom:14px; }
  .project { page-break-inside: avoid; border-top:1px solid #e6e4db; padding-top:14px; margin-top:14px; }
  h3 { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#858b82; margin:12px 0 4px; }
  p, li { font-size:12px; margin:0 0 6px; }
  ul { margin:0; padding-left:18px; }
  li.done { text-decoration: line-through; color:#a2a59b; }
</style></head><body>
${projects.map(projectToHtml).join('\n')}
</body></html>`;

  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  setTimeout(() => frame.remove(), 1000);
}

export const IMPORT_ERRORS = {
  unreadable: 'That file could not be read as JSON.',
  shape: 'That file does not contain any projects.',
};

/**
 * Parses and validates an import file. Understands both the v2 envelope and
 * a legacy v1 array.
 *
 * @returns {{ok:true, projects:object[], replaced:number}|{ok:false, error:string}}
 */
export function parseImport(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: IMPORT_ERRORS.unreadable };
  }

  const { projects } = migrate(raw);
  if (!projects.length) {
    return { ok: false, error: IMPORT_ERRORS.shape };
  }

  return {
    ok: true,
    projects,
    replaced: Array.isArray(raw?.projects) ? raw.projects.length : projects.length,
  };
}

/** Reads a File as text, rejecting oversized files early. */
export function readFile(file, maxBytes = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error('That file is too large to import.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(IMPORT_ERRORS.unreadable));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsText(file);
  });
}

/**
 * Merges imported projects with the current ones. Existing ids are replaced
 * by the incoming version; new ids are appended.
 */
export function mergeProjects(current, incoming) {
  const byId = new Map(current.map((p) => [p.id, p]));
  for (const project of incoming) byId.set(project.id, project);
  return [...byId.values()];
}
