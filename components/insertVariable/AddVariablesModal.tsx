import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import {
  VARIABLE_DROPDOWN_ROOT,
  getDropdownFolderLabel,
  hasVariableChildren,
  type VariableMenuNode,
} from '../variablesCatalog';
import { VARIABLE_LIST_MAX_HEIGHT_CLASS } from './variableListLayout';
import type { InsertVersion } from '../insertVersions';
import type { VariableItem } from '../VariableDropdown';
import {
  findNodeById,
  getBreadcrumbLabels,
  getChildrenAtPath,
  hasChildren,
  nodeToVariableItem,
  searchVariableItems,
} from './variableTreeNav';

interface Props {
  isOpen: boolean;
  insertVersion: InsertVersion;
  onClose: () => void;
  onInsert: (item: VariableItem) => void;
}

type ActivePane = 'left' | 'right';

const RECIPIENT_DEMO_ROOT_ID = 'root.recipient-fields';
const RECIPIENT_DEMO_ROLE_ID = 'recipient.employee';

function isTwoColumnDemoVersion(version: InsertVersion): boolean {
  return version === 'v2' || version === 'v2_5';
}

/** Pre-drilled path for portfolio demo: layer 2 left, layer 3 right. */
function getRecipientDemoNavigation() {
  const pathIds = [RECIPIENT_DEMO_ROOT_ID];
  const leftItems = getChildrenAtPath(VARIABLE_DROPDOWN_ROOT, pathIds);
  const leftIdx = leftItems.findIndex((n) => n.id === RECIPIENT_DEMO_ROLE_ID);
  const leftSelectedId = leftItems[leftIdx >= 0 ? leftIdx : 0]?.id ?? null;
  return { pathIds, leftSelectedId, activeRowIndex: leftIdx >= 0 ? leftIdx : 0 };
}

