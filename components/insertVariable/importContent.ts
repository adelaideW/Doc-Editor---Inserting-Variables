import type { InsertVersion } from '../insertVersions';
import { usesRecipientChipPicker } from '../insertVersions';
import type { VariableItem } from '../VariableDropdown';

export function augmentItemForInsert(item: VariableItem, version: InsertVersion): VariableItem {
  if (usesRecipientChipPicker(version) && item.recipientType === 'custom') {
    return { ...item, needsRecipient: true };
  }
  return item;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function applyImportToEditor(
  editorEl: HTMLDivElement,
  payload: { file?: File; url?: string }
): Promise<void> {
  if (payload.file) {
    const text = await payload.file.text();
    const name = payload.file.name.toLowerCase();
    if (name.endsWith('.html') || name.endsWith('.htm')) {
      editorEl.innerHTML = text;
    } else {
      const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
      editorEl.innerHTML =
        paragraphs.length > 0
          ? paragraphs.map((p) => `<p>${escapeHtml(p.trim())}</p>`).join('')
          : '<p><br></p>';
    }
    return;
  }

  const url = payload.url?.trim();
  if (!url) return;

  try {
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') ?? '';
    const body = await res.text();
    if (contentType.includes('html') || body.trim().startsWith('<')) {
      editorEl.innerHTML = body;
    } else {
      editorEl.innerHTML = `<p>${escapeHtml(body.trim())}</p>`;
    }
  } catch {
    const safeUrl = escapeHtml(url);
    editorEl.innerHTML = `<p><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a></p>`;
  }
}
