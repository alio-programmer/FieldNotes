/**
 * A deliberately tiny markdown subset for project notes.
 *
 * Supports: fenced code blocks, ATX headings, unordered lists, `code`,
 * **bold**, *italic*. Anything else is rendered as plain text.
 *
 * Inline rules are applied to already-escaped text, so the output is safe
 * to pass to dangerouslySetInnerHTML.
 */

const escapeHtml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function inline(text) {
  let out = escapeHtml(text);
  // `code` first so its contents are not further transformed.
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return out;
}

/** @returns {string} HTML string */
export function renderMarkdown(source) {
  if (!source || !String(source).trim()) return '';

  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let list = null;
  let fence = null;
  let code = [];

  const closeList = () => {
    if (list) {
      html.push(`<ul>${list.join('')}</ul>`);
      list = null;
    }
  };

  for (const line of lines) {
    const fenceMatch = line.match(/^```(\w*)\s*$/);
    if (fenceMatch) {
      if (fence === null) {
        closeList();
        fence = fenceMatch[1] || '';
        code = [];
      } else {
        const lang = fence ? ` class="language-${escapeHtml(fence)}"` : '';
        html.push(`<pre><code${lang}>${escapeHtml(code.join('\n'))}</code></pre>`);
        fence = null;
      }
      continue;
    }

    if (fence !== null) {
      code.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      list = list || [];
      list.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    closeList();
    html.push(`<p>${inline(line)}</p>`);
  }

  // Unterminated fence — still render what we captured.
  if (fence !== null) {
    html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  }
  closeList();

  return html.join('');
}
