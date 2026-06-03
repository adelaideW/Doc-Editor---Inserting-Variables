import type { ReactNode } from 'react';
import type { VariableItem } from '../VariableDropdown';
import { SLASH_BLOCK_ROWS, type SlashMenuItemId } from './SlashBlockMenu';
import { matchesSearchTokens, searchVariableItems } from './variableSearch';

export type CombinedSearchItem =
  | { kind: 'block'; id: SlashMenuItemId; label: string; icon: ReactNode }
  | { kind: 'variable'; item: VariableItem };

export function searchCombinedMenu(query: string): CombinedSearchItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const blocks: CombinedSearchItem[] = SLASH_BLOCK_ROWS.filter((row) =>
    matchesSearchTokens(row.label, trimmed)
  ).map((row) => ({
    kind: 'block' as const,
    id: row.id,
    label: row.label,
    icon: row.icon,
  }));

  const variables: CombinedSearchItem[] = searchVariableItems(trimmed).map((item) => ({
    kind: 'variable' as const,
    item,
  }));

  return [...blocks, ...variables];
}

/** Root row count: Insert variables + block rows */
export const COMBINED_ROOT_ROW_COUNT = 1 + SLASH_BLOCK_ROWS.length;
