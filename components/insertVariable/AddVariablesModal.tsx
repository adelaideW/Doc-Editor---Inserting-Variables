import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import {
  VARIABLE_DROPDOWN_ROOT,
  getDropdownFolderLabel,
  hasVariableChildren,
  type VariableMenuNode,
} from '../variablesCatalog';
import { ModalFieldIcon } from './modalFieldIcon';
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

const OBJECT_ROOT_LABEL = 'Object';

/** Snapshot for breadcrumb navigation. */
type NavSnapshot = {
  pathIds: string[];
  leftSelectedId: string | null;
};

function buildLeafBreadcrumbs(pathIds: string[], leftSelectedId: string | null): string[] {
  const crumbs = [...getBreadcrumbLabels(pathIds)];
  if (leftSelectedId) {
    const node = findNodeById(VARIABLE_DROPDOWN_ROOT, leftSelectedId);
    if (node) crumbs.push(node.label);
  }
  return crumbs;
}

const AddVariablesModal: React.FC<Props> = ({ isOpen, insertVersion: _insertVersion, onClose, onInsert }) => {
  const [search, setSearch] = useState('');
  const [pathIds, setPathIds] = useState<string[]>([]);
  const [leftSelectedId, setLeftSelectedId] = useState<string | null>(null);
  const [selectedLeaf, setSelectedLeaf] = useState<VariableItem | null>(null);
  const [activePane, setActivePane] = useState<ActivePane>('left');
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const resetNavigation = useCallback(() => {
    const first = VARIABLE_DROPDOWN_ROOT[0];
    setPathIds([]);
    setLeftSelectedId(first?.id ?? null);
    setSelectedLeaf(null);
    setActivePane('left');
    setActiveRowIndex(0);
  }, []);

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

  const breadcrumbSegments = useMemo((): NavSnapshot[] => {
    const segments: NavSnapshot[] = [{ pathIds: [], leftSelectedId: null }];
    if (!leftSelectedId) return segments;

    if (pathIds.length === 0) {
      segments.push({ pathIds: [], leftSelectedId });
      return segments;
    }

    segments.push({ pathIds: [], leftSelectedId: pathIds[0] });
    segments.push({ pathIds: [...pathIds], leftSelectedId });
    return segments;
  }, [pathIds, leftSelectedId]);

  const breadcrumbLabels = useMemo(() => {
    const labels: string[] = [];
    if (pathIds.length === 0 && leftSelectedId) {
      const node = findNodeById(VARIABLE_DROPDOWN_ROOT, leftSelectedId);
      if (node) labels.push(getDropdownFolderLabel(node, []));
    } else {
      pathIds.forEach((id, index) => {
        const node = findNodeById(VARIABLE_DROPDOWN_ROOT, id);
        if (!node) return;
        labels.push(index === 0 ? getDropdownFolderLabel(node, []) : node.label);
      });
      if (leftSelectedId) {
        const node = findNodeById(VARIABLE_DROPDOWN_ROOT, leftSelectedId);
        if (node) labels.push(node.label);
      }
    }
    return labels;
  }, [pathIds, leftSelectedId]);

  const searchQuery = search.trim();
  const searchResults = useMemo(() => searchVariableItems(search), [search]);
  const isSearchMode = searchQuery.length > 0;
  const searchResultsLabel = useMemo(() => {
    const count = searchResults.length;
    const noun = count === 1 ? 'result' : 'results';
    return `${count} ${noun} for “${searchQuery}”`;
  }, [searchResults.length, searchQuery]);
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

  const pickLeaf = (node: VariableMenuNode) => {
    if (hasChildren(node)) return;
    const crumbs = buildLeafBreadcrumbs(pathIds, leftSelectedId);
    setSelectedLeaf(nodeToVariableItem(node, crumbs));
  };

  const applySnapshot = (snapshot: NavSnapshot) => {
    setPathIds(snapshot.pathIds);
    const items = getChildrenAtPath(VARIABLE_DROPDOWN_ROOT, snapshot.pathIds);
    let selectId = snapshot.leftSelectedId ?? items[0]?.id ?? null;
    let rowIndex = 0;

    if (selectId && items.some((n) => n.id === selectId)) {
      rowIndex = items.findIndex((n) => n.id === selectId);
    } else {
      selectId = items[0]?.id ?? null;
      rowIndex = 0;
    }

    setLeftSelectedId(selectId);
    setActiveRowIndex(rowIndex);
    setActivePane('left');
    setSelectedLeaf(null);
  };

  /** Click in left column: change selection and refresh right pane only. */
  const handleLeftClick = (node: VariableMenuNode, index: number) => {
    setLeftSelectedId(node.id);
    setActivePane('left');
    setActiveRowIndex(index);
    setSelectedLeaf(null);
  };

  /** Click expandable row in right column at root: enter third layer. */
  const drillFromRightAtRoot = (node: VariableMenuNode) => {
    const categoryId = leftSelectedId;
    if (!categoryId) return;
    setPathIds([categoryId]);
    setLeftSelectedId(node.id);
    setActivePane('left');
    const siblings = getChildrenAtPath(VARIABLE_DROPDOWN_ROOT, [categoryId]);
    setActiveRowIndex(Math.max(0, siblings.findIndex((n) => n.id === node.id)));
    setSelectedLeaf(null);
  };

  /** Click in right column. */
  const handleRightClick = (node: VariableMenuNode, index: number) => {
    setActivePane('right');
    setActiveRowIndex(index);

    if (!hasChildren(node)) {
      pickLeaf(node);
      return;
    }

    if (pathIds.length === 0) {
      drillFromRightAtRoot(node);
      return;
    }

    // Third layer: folder is already a left-column sibling — select it there.
    setLeftSelectedId(node.id);
    setActivePane('left');
    const idx = leftItems.findIndex((n) => n.id === node.id);
    setActiveRowIndex(idx >= 0 ? idx : 0);
    setSelectedLeaf(null);
  };

  const goToBreadcrumb = (segmentIndex: number) => {
    const snapshot = breadcrumbSegments[segmentIndex];
    if (snapshot) applySnapshot(snapshot);
  };

  const goBackOneLevel = () => {
    if (pathIds.length > 0) {
      applySnapshot({ pathIds: [], leftSelectedId: pathIds[0] });
      return;
    }
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
          if (showRightColumn) {
            setActivePane('right');
            setActiveRowIndex(0);
          }
        } else if (hasChildren(node)) {
          handleRightClick(node, activeRowIndex);
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
        handleLeftClick(node, activeRowIndex);
      } else {
        handleRightClick(node, activeRowIndex);
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
            Select variable
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

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {isSearchMode ? (
            <>
              <p className="shrink-0 px-5 py-2.5 text-[12px] text-gray-500 border-b border-gray-50">
                {searchResultsLabel}
              </p>
              <div className="flex-1 min-h-0 overflow-y-auto py-2">
                {searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      data-modal-highlight-id={item.id}
                      className={`w-full text-left px-5 py-3 text-[14px] border-0 bg-transparent transition-colors ${
                        index === activeRowIndex ? 'bg-gray-100 font-medium' : 'bg-white hover:bg-gray-50'
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
                  <div className="flex min-h-[200px] items-center justify-center px-5">
                    <p className="text-[13px] text-gray-400">No matching variables</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
            <nav
              className="px-5 py-2.5 text-[12px] text-gray-500 border-b border-gray-50 shrink-0 flex flex-wrap items-center gap-1"
              aria-label="Variable browser path"
            >
              <button
                type="button"
                onClick={() => goToBreadcrumb(0)}
                className={`border-0 bg-transparent p-0 text-[12px] ${
                  breadcrumbLabels.length === 0
                    ? 'text-gray-900 font-medium cursor-default'
                    : 'text-gray-500 hover:text-gray-900 cursor-pointer'
                }`}
              >
                {OBJECT_ROOT_LABEL}
              </button>
              {breadcrumbLabels.map((label, index) => (
                <span key={`${label}-${index}`} className="inline-flex items-center gap-1">
                  <span className="text-gray-300" aria-hidden>
                    ›
                  </span>
                  {index < breadcrumbLabels.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => goToBreadcrumb(index + 1)}
                      className="border-0 bg-transparent p-0 text-[12px] text-gray-500 hover:text-gray-900 cursor-pointer"
                    >
                      {label}
                    </button>
                  ) : (
                    <span className="text-gray-900 font-medium">{label}</span>
                  )}
                </span>
              ))}
            </nav>
            <div className="flex flex-1 min-h-0 divide-x divide-gray-100">
              <ColumnList
                items={leftItems}
                selectedId={leftSelectedId}
                highlightedId={activePane === 'left' ? highlightedId : null}
                onSelect={handleLeftClick}
                showChevron
                showChevronInColumn="left"
                folderPathIds={pathIds}
                className={showRightColumn ? 'flex-1' : 'flex-1 w-full'}
              />
              {showRightColumn && (
                <ColumnList
                  items={rightItems}
                  selectedId={selectedLeaf?.id ?? null}
                  highlightedId={activePane === 'right' ? highlightedId : null}
                  onSelect={handleRightClick}
                  showChevron
                  showChevronInColumn="right"
                  folderPathIds={[...pathIds, leftSelectedId].filter(Boolean) as string[]}
                  className="flex-1"
                />
              )}
            </div>
          </>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 shrink-0 bg-white">
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
  onSelect,
  showChevron,
  showChevronInColumn,
  folderPathIds = [],
  className = 'flex-1',
}: {
  items: VariableMenuNode[];
  selectedId: string | null;
  highlightedId: string | null;
  onSelect: (node: VariableMenuNode, index: number) => void;
  showChevron: boolean;
  showChevronInColumn: 'left' | 'right';
  folderPathIds?: string[];
  className?: string;
}) {
  return (
    <div className={`overflow-y-auto min-h-0 min-w-0 ${className}`}>
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
            ? getDropdownFolderLabel(node, folderPathIds)
            : node.label;
          const showChevronOnRow = showChevron && expandable;

          return (
            <button
              key={node.id}
              type="button"
              data-modal-highlight-id={node.id}
              onClick={() => onSelect(node, index)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-[14px] border-0 transition-colors ${
                isHighlighted
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : isSelected
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ModalFieldIcon node={node} />
              <span className="flex-1 truncate">{rowLabel}</span>
              {showChevronOnRow && (
                <ChevronRight
                  size={14}
                  className={`text-gray-400 shrink-0 ${
                    showChevronInColumn === 'right' ? '' : ''
                  }`}
                />
              )}
            </button>
          );
        })
      )}
    </div>
  );
}

export default AddVariablesModal;
