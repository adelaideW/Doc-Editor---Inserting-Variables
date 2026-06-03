import type { VariableItem } from '../VariableDropdown';

export function applyChipVisualState(chip: HTMLElement, warning: boolean) {
  chip.className = warning
    ? 'variable-chip inline-flex items-center px-2 py-0.5 mx-0.5 rounded bg-amber-50 border border-amber-300 text-[14px] text-amber-900 font-medium select-none align-baseline leading-tight transition-all duration-200 cursor-pointer group'
    : 'variable-chip inline-flex items-center px-2 py-0.5 mx-0.5 rounded bg-[#7A005D]/5 border border-[#7A005D]/20 text-[14px] text-[#7A005D] font-medium select-none align-baseline leading-tight transition-all duration-200 cursor-default group';
}

export function createVariableChip(item: VariableItem): HTMLElement {
  const label = item.insertLabel ?? item.label;
  const chip = document.createElement('span');
  const warning = item.needsRecipient === true;
  applyChipVisualState(chip, warning);
  chip.contentEditable = 'false';
  chip.setAttribute('data-variable', label);
  chip.setAttribute('data-variable-path', item.path);
  chip.setAttribute('data-needs-recipient', warning ? 'true' : 'false');
  chip.title = item.path;

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
