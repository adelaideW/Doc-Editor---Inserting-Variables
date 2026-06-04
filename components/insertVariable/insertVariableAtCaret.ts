import type { VariableItem } from '../VariableDropdown';
import { getVariableDescriptionForItem } from './variableDescriptions';

export const CHIP_SELECTED_CLASS = 'chip-selected';

export function applyChipVisualState(chip: HTMLElement, warning: boolean) {
  const selected = chip.classList.contains(CHIP_SELECTED_CLASS);
  chip.className = warning
    ? 'variable-chip inline-flex items-center px-2 py-0.5 mx-0.5 rounded bg-amber-50 border border-amber-300 text-[14px] text-amber-900 font-medium select-none align-baseline leading-tight transition-all duration-200 cursor-pointer group'
    : 'variable-chip inline-flex items-center px-2 py-0.5 mx-0.5 rounded bg-[#7A005D]/5 border border-[#7A005D]/20 text-[14px] text-[#7A005D] font-medium select-none align-baseline leading-tight transition-all duration-200 cursor-default group';
  if (selected) chip.classList.add(CHIP_SELECTED_CLASS);
}

export function createVariableChip(item: VariableItem): HTMLElement {
  const label = item.insertLabel ?? item.label;
  const description = getVariableDescriptionForItem(item);
  const chip = document.createElement('span');
  const warning = item.needsRecipient === true;
  applyChipVisualState(chip, warning);
  chip.contentEditable = 'false';
  chip.setAttribute('data-variable', label);
  chip.setAttribute('data-variable-id', item.id);
  chip.setAttribute('data-variable-path', item.path);
  chip.setAttribute('data-variable-description', description);
  if (item.recipientType) {
    chip.setAttribute('data-recipient-type', item.recipientType);
  }
  if (item.fieldType) {
    chip.setAttribute('data-field-type', item.fieldType);
  }
  chip.setAttribute('data-needs-recipient', warning ? 'true' : 'false');

  const labelSpan = document.createElement('span');
  labelSpan.className = 'pointer-events-none';
  labelSpan.textContent = label;
  chip.appendChild(labelSpan);

  const rule = document.createElement('div');
  rule.className = 'mx-1.5 w-[1px] h-3 bg-[#7A005D]/20 pointer-events-none';
  chip.appendChild(rule);

  const delBtn = document.createElement('button');
  delBtn.className =
    'chip-delete-btn p-0.5 rounded hover:bg-[#7A005D]/10 transition-colors flex items-center justify-center cursor-pointer';
  delBtn.type = 'button';
  delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="opacity-60 pointer-events-none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  chip.appendChild(delBtn);

  return chip;
}

export function cloneChipElement(chip: HTMLElement): HTMLElement {
  return chip.cloneNode(true) as HTMLElement;
}

export function getChipsInSelection(editorEl: HTMLElement): HTMLElement[] {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return [];

  const range = sel.getRangeAt(0);
  if (!editorEl.contains(range.commonAncestorContainer)) return [];

  const chips: HTMLElement[] = [];
  editorEl.querySelectorAll('.variable-chip').forEach((node) => {
    if (node instanceof HTMLElement && range.intersectsNode(node)) {
      chips.push(node);
    }
  });
  return chips;
}

export function syncChipSelectionHighlight(editorEl: HTMLElement): void {
  const selected = new Set(getChipsInSelection(editorEl));
  editorEl.querySelectorAll('.variable-chip').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.classList.toggle(CHIP_SELECTED_CLASS, selected.has(node));
  });
}

export function clearChipSelectionHighlight(editorEl: HTMLElement): void {
  editorEl.querySelectorAll(`.variable-chip.${CHIP_SELECTED_CLASS}`).forEach((node) => {
    node.classList.remove(CHIP_SELECTED_CLASS);
  });
}

export function parseChipsFromHtml(html: string): HTMLElement[] {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return Array.from(temp.querySelectorAll('.variable-chip')).filter(
    (n): n is HTMLElement => n instanceof HTMLElement
  );
}

export function insertClonedChipsAtCaret(
  editorEl: HTMLDivElement,
  chips: HTMLElement[],
  onInserted?: () => void
): boolean {
  if (chips.length === 0) return false;

  editorEl.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const frag = document.createDocumentFragment();
  chips.forEach((chip, index) => {
    frag.appendChild(cloneChipElement(chip));
    if (index < chips.length - 1) {
      frag.appendChild(document.createTextNode(' '));
    }
  });
  const space = document.createTextNode('\u00A0');
  frag.appendChild(space);

  range.insertNode(frag);
  range.setStartAfter(space);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  onInserted?.();
  return true;
}

export type InsertVariableOptions = {
  editorEl: HTMLDivElement;
  item: VariableItem;
  breakoutText?: Text | null;
  onInserted?: () => void;
};

export function insertVariableAtCaret({
  editorEl,
  item,
  breakoutText = null,
  onInserted,
}: InsertVariableOptions): boolean {
  editorEl.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;

  const chip = createVariableChip(item);
  const bo = breakoutText;

  if (bo && bo.parentNode) {
    bo.parentNode.replaceChild(chip, bo);
    sel.removeAllRanges();
    const r = document.createRange();
    const space = document.createTextNode('\u00A0');
    r.setStartAfter(chip);
    r.insertNode(space);
    r.setStartAfter(space);
    r.collapse(true);
    sel.addRange(r);
    onInserted?.();
    return true;
  }

  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(true);
  range.insertNode(chip);
  range.setStartAfter(chip);
  range.setEndAfter(chip);

  const space = document.createTextNode('\u00A0');
  range.insertNode(space);
  range.setStartAfter(space);
  range.setEndAfter(space);

  sel.removeAllRanges();
  sel.addRange(range);
  onInserted?.();
  return true;
}

export function insertTextAtCaret(
  editorEl: HTMLDivElement,
  text: string,
  onInserted?: () => void
): boolean {
  editorEl.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;

  const range = sel.getRangeAt(0);
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  onInserted?.();
  return true;
}

export function insertBulletedListAtCaret(
  editorEl: HTMLDivElement,
  onInserted?: () => void
): boolean {
  return insertTextAtCaret(editorEl, '\u2022\u00A0', onInserted);
}

export function insertNumberedListAtCaret(
  editorEl: HTMLDivElement,
  onInserted?: () => void
): boolean {
  return insertTextAtCaret(editorEl, '1.\u00A0', onInserted);
}

export function insertHtmlAtCaret(
  editorEl: HTMLDivElement,
  html: string,
  onInserted?: () => void
): boolean {
  editorEl.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const temp = document.createElement('div');
  temp.innerHTML = html;
  const frag = document.createDocumentFragment();
  const nodes = Array.from(temp.childNodes);
  nodes.forEach((node) => frag.appendChild(node));
  const lastNode = nodes[nodes.length - 1] ?? null;

  range.insertNode(frag);

  if (lastNode) {
    const after = document.createRange();
    after.setStartAfter(lastNode);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  }

  onInserted?.();
  return true;
}
