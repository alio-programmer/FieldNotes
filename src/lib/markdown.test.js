import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown.js';

describe('renderMarkdown', () => {
  it('returns an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
    expect(renderMarkdown('   ')).toBe('');
    expect(renderMarkdown(null)).toBe('');
    expect(renderMarkdown(undefined)).toBe('');
  });

  it('renders paragraphs', () => {
    expect(renderMarkdown('hello')).toBe('<p>hello</p>');
  });

  it('renders headings at the right level', () => {
    expect(renderMarkdown('# One')).toBe('<h1>One</h1>');
    expect(renderMarkdown('### Three')).toBe('<h3>Three</h3>');
  });

  it('renders bold and italic', () => {
    expect(renderMarkdown('**bold**')).toBe(
      '<p><strong>bold</strong></p>'
    );
    expect(renderMarkdown('*soft*')).toBe('<p><em>soft</em></p>');
  });

  it('renders inline code', () => {
    expect(renderMarkdown('use `npm test`')).toBe(
      '<p>use <code>npm test</code></p>'
    );
  });

  it('groups consecutive bullets into one list', () => {
    expect(renderMarkdown('- one\n- two')).toBe(
      '<ul><li>one</li><li>two</li></ul>'
    );
  });

  it('closes the list when a paragraph follows', () => {
    expect(renderMarkdown('- one\ntext')).toBe(
      '<ul><li>one</li></ul><p>text</p>'
    );
  });

  it('renders fenced code blocks verbatim', () => {
    expect(renderMarkdown('```js\nconst a = 1;\n```')).toBe(
      '<pre><code class="language-js">const a = 1;</code></pre>'
    );
  });

  it('escapes HTML so notes cannot inject markup', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>'
    );
    expect(renderMarkdown('<img src=x onerror=y>')).toContain('&lt;img');
  });

  it('escapes HTML inside code blocks', () => {
    const html = renderMarkdown('```\n<b>hi</b>\n```');
    expect(html).toContain('&lt;b&gt;');
    expect(html).not.toContain('<b>');
  });

  it('closes an unterminated code fence', () => {
    expect(renderMarkdown('```\nunclosed')).toBe(
      '<pre><code>unclosed</code></pre>'
    );
  });

  it('handles a realistic note', () => {
    const html = renderMarkdown(
      '# Plan\n\n- ship **v1**\n- write docs\n\nNext step.'
    );
    expect(html).toContain('<h1>Plan</h1>');
    expect(html).toContain('<strong>v1</strong>');
    expect(html).toContain('<p>Next step.</p>');
  });
});
