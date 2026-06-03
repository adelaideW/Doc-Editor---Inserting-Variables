import { VARIABLE_TREE, type VariableMenuNode } from '../variablesCatalog';
import type { VariableItem } from '../VariableDropdown';

type LeafWithPath = { node: VariableMenuNode; breadcrumbs: string[] };

function hasChildren(n: VariableMenuNode): boolean {
  return !!n.children && n.children.length > 0;
}

function flattenAll(nodes: VariableMenuNode[], breadcrumbs: string[] = [], acc: LeafWithPath[]): void {
  for (const n of nodes) {
    acc.push({ node: n, breadcrumbs });
    if (hasChildren(n)) {
      flattenAll(n.children!, [...breadcrumbs, n.label], acc);
    }
  }
}

function toVariableItemFromNode(n: VariableMenuNode, breadcrumbs: string[]): VariableItem {
  const child = hasChildren(n);
  const pathParts = [...breadcrumbs, n.label];
  const path = pathParts.join(' > ');
  const searchText = [...pathParts, ...(n.searchKeywords ?? [])].join(' ').toLowerCase();
  return {
    id: n.id,
    label: n.label,
    category: breadcrumbs.join(' › ') || 'Variable',
    path,
    hasChildren: child,
    insertLabel: child ? undefined : n.label,
    searchText,
    recipientType: n.recipientType,
    fieldType: n.fieldType,
    needsRecipient: n.needsRecipient,
  };
}

const ALL_FLATTENED = (() => {
  const acc: LeafWithPath[] = [];
  flattenAll(VARIABLE_TREE, [], acc);
  return acc;
})();

export function searchVariableItems(query: string): VariableItem[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  return ALL_FLATTENED.map(({ node, breadcrumbs }) => toVariableItemFromNode(node, breadcrumbs))
    .filter((item) => tokens.every((token) => item.searchText.includes(token)))
    .map((item) => ({
      ...item,
      label: item.category ? `${item.category} › ${item.label}` : item.label,
    }));
}

export function matchesSearchTokens(text: string, query: string): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = text.toLowerCase();
  return tokens.every((token) => hay.includes(token));
}
