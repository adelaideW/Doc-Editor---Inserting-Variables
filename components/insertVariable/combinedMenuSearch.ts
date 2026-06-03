import type { ReactNode } from 'react';
import type { VariableItem } from '../VariableDropdown';
import { IMPORT_ROW, SLASH_BLOCK_ROWS, type SlashMenuItemId } from './SlashBlockMenu';
import { matchesSearchTokens, searchVariableItems } from './variableSearch';

export type CombinedSearchItem =
  | { kind: 'block'; id: SlashMenuItemId; label: string; icon: ReactNode }
  | { kind: 'variable'; item: VariableItem };

export function searchCombinedMenu(query: string): CombinedSearchItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const importMatches: CombinedSearchItem[] = matchesSearchTokens(IMPORT_ROW.label, trimmed)
    ? [
        {
          kind: 'block' as const,
          id: IMPORT_ROW.id,
          label: IMPORT_ROW.label,
          icon: IMPORT_ROW.icon,
        },
      ]
    : [];

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

  return [...importMatches, ...blocks, ...variables];
}

/** Root row count: Insert variables + Import + block rows */
export const COMBINED_ROOT_ROW_COUNT = 2 + SLASH_BLOCK_ROWS.length;
