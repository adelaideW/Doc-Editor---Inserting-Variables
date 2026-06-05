import { VARIABLE_DROPDOWN_ROOT, VARIABLE_TREE, type VariableMenuNode } from '../variablesCatalog';
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

export function getBreadcrumbLabels(
  pathIds: string[],
  root: VariableMenuNode[] = VARIABLE_DROPDOWN_ROOT
): string[] {
  const labels: string[] = [];
  let level = root;
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

export type SearchLeafMatch = {
  item: VariableItem;
  /** Immediate parent folder label, e.g. "Employment status" */
  inContext: string;
  /** Top-level object label for grouping, e.g. "Employee" */
  objectLabel: string;
};

export type SearchSectionGroup = {
  sectionLabel: string;
  matches: SearchLeafMatch[];
};

/** Leaf-only search scoped to V1 presentation sections; folders without matching leaves are omitted. */
export function searchLeavesGroupedBySection(
  query: string,
  passesFilter: (nodeId: string) => boolean
): SearchSectionGroup[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const groups: SearchSectionGroup[] = [];

  for (const section of OBJECT_GRAPH_SECTIONS) {
    const roots = getSectionNodes(section.label);
    const matches: SearchLeafMatch[] = [];

    const walk = (node: VariableMenuNode, breadcrumbs: string[], objectLabel: string) => {
      if (hasChildren(node)) {
        const nextObject = breadcrumbs.length <= 1 ? node.label : objectLabel;
        for (const child of node.children!) {
          walk(child, [...breadcrumbs, node.label], nextObject);
        }
        return;
      }

      if (!passesFilter(node.id)) return;

      const labelText = `${node.label} ${(node.searchKeywords ?? []).join(' ')}`.toLowerCase();
      if (!tokens.every((token) => labelText.includes(token))) return;

      const inContext = breadcrumbs[breadcrumbs.length - 1] ?? section.label;
      matches.push({ item: nodeToVariableItem(node, breadcrumbs), inContext, objectLabel });
    };

    for (const root of roots) {
      walk(root, [section.label], root.label);
    }

    if (matches.length > 0) {
      groups.push({ sectionLabel: section.label, matches });
    }
  }

  return groups;
}

export function searchVariableItems(query: string): VariableItem[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  return flattenAllLeaves(VARIABLE_DROPDOWN_ROOT)
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
