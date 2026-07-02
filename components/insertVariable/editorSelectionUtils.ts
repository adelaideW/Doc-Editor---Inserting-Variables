export function isFullEditorSelection(editorEl: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;

  const range = sel.getRangeAt(0);
  if (!editorEl.contains(range.commonAncestorContainer)) return false;

  const full = document.createRange();
  full.selectNodeContents(editorEl);

  const startMatch =
    range.compareBoundaryPoints(Range.START_TO_START, full) === 0;
  const endMatch = range.compareBoundaryPoints(Range.END_TO_END, full) === 0;

  return startMatch && endMatch;
}

export function clearEditorContents(editorEl: HTMLDivElement): void {
  editorEl.innerHTML = '';
}

const CARET_GAP = 8;
const DROPDOWN_MAX_W = 620;
const VIEWPORT_PAD = 8;
const LINE_FALLBACK = 22;

/** Fixed-position anchor for variable / slash menus — always below the caret line. */
export function computeCaretAnchorRect(editorEl: HTMLElement | null): { top: number; left: number } {
  if (!editorEl) return { top: 0, left: VIEWPORT_PAD };

  const sel = window.getSelection();
  if (!sel?.rangeCount) return { top: 0, left: VIEWPORT_PAD };

  const range = sel.getRangeAt(0);
  if (!editorEl.contains(range.commonAncestorContainer)) {
    return { top: 0, left: VIEWPORT_PAD };
  }

  const collapsed = range.cloneRange();
  collapsed.collapse(true);

  let rect: DOMRect | null = null;
  const clientRects = collapsed.getClientRects();
  if (clientRects.length > 0) {
    rect = clientRects[clientRects.length - 1] as DOMRect;
  }

  if (!rect || (rect.width === 0 && rect.height === 0)) {
    const bounds = collapsed.getBoundingClientRect();
    if (bounds.width || bounds.height) rect = bounds;
  }

  const sc = collapsed.startContainer;
  if ((!rect || (rect.height === 0 && rect.width === 0)) && sc.nodeType === Node.TEXT_NODE) {
    const text = sc as Text;
    const offset = collapsed.startOffset;
    const probe = collapsed.cloneRange();
    if (offset < text.data.length) {
      probe.setStart(text, offset);
      probe.setEnd(text, Math.min(offset + 1, text.data.length));
    } else if (offset > 0) {
      probe.setStart(text, offset - 1);
      probe.setEnd(text, offset);
    }
    const probeRect = probe.getBoundingClientRect();
    if (probeRect.height || probeRect.width) rect = probeRect;
  }

  let topPx: number;
  let leftPx: number;

  if (rect && (rect.height || rect.width)) {
    topPx = rect.bottom + CARET_GAP;
    leftPx = rect.left;
  } else {
    const editorRect = editorEl.getBoundingClientRect();
    topPx = editorRect.top + LINE_FALLBACK + CARET_GAP;
    leftPx = editorRect.left + VIEWPORT_PAD;
  }

  leftPx = Math.max(VIEWPORT_PAD, Math.min(leftPx, window.innerWidth - DROPDOWN_MAX_W - VIEWPORT_PAD));

  return { top: topPx, left: leftPx };
}
