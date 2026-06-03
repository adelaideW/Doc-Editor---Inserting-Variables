import { VARIABLE_TREE, type VariableMenuNode } from '../variablesCatalog';
import type { VariableItem } from '../VariableDropdown';

export function hasChildren(n: VariableMenuNode): boolean {
  return !!n.children && n.children.length > 0;
}

export function getChildrenAtPath(root: VariableMenuNode[], pathIds: string[]): VariableMenuNode[] {
  if (pathIds.length === 0) return root;
  let level = root;
  for (const id of pathIds) {
    const next = level.find((n) => n.id === id);
    if (!next || !hasChildren(next)) return [];
    level = next.children!;
  }
  return level;
}

export function findNodeById(root: VariableMenuNode[], id: string): VariableMenuNode | null {
  for (const n of root) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function getBreadcrumbLabels(pathIds: string[]): string[] {
  const labels: string[] = [];
  let level = VARIABLE_TREE;
  for (const id of pathIds) {
    const node = level.find((n) => n.id === id);
    if (!node) break;
    labels.push(node.label);
    level = node.children ?? [];
  }
  return labels;
}

type LeafWithPath = { node: VariableMenuNode; breadcrumbs: string[] };

export function flattenAllLeaves(
  nodes: VariableMenuNode[] = VARIABLE_TREE,
  breadcrumbs: string[] = [],
  acc: LeafWithPath[] = []
): LeafWithPath[] {
  for (const n of nodes) {
    if (hasChildren(n)) {
      flattenAllLeaves(n.children!, [...breadcrumbs, n.label], acc);
    } else {
      acc.push({ node: n, breadcrumbs });
    }
  }
  return acc;
}

export function nodeToVariableItem(n: VariableMenuNode, breadcrumbs: string[]): VariableItem {
  const pathParts = [...breadcrumbs, n.label];
  const path = pathParts.join(' > ');
  const searchText = [...pathParts, ...(n.searchKeywords ?? [])].join(' ').toLowerCase();
  return {
    id: n.id,
    label: n.label,
    category: breadcrumbs.join(' › ') || 'Variable',
    path,
    hasChildren: hasChildren(n),
    insertLabel: hasChildren(n) ? undefined : n.label,
    searchText,
    recipientType: n.recipientType,
    fieldType: n.fieldType,
    needsRecipient: n.needsRecipient,
  };
}

export function searchVariableItems(query: string): VariableItem[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  return flattenAllLeaves()
    .map(({ node, breadcrumbs }) => nodeToVariableItem(node, breadcrumbs))
    .filter((item) => tokens.every((token) => item.searchText.includes(token)))
    .map((item) => ({
      ...item,
      label: item.category ? `${item.category} › ${item.label}` : item.label,
    }));
}

/** Presentation sections for the V1 object-graph side panel. */
export const OBJECT_GRAPH_SECTIONS: { label: string; rootIds: string[] }[] = [
  { label: 'Custom objects', rootIds: ['root.doc_custom'] },
  { label: 'Derived datasets', rootIds: ['root.docwf', 'root.agreement'] },
  { label: 'Devices', rootIds: ['root.employee', 'root.recipient-fields'] },
];

export function getSectionNodes(sectionLabel: string): VariableMenuNode[] {
  const section = OBJECT_GRAPH_SECTIONS.find((s) => s.label === sectionLabel);
  if (!section) return VARIABLE_TREE;
  return section.rootIds
    .map((id) => findNodeById(VARIABLE_TREE, id))
    .filter((n): n is VariableMenuNode => n != null);
}
