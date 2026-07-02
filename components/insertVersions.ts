export type InsertVersion = 'ideal' | 'v1' | 'v1_5' | 'v2' | 'v2_5' | 'v3_5';

export type InsertVersionOption = {
  id: InsertVersion;
  label: string;
  subtitle: string;
};

/** V3.5 (Ideal) is default; listed last in the dropdown. */
export const INSERT_VERSIONS: InsertVersionOption[] = [
  { id: 'v1', label: 'V1', subtitle: 'Side panel (search)' },
  { id: 'v1_5', label: 'V1.5', subtitle: 'Side panel + collapsed rail' },
  { id: 'v2', label: 'V2', subtitle: 'Modal' },
  { id: 'v2_5', label: 'V2.5', subtitle: 'Modal + slash shortcut' },
  { id: 'ideal', label: 'V3', subtitle: 'Shortcut + variable dropdown.' },
  { id: 'v3_5', label: 'V3.5 (Ideal)', subtitle: 'Shortcut + all function dropdown.' },
];

export const DEFAULT_INSERT_VERSION: InsertVersion = 'v3_5';

export function usesSidePanel(version: InsertVersion): boolean {
  return version === 'v1' || version === 'v1_5';
}

export function usesAddVariablesModal(version: InsertVersion): boolean {
  return version === 'v2' || version === 'v2_5';
}

export function usesInlineVariableDropdown(version: InsertVersion): boolean {
  return version === 'ideal' || version === 'v3_5';
}

export function usesCombinedInsertMenu(version: InsertVersion): boolean {
  return version === 'v3_5';
}

export function showsRecipientFieldsHeaderButton(version: InsertVersion): boolean {
  return version === 'v1' || version === 'v1_5' || version === 'v2' || version === 'v2_5';
}

export function usesRecipientChipPicker(version: InsertVersion): boolean {
  return version === 'v2_5' || version === 'ideal' || version === 'v3_5';
}

export function showsRecipientFieldsSidePanel(version: InsertVersion): boolean {
  return version === 'v1' || version === 'v1_5' || version === 'v2' || version === 'v2_5';
}

/** V1.5 — variables + recipient panels share one left rail and panel slot. */
export function usesConsolidatedLeftPanel(version: InsertVersion): boolean {
  return version === 'v1_5';
}
