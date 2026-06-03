export type InsertVersion = 'ideal' | 'v1' | 'v2' | 'v3';

export type InsertVersionOption = {
  id: InsertVersion;
  label: string;
  subtitle: string;
};

export const INSERT_VERSIONS: InsertVersionOption[] = [
  { id: 'ideal', label: 'Ideal', subtitle: 'Shortcut + inline dropdown' },
  { id: 'v1', label: 'V1', subtitle: 'Side panel + modal' },
  { id: 'v2', label: 'V2', subtitle: 'Modal' },
  { id: 'v3', label: 'V3', subtitle: 'Modal + shortcut' },
];

export const DEFAULT_INSERT_VERSION: InsertVersion = 'ideal';
