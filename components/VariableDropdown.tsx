
import React, { useMemo, useEffect, useState, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { VARIABLE_TREE, type VariableMenuNode } from './variablesCatalog';

export type { VariableMenuNode };

export interface VariableItem {
  id: string;
  label: string;
  category?: string;
  path: string;
  /** True when this row drills into nested items (shows ▸). */
  hasChildren?: boolean;
  /** Exact string inserted when this leaf is chosen (defaults to label). */
  insertLabel?: string;
  searchText: string;
  recipientType?: 'employee' | 'manager' | 'custom';
  fieldType?: 'text' | 'checkbox' | 'signature' | 'date-signed';
  needsRecipient?: boolean;
}

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

export interface VariableDropdownHandle {
  drillInto: () => boolean;
  drillOut: () => boolean;
  /** Returns true if the key was handled (insert or drill). */
  activateSelection: () => boolean;
}

interface VariableDropdownProps {
  onSelect: (item: VariableItem) => void;
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

    const allNodes = useMemo(() => {
      const acc: LeafWithPath[] = [];
      flattenAll(VARIABLE_TREE, [], acc);
      return acc;
    }, []);

    const filteredItems = useMemo(() => {
      const tokens = searchQuery
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      if (tokens.length > 0) {
        return allNodes
          .map(({ node, breadcrumbs }) => toVariableItemFromNode(node, breadcrumbs))
          .filter((item) => {
            return tokens.every((token) => item.searchText.includes(token));
          })
          .map((item) => ({
            ...item,
            label: item.category ? `${item.category} › ${item.label}` : item.label,
          }));
      }

      const level = getChildrenAtPath(VARIABLE_TREE, menuPathIds);
      return level.map((n) => toVariableItemFromNode(n, []));
    }, [searchQuery, menuPathIds, allNodes]);

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
          onSelect(row);
          return true;
        }
        return false;
      }

      if (row.hasChildren) {
        setMenuPathIds((prev) => [...prev, row.id]);
        onMenuNavigate?.();
        return true;
      }

      onSelect(row);
      return true;
    }, [onSelect, searchQuery, onMenuNavigate]);

    useImperativeHandle(ref, () => ({ drillInto, drillOut, activateSelection }), [drillInto, drillOut, activateSelection]);

    const handleItemClick = (item: VariableItem) => {
      if (searchQuery.trim()) {
        onSelect(item);
        return;
      }
      if (item.hasChildren) {
        setMenuPathIds((prev) => [...prev, item.id]);
        onMenuNavigate?.();
      } else {
        onSelect(item);
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
        className="absolute bg-white border border-gray-200 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[1050] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-w-[min(100vw-32px,620px)]"
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

        {searchQuery.trim().length > 0 && (
          <div className="px-4 pt-3 pb-1 text-[11px] text-gray-500 border-b border-gray-50">
            Searching:{' '}
            <span className="font-medium text-gray-700" title={searchQuery}>
              “{searchQuery}”
            </span>
          </div>
        )}

        <div className="flex flex-col py-2 overflow-y-auto max-h-[min(460px,calc(100vh-220px))]">
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
