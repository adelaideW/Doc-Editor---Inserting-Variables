export const CANVAS_PAGE_PAD_Y = 192;
export const CANVAS_MIN_PAGE_HEIGHT = 1100;
export const CANVAS_MIN_EDITOR_HEIGHT = 800;

/** Grow the white page and editor so content never spills past the canvas. */
export function syncCanvasPageHeight(pageEl: HTMLElement, editorEl: HTMLElement): void {
  editorEl.style.height = 'auto';
  const editorMin = Math.max(CANVAS_MIN_EDITOR_HEIGHT, editorEl.scrollHeight);
  editorEl.style.minHeight = `${editorMin}px`;
  pageEl.style.minHeight = `${Math.max(CANVAS_MIN_PAGE_HEIGHT, editorMin + CANVAS_PAGE_PAD_Y)}px`;
}
