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