const AddVariablesModal: React.FC<Props> = ({ isOpen, insertVersion, onClose, onInsert }) => {
  const [search, setSearch] = useState('');
  const [pathIds, setPathIds] = useState<string[]>([]);
  const [leftSelectedId, setLeftSelectedId] = useState<string | null>(null);
  const [selectedLeaf, setSelectedLeaf] = useState<VariableItem | null>(null);
  const [activePane, setActivePane] = useState<ActivePane>('left');
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const resetNavigation = useCallback(() => {
    if (isTwoColumnDemoVersion(insertVersion)) {
      const demo = getRecipientDemoNavigation();
      setPathIds(demo.pathIds);
      setLeftSelectedId(demo.leftSelectedId);
      setActiveRowIndex(demo.activeRowIndex);
    } else {
      const first = VARIABLE_DROPDOWN_ROOT[0];
      setPathIds([]);
      setLeftSelectedId(first?.id ?? null);
      setActiveRowIndex(0);
    }
    setSelectedLeaf(null);
    setActivePane('left');
  }, [insertVersion]);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    resetNavigation();
    requestAnimationFrame(() => dialogRef.current?.focus());
  }, [isOpen, resetNavigation]);

  const leftItems = useMemo(
    () => getChildrenAtPath(VARIABLE_DROPDOWN_ROOT, pathIds),
    [pathIds]
  );

  const leftSelectedNode = useMemo(
    () => (leftSelectedId ? findNodeById(VARIABLE_DROPDOWN_ROOT, leftSelectedId) : null),
    [leftSelectedId]
  );

  const rightItems = useMemo(() => leftSelectedNode?.children ?? [], [leftSelectedNode]);

  const breadcrumbLabels = useMemo(() => getBreadcrumbLabels(pathIds), [pathIds]);

  const searchResults = useMemo(() => searchVariableItems(search), [search]);
  const isSearchMode = search.trim().length > 0;
  const showRightColumn = !isSearchMode && rightItems.length > 0;

  const activeListItems = useMemo((): VariableMenuNode[] | VariableItem[] => {
    if (isSearchMode) return searchResults;
    return activePane === 'left' ? leftItems : rightItems;
  }, [isSearchMode, searchResults, activePane, leftItems, rightItems]);

  const highlightedId = useMemo(() => {
    if (isSearchMode) return searchResults[activeRowIndex]?.id ?? null;
    const items = activePane === 'left' ? leftItems : rightItems;
    return items[activeRowIndex]?.id ?? null;
  }, [isSearchMode, searchResults, activeRowIndex, activePane, leftItems, rightItems]);

  useEffect(() => {
    if (!isOpen) return;
    const len = activeListItems.length;
    if (len === 0) return;
    setActiveRowIndex((i) => Math.min(i, len - 1));
  }, [activeListItems.length, isOpen]);

  useEffect(() => {
    if (!isOpen || highlightedId == null) return;
    const el = document.querySelector(`[data-modal-highlight-id="${highlightedId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [highlightedId, activePane, activeRowIndex, isOpen]);

  const crumbPathForLabels = useMemo(() => pathIds, [pathIds]);

  const pickLeaf = (node: VariableMenuNode, extraPath: string[]) => {
    if (hasChildren(node)) return;
    const crumbs = getBreadcrumbLabels(extraPath);
    setSelectedLeaf(nodeToVariableItem(node, crumbs));
  };

  const selectLeftRow = (node: VariableMenuNode, index: number) => {
    setLeftSelectedId(node.id);
    setActivePane('left');
    setActiveRowIndex(index);
    setSelectedLeaf(null);
  };

  const selectRightRow = (node: VariableMenuNode, index: number) => {
    setActivePane('right');
    setActiveRowIndex(index);
    if (!hasChildren(node)) {
      pickLeaf(node, [...pathIds, leftSelectedId!].filter(Boolean));
    } else {
      setSelectedLeaf(null);
    }
  };

  const drillIntoNode = (nodeId: string) => {
    const node = findNodeById(VARIABLE_DROPDOWN_ROOT, nodeId);
    if (!node || !hasChildren(node)) return;
    const nextPath = [...pathIds, nodeId];
    const children = node.children ?? [];
    const firstChild = children[0];
    setPathIds(nextPath);
    setLeftSelectedId(firstChild?.id ?? null);
    setActivePane('left');
    setActiveRowIndex(0);
    setSelectedLeaf(null);
  };

  const goToPathDepth = (depth: number) => {
    const nextPath = pathIds.slice(0, depth);
    const items = getChildrenAtPath(VARIABLE_DROPDOWN_ROOT, nextPath);
    let selectId = items[0]?.id ?? null;
    let rowIndex = 0;

    if (depth === 0 && isTwoColumnDemoVersion(insertVersion)) {
      const root = VARIABLE_DROPDOWN_ROOT;
      const recipientIdx = root.findIndex((n) => n.id === RECIPIENT_DEMO_ROOT_ID);
      selectId = RECIPIENT_DEMO_ROOT_ID;
      rowIndex = recipientIdx >= 0 ? recipientIdx : 0;
    } else if (
      isTwoColumnDemoVersion(insertVersion) &&
      nextPath.length === 1 &&
      nextPath[0] === RECIPIENT_DEMO_ROOT_ID
    ) {
      const idx = items.findIndex((n) => n.id === RECIPIENT_DEMO_ROLE_ID);
      selectId = RECIPIENT_DEMO_ROLE_ID;
      rowIndex = idx >= 0 ? idx : 0;
    }

    setPathIds(nextPath);
    setLeftSelectedId(selectId);
    setActivePane('left');
    setActiveRowIndex(rowIndex);
    setSelectedLeaf(null);
  };

  const goBackOneLevel = () => {
    if (pathIds.length === 0) return;
    const nextPath = pathIds.slice(0, -1);
    const items = getChildrenAtPath(VARIABLE_DROPDOWN_ROOT, nextPath);
    const parentId = pathIds[pathIds.length - 1];
    const stillInList = items.some((n) => n.id === parentId);
    setPathIds(nextPath);
    setLeftSelectedId(stillInList ? parentId : items[0]?.id ?? null);
    setActivePane('left');
    setActiveRowIndex(Math.max(0, items.findIndex((n) => n.id === (stillInList ? parentId : items[0]?.id))));
    setSelectedLeaf(null);
  };

  const handleInsert = () => {
    if (!selectedLeaf) return;
    onInsert(selectedLeaf);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (document.activeElement === searchInputRef.current) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        searchInputRef.current?.blur();
        dialogRef.current?.focus();
      } else {
        return;
      }
    }

    const items = activeListItems;
    const len = items.length;
    if (len === 0 && !isSearchMode) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveRowIndex((i) => (i + 1) % Math.max(len, 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveRowIndex((i) => (i - 1 + Math.max(len, 1)) % Math.max(len, 1));
      return;
    }

    if (!isSearchMode) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const node = (activePane === 'left' ? leftItems : rightItems)[activeRowIndex];
        if (!node) return;
        if (activePane === 'left') {
          if (hasChildren(node)) {
            selectLeftRow(node, activeRowIndex);
            drillIntoNode(node.id);
          } else if (showRightColumn) {
            setActivePane('right');
            setActiveRowIndex(0);
          }
        }
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activePane === 'right') {
          setActivePane('left');
          const idx = leftItems.findIndex((n) => n.id === leftSelectedId);
          setActiveRowIndex(idx >= 0 ? idx : 0);
        } else {
          goBackOneLevel();
        }
        return;
      }
      if (e.key === 'Tab' && showRightColumn) {
        e.preventDefault();
        setActivePane((p) => (p === 'left' ? 'right' : 'left'));
        setActiveRowIndex(0);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (isSearchMode) {
        const item = searchResults[activeRowIndex];
        if (item) setSelectedLeaf(item);
        return;
      }
      const node = (activePane === 'left' ? leftItems : rightItems)[activeRowIndex];
      if (!node) return;
      if (activePane === 'left') {
        if (hasChildren(node)) {
          drillIntoNode(node.id);
        } else {
          selectLeftRow(node, activeRowIndex);
        }
      } else {
        selectRightRow(node, activeRowIndex);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal
        tabIndex={-1}
        aria-labelledby="add-variables-title"
        className="relative w-full max-w-[720px] h-[560px] max-h-[calc(100vh-48px)] bg-white rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden outline-none"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 id="add-variables-title" className="text-[15px] font-semibold text-gray-900 shrink-0">
            Add variables
          </h2>
          <div className="flex-1 max-w-md mx-auto relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveRowIndex(0);
                setActivePane('left');
              }}
              placeholder="Search"
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#7A005D]/15"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 border-0 bg-transparent shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {isSearchMode ? (
          <div className={`flex-1 min-h-0 overflow-y-auto py-2 ${VARIABLE_LIST_MAX_HEIGHT_CLASS}`}>
            {searchResults.length > 0 ? (
              searchResults.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  data-modal-highlight-id={item.id}
                  className={`w-full text-left px-5 py-3 text-[14px] border-0 bg-transparent transition-colors ${
                    index === activeRowIndex ? 'bg-gray-100 font-medium' : 'bg-white'
                  }`}
                  onMouseEnter={() => setActiveRowIndex(index)}
                  onClick={() => {
                    setActiveRowIndex(index);
                    setSelectedLeaf(item);
                  }}
                >
                  {item.label}
                </button>
              ))
            ) : (
              <div className="flex h-full min-h-[320px] items-center justify-center">
                <p className="text-[13px] text-gray-400">No matching variables</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {isTwoColumnDemoVersion(insertVersion) && pathIds.length > 0 && (
              <p className="px-5 py-2 text-[11px] text-gray-500 border-b border-gray-50 shrink-0 leading-snug">
                Demo: roles on the left, field types on the right. Click{' '}
                <span className="text-gray-700 font-medium">All variables</span> in the breadcrumb to
                return to the top level.
              </p>
            )}
            <nav
              className="px-5 py-2 text-[12px] text-gray-500 border-b border-gray-50 shrink-0 flex flex-wrap items-center gap-1"
              aria-label="Variable browser path"
            >
              <button
                type="button"
                onClick={() => goToPathDepth(0)}
                className={`border-0 bg-transparent p-0 text-[12px] ${
                  pathIds.length === 0
                    ? 'text-gray-900 font-medium cursor-default'
                    : 'text-[#7A005D] hover:underline cursor-pointer'
                }`}
              >
                All variables
              </button>
              {breadcrumbLabels.map((label, index) => (
                <span key={`${label}-${index}`} className="inline-flex items-center gap-1">
                  <span className="text-gray-300" aria-hidden>
                    ›
                  </span>
                  {index < breadcrumbLabels.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => goToPathDepth(index + 1)}
                      className="border-0 bg-transparent p-0 text-[12px] text-[#7A005D] hover:underline cursor-pointer"
                    >
                      {label}
                    </button>
                  ) : (
                    <span className="text-gray-900 font-medium">{label}</span>
                  )}
                </span>
              ))}
            </nav>
            <div
              className={`flex flex-1 min-h-0 divide-x divide-gray-100 ${VARIABLE_LIST_MAX_HEIGHT_CLASS}`}
            >
              <ColumnList
                items={leftItems}
                selectedId={leftSelectedId}
                highlightedId={activePane === 'left' ? highlightedId : null}
                isKeyboardColumn={activePane === 'left'}
                onRowHover={(index) => {
                  const node = leftItems[index];
                  if (node) selectLeftRow(node, index);
                }}
                onSelect={(node, index) => {
                  selectLeftRow(node, index);
                }}
                onDrill={(node) => drillIntoNode(node.id)}
                showChevron
                breadcrumbPathIds={crumbPathForLabels}
                className={showRightColumn ? 'flex-1' : 'flex-1 w-full'}
              />
              {showRightColumn && (
                <ColumnList
                  items={rightItems}
                  selectedId={selectedLeaf?.id ?? null}
                  highlightedId={activePane === 'right' ? highlightedId : null}
                  isKeyboardColumn={activePane === 'right'}
                  onRowHover={(index) => {
                    const node = rightItems[index];
                    if (node) selectRightRow(node, index);
                  }}
                  onSelect={(node, index) => {
                    selectRightRow(node, index);
                  }}
                  showChevron={false}
                  breadcrumbPathIds={[...pathIds, leftSelectedId].filter(Boolean) as string[]}
                  highlightLeaf
                  className="flex-1"
                />
              )}
            </div>
          </>
        )}

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-[14px] text-gray-600 hover:text-gray-900 border-0 bg-transparent px-2 py-1"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedLeaf}
            onClick={handleInsert}
            className={`px-5 py-2 rounded-full text-[14px] font-medium transition-colors border-0 ${
              selectedLeaf
                ? 'bg-[#7A005D] text-white hover:bg-[#66004D]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

function ColumnList({
  items,
  selectedId,
  highlightedId,
  isKeyboardColumn,
  onRowHover,
  onSelect,
  onDrill,
  showChevron,
  breadcrumbPathIds = [],
  highlightLeaf,
  className = 'flex-1',
}: {
  items: VariableMenuNode[];
  selectedId: string | null;
  highlightedId: string | null;
  isKeyboardColumn: boolean;
  onRowHover: (index: number) => void;
  onSelect: (node: VariableMenuNode, index: number) => void;
  onDrill?: (node: VariableMenuNode) => void;
  showChevron: boolean;
  breadcrumbPathIds?: string[];
  highlightLeaf?: boolean;
  className?: string;
}) {
  return (
    <div className={`overflow-y-auto min-w-0 ${VARIABLE_LIST_MAX_HEIGHT_CLASS} ${className}`}>
      {items.length === 0 ? (
        <div className="flex h-full min-h-[200px] items-center justify-center px-4">
          <p className="text-[13px] text-gray-400 text-center">Select a category on the left</p>
        </div>
      ) : (
        items.map((node, index) => {
          const isSelected = selectedId === node.id;
          const isHighlighted = highlightedId === node.id;
          const expandable = hasVariableChildren(node);
          const rowLabel = expandable
            ? getDropdownFolderLabel(node, breadcrumbPathIds)
            : node.label;
          const showPathSelected = isSelected && !isKeyboardColumn;
          return (
            <button
              key={node.id}
              type="button"
              data-modal-highlight-id={node.id}
              onMouseEnter={() => onRowHover(index)}
              onClick={() => onSelect(node, index)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-[14px] border-0 transition-colors ${
                isHighlighted
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : showPathSelected && (highlightLeaf || !expandable)
                    ? 'bg-gray-50 text-gray-900 font-medium'
                    : showPathSelected
                      ? 'bg-gray-50 text-gray-900'
                      : 'bg-white text-gray-700'
              }`}
            >
              <span className="flex-1 truncate">{rowLabel}</span>
              {showChevron && expandable && (
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Open ${rowLabel}`}
                  className="p-1 -mr-1 rounded hover:bg-gray-200 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(node, index);
                    if (hasChildren(node)) onDrill?.(node);
                  }}
                >
                  <ChevronRight size={14} className="text-gray-400" />
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
};

export default AddVariablesModal;
