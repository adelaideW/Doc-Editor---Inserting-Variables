/** HTML blocks inserted from the V2.5 slash menu into the editor canvas. */

export function quoteBlockHtml(text = 'Quote') {
  return `<blockquote style="border-left:4px solid #e5e7eb;margin:0.75em 0;padding:0.25em 0 0.25em 1em;color:#4b5563;"><p style="margin:0;">${escapeHtml(text)}</p></blockquote>`;
}

export function codeSnippetHtml(code = '// Code snippet') {
  return `<pre style="background:#f3f4f6;border-radius:8px;padding:12px 14px;margin:0.75em 0;font-family:ui-monospace,monospace;font-size:13px;line-height:1.5;overflow-x:auto;"><code>${escapeHtml(code)}</code></pre>`;
}

export function linkHtml(url: string, label: string) {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label);
  return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;text-underline-offset:2px;">${safeLabel}</a>&nbsp;`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
