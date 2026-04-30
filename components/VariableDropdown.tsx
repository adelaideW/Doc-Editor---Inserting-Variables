
import React, { useMemo, useEffect, useState, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { ChevronRight, Search } from 'lucide-react';

/** Tree node — leaves have no `children` (or empty array). Insert is only allowed on leaves. */
export type VariableMenuNode = {
  id: string;
  label: string;
  children?: VariableMenuNode[];
};

export interface VariableItem {
  id: string;
  label: string;
  category?: string;
  /** True when this row drills into nested items (shows ▸). */
  hasChildren?: boolean;
  /** Exact string inserted when this leaf is chosen (defaults to label). */
  insertLabel?: string;
}

/** Sample hierarchy: some branches two levels deep, others deeper. */
const VARIABLE_TREE: VariableMenuNode[] = [
  {
    id: 'emp',
    label: 'Employee',
    children: [
      {
        id: 'emp.personal',
        label: 'Personal information',
        children: [
          {
            id: 'emp.tax',
            label: 'Tax & identifiers',
            children: [
              { id: 'emp.tax.ssn-mask', label: 'National ID masked last four digits' },
              { id: 'emp.tax.country', label: 'Primary tax residence country code (ISO)' },
            ],
          },
          {
            id: 'emp.contact',
            label: 'Contact routing',
            children: [
              { id: 'emp.contact.work-email', label: 'Primary work email routing address' },
              {
                id: 'emp.contact.escalation',
                label: 'Escalation path',
                children: [
                  { id: 'emp.contact.esc mgr', label: 'People manager escalation inbox' },
                  { id: 'emp.contact.oncall', label: 'On-call distribution list alias' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'emp.role',
        label: 'Role & compensation',
        children: [
          { id: 'emp.role.title', label: 'Current published job title' },
          {
            id: 'emp.role.payroll',
            label: 'Payroll attributes',
            children: [
              { id: 'emp.pay.base', label: 'Annual base compensation (localized currency)' },
              { id: 'emp.pay.exempt', label: 'Fair Labor exemption status indicator' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'co',
    label: 'Company',
    children: [
      {
        id: 'co.registry',
        label: 'Legal entity registry',
        children: [
          { id: 'co.legal.name', label: 'Full registered legal entity name' },
          { id: 'co.registry.ein', label: 'Employer identification number masked' },
        ],
      },
      {
        id: 'co.site',
        label: 'Headquarters site',
        children: [
          {
            id: 'co.addr',
            label: 'Street & postal block',
            children: [
              { id: 'co.addr.line1', label: 'HQ street address line one' },
              { id: 'co.addr.city', label: 'HQ city • region • postal code' },
            ],
          },
          { id: 'co.site.tz', label: 'Facility local timezone (IANA string)' },
        ],
      },
    ],
  },
  {
    id: 'doc',
    label: 'Document workflow',
    children: [
      {
        id: 'doc.sign',
        label: 'Signatures',
        children: [
          { id: 'doc.sign.when', label: 'Completed signature capture timestamp (UTC)' },
          {
            id: 'doc.sign.ip',
            label: 'Signer network context',
            children: [
              { id: 'doc.sign.ip.mask', label: 'Signer IPv4 /24 masked prefix' },
              { id: 'doc.sign.geo', label: 'Geo-IP derived metro label' },
            ],
          },
        ],
      },
      { id: 'doc.version', label: 'Template revision hash (short)' },
    ],
  },
];

type LeafWithPath = { node: VariableMenuNode; breadcrumbs: string[] };

function hasChildren(n: VariableMenuNode): boolean {
  return !!n.children && n.children.length > 0;
}

function getChildrenAtPath(root: VariableMenuNode[], pathIds: string[]): VariableMenuNode[] {
  if (pathIds.length === 0) return root;
  let level = root;
  for (const id of pathIds) {
    const next = level.find((n) => n.id === id);
    if (!next || !hasChildren(next)) return [];
    level = next.children!;
  }
  return level;
}

function flattenLeaves(nodes: VariableMenuNode[], breadcrumbs: string[] = [], acc: LeafWithPath[]): void {
  for (const n of nodes) {
    if (!hasChildren(n)) {
      acc.push({ node: n, breadcrumbs });
    } else {
      flattenLeaves(n.children!, [...breadcrumbs, n.label], acc);
    }
  }
}

function toVariableItemFromNode(n: VariableMenuNode, breadcrumbs: string[]): VariableItem {
  const child = hasChildren(n);
  return {
    id: n.id,
    label: n.label,
    category: breadcrumbs.join(' › ') || 'Variable',
    hasChildren: child,
    insertLabel: child ? undefined : n.label,
  };
}

export interface VariableDropdownHandle {
  drillInto: () => boolean;
  drillOut: () => boolean;
  /** Returns true if the key was handled (insert or drill). */
  activateSelection: () => boolean;
}

interface VariableDropdownProps {
  onSelect: (value: string) => void;
  searchQuery: string;
  activeIndex: number;
  onFilteredItemsChange?: (items: VariableItem[]) => void;
  /** Called when the menu stack changes so the parent can reset keyboard highlight. */
  onMenuNavigate?: () => void;
  style?: React.CSSProperties;
}

const VariableDropdown = forwardRef<VariableDropdownHandle, VariableDropdownProps>(
  ({ onSelect, searchQuery, activeIndex, onFilteredItemsChange, onMenuNavigate, style }, ref) => {
    const [menuPathIds, setMenuPathIds] = useState<string[]>([]);

    const allLeaves = useMemo(() => {
      const acc: LeafWithPath[] = [];
      flattenLeaves(VARIABLE_TREE, [], acc);
      return acc;
    }, []);

    const filteredItems = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        return allLeaves
          .filter(({ node, breadcrumbs }) => {
            const hay = [...breadcrumbs, node.label].join(' › ').toLowerCase();
            return hay.includes(q);
          })
          .map(({ node, breadcrumbs }) => ({
            id: node.id,
            label: breadcrumbs.length ? `${breadcrumbs.join(' › ')} › ${node.label}` : node.label,
            category: breadcrumbs.join(' › '),
            hasChildren: false,
            insertLabel: node.label,
          }));
      }

      const level = getChildrenAtPath(VARIABLE_TREE, menuPathIds);
      return level.map((n) => toVariableItemFromNode(n, []));
    }, [searchQuery, menuPathIds, allLeaves]);

    const activeIndexRef = useRef(activeIndex);
    const filteredItemsRef = useRef(filteredItems);
    activeIndexRef.current = activeIndex;
    filteredItemsRef.current = filteredItems;

    useEffect(() => {
      onFilteredItemsChange?.(filteredItems);
    }, [filteredItems, onFilteredItemsChange]);

    const drillInto = useCallback((): boolean => {
      if (searchQuery.trim()) return false;
      const items = filteredItemsRef.current;
      const idx = activeIndexRef.current;
      const row = items[idx];
      if (!row?.hasChildren) return false;
      setMenuPathIds((prev) => [...prev, row.id]);
      onMenuNavigate?.();
      return true;
    }, [searchQuery, onMenuNavigate]);

    const drillOut = useCallback((): boolean => {
      if (searchQuery.trim()) return false;
      if (menuPathIds.length === 0) return false;
      setMenuPathIds((prev) => prev.slice(0, -1));
      onMenuNavigate?.();
      return true;
    }, [searchQuery, menuPathIds.length, onMenuNavigate]);

    const activateSelection = useCallback((): boolean => {
      const items = filteredItemsRef.current;
      const idx = activeIndexRef.current;
      const row = items[idx];
      if (!row) return false;

      const q = searchQuery.trim();
      if (q) {
        if (row.insertLabel !== undefined) {
          onSelect(row.insertLabel);
          return true;
        }
        return false;
      }

      if (row.hasChildren) {
        setMenuPathIds((prev) => [...prev, row.id]);
        onMenuNavigate?.();
        return true;
      }

      const value = row.insertLabel ?? row.label;
      onSelect(value);
      return true;
    }, [onSelect, searchQuery, onMenuNavigate]);

    useImperativeHandle(ref, () => ({ drillInto, drillOut, activateSelection }), [drillInto, drillOut, activateSelection]);

    const handleItemClick = (item: VariableItem) => {
      if (searchQuery.trim()) {
        const v = item.insertLabel ?? item.label;
        onSelect(v);
        return;
      }
      if (item.hasChildren) {
        setMenuPathIds((prev) => [...prev, item.id]);
        onMenuNavigate?.();
      } else {
        onSelect(item.insertLabel ?? item.label);
      }
    };

    const breadcrumbTrail = useMemo(() => {
      if (!menuPathIds.length || searchQuery.trim()) return [];
      const labels: string[] = [];
      let level = VARIABLE_TREE;
      for (const id of menuPathIds) {
        const node = level.find((n) => n.id === id);
        if (!node) break;
        labels.push(node.label);
        level = node.children ?? [];
      }
      return labels;
    }, [menuPathIds, searchQuery]);

    const goBack = () => {
      setMenuPathIds((prev) => prev.slice(0, -1));
      onMenuNavigate?.();
    };

    const showNestedHeader = breadcrumbTrail.length > 0 && !searchQuery.trim();

    return (
      <div
        className="absolute bg-white border border-gray-200 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-w-[min(100vw-32px,400px)]"
        style={{ ...style, width: undefined, minWidth: 280 }}
        onMouseDown={(e) => e.preventDefault()}
      >
        {showNestedHeader && (
          <button
            type="button"
            className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 bg-[#F9FAFB] text-left w-full"
            onClick={goBack}
          >
            <ChevronRight size={14} className="text-gray-400 rotate-180 shrink-0" />
            <span className="text-[13px] font-semibold text-gray-900 flex-1 truncate">
              {breadcrumbTrail.join(' › ')}
            </span>
          </button>
        )}

        <div className="flex flex-col py-2 overflow-y-auto max-h-[400px]">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isFocused = index === activeIndex;
              const expandable = !!item.hasChildren;
              return (
                <button
                  type="button"
                  key={`${searchQuery}:${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-center gap-3 px-4 py-3 text-[14px] transition-colors cursor-pointer group text-left w-full border-0 bg-transparent rounded-none font-inherit ${
                    isFocused
                      ? 'bg-[#7A005D]/5 text-[#7A005D]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`flex-1 truncate ${isFocused ? 'font-medium' : ''}`}>{item.label}</span>
                  {expandable ? (
                    <ChevronRight
                      size={14}
                      className={`shrink-0 text-gray-400 group-hover:text-gray-600 ${isFocused ? 'text-[#7A005D]' : ''}`}
                      aria-hidden
                    />
                  ) : (
                    <span className="w-[14px] shrink-0" aria-hidden />
                  )}
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Search className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-[13px] text-gray-400">No matching variables found</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

VariableDropdown.displayName = 'VariableDropdown';

export default VariableDropdown;
