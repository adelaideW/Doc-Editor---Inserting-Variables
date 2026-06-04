import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import {
  VARIABLE_DROPDOWN_ROOT,
  getDropdownFolderLabel,
  hasVariableChildren,
  type VariableMenuNode,
} from '../variablesCatalog';
import { VARIABLE_LIST_MAX_HEIGHT_CLASS } from './variableListLayout';
import type { VariableItem } from '../VariableDropdown';
import {
  getBreadcrumbLabels,
  hasChildren,
  nodeToVariableItem,
  searchVariableItems,
} from './variableTreeNav';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (item: VariableItem) => void;
}

type ActiveCol = 1 | 2 | 3;

const AddVariablesModal: React.FC<Props> = ({ isOpen, onClose, onInsert }) => {
  const [search, setSearch] = useState('');
  const [col1Id, setCol1Id] = useState<string | null>(null);
  const [col2Id, setCol2Id] = useState<string | null>(null);
  const [selectedLeaf, setSelectedLeaf] = useState<VariableItem | null>(null);
  const [activeCol, setActiveCol] = useState<ActiveCol>(1);
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    const first = VARIABLE_DROPDOWN_ROOT[0];
    setCol1Id(first?.id ?? null);
    const firstChild = first?.children?.[0];
    setCol2Id(firstChild?.id ?? null);
    setSelectedLeaf(null);
    setActiveCol(1);
    setActiveRowIndex(0);
    requestAnimationFrame(() => dialogRef.current?.focus());
  }, [isOpen]);

  const col1Items = VARIABLE_DROPDOWN_ROOT;
  const col2Items = useMemo(() => {
    if (!col1Id) return [];
    const node = col1Items.find((n) => n.id === col1Id);
    return node?.children ?? [];
  }, [col1Id, col1Items]);

  const col3Items = useMemo(() => {
    if (!col2Id) return [];
    const node = col2Items.find((n) => n.id === col2Id);
    return node?.children ?? [];
  }, [col2Id, col2Items]);

  const breadcrumbPathIds = useMemo(
    () => [col1Id, col2Id].filter(Boolean) as string[],
    [col1Id, col2Id]
  );

  const breadcrumbs = useMemo(() => getBreadcrumbLabels(breadcrumbPathIds), [breadcrumbPathIds]);

  const searchResults = useMemo(() => searchVariableItems(search), [search]);
  const isSearchMode = search.trim().length > 0;

  const activeColumnItems = useMemo(() => {
    if (isSearchMode) return searchResults;
    if (activeCol === 1) return col1Items;
    if (activeCol === 2) return col2Items;
    return col3Items;
  }, [isSearchMode, searchResults, activeCol, col1Items, col2Items, col3Items]);

  const highlightedId = useMemo(() => {
    if (isSearchMode) {
      const item = searchResults[activeRowIndex];
      return item?.id ?? null;
    }
    const items = activeCol === 1 ? col1Items : activeCol === 2 ? col2Items : col3Items;
    return items[activeRowIndex]?.id ?? null;
  }, [isSearchMode, searchResults, activeRowIndex, activeCol, col1Items, col2Items, col3Items]);

  useEffect(() => {
    if (!isOpen) return;
    const len = activeColumnItems.length;
    if (len === 0) return;
    setActiveRowIndex((i) => Math.min(i, len - 1));
  }, [activeColumnItems.length, isOpen]);

  useEffect(() => {
    if (!isOpen || highlightedId == null) return;
    const el = document.querySelector(`[data-modal-highlight-id="${highlightedId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [highlightedId, activeCol, activeRowIndex, isOpen]);

  const pickLeaf = (node: VariableMenuNode, crumbs: string[]) => {
    if (hasChildren(node)) return;
    setSelectedLeaf(nodeToVariableItem(node, crumbs));
  };

  const handleCol1 = (node: VariableMenuNode) => {
    setCol1Id(node.id);
    const firstChild = node.children?.[0];
    setCol2Id(firstChild?.id ?? null);
    setSelectedLeaf(null);
  };

  const handleCol2 = (node: VariableMenuNode) => {
    setCol2Id(node.id);
    setSelectedLeaf(null);
    if (!hasChildren(node)) {
      const crumbs = col1Id ? getBreadcrumbLabels([col1Id]) : [];
      pickLeaf(node, crumbs);
    }
  };

  const handleCol3 = (node: VariableMenuNode) => {
    const crumbs = getBreadcrumbLabels([col1Id!, col2Id!].filter(Boolean) as string[]);
    pickLeaf(node, crumbs);
  };

  const activateRow = (node: VariableMenuNode) => {
    if (isSearchMode) {
      setSelectedLeaf(node as unknown as VariableItem);
      return;
    }
    if (activeCol === 1) {
      handleCol1(node);
      setActiveCol(2);
      setActiveRowIndex(0);
    } else if (activeCol === 2) {
      handleCol2(node);
      if (hasChildren(node)) {
        setActiveCol(3);
        setActiveRowIndex(0);
      }
    } else {
      handleCol3(node);
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

    const items = activeColumnItems;
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
    if (e.key === 'ArrowRight' && !isSearchMode) {
      e.preventDefault();
      const node = items[activeRowIndex] as VariableMenuNode | undefined;
      if (!node) return;

      if (activeCol === 1) {
        if (!hasChildren(node)) return;
        handleCol1(node);
        setActiveCol(2);
        setActiveRowIndex(0);
      } else if (activeCol === 2) {
        if (!hasChildren(node)) return;
        handleCol2(node);
        setActiveCol(3);
        setActiveRowIndex(0);
      }
      return;
    }
    if (e.key === 'ArrowLeft' && !isSearchMode) {
      e.preventDefault();
      if (activeCol === 3) {
        setActiveCol(2);
        const idx = col2Items.findIndex((n) => n.id === col2Id);
        setActiveRowIndex(idx >= 0 ? idx : 0);
      } else if (activeCol === 2) {
        setActiveCol(1);
        const idx = col1Items.findIndex((n) => n.id === col1Id);
        setActiveRowIndex(idx >= 0 ? idx : 0);
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isSearchMode) {
        const item = searchResults[activeRowIndex];
        if (item) setSelectedLeaf(item);
        return;
      }
      const node = items[activeRowIndex] as VariableMenuNode | undefined;
      if (node) activateRow(node);
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
        className="relative w-full max-w-[820px] h-[560px] max-h-[calc(100vh-48px)] bg-white rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden outline-none"
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
                setActiveCol(1);
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
            {breadcrumbs.length > 0 && (
              <div className="px-5 py-2 text-[12px] text-gray-400 border-b border-gray-50 shrink-0">
                {breadcrumbs.join(' › ')}
              </div>
            )}
            <div className={`flex flex-1 min-h-0 divide-x divide-gray-100 ${VARIABLE_LIST_MAX_HEIGHT_CLASS}`}>
              <ColumnList
                items={col1Items}
                selectedId={col1Id}
                highlightedId={activeCol === 1 ? highlightedId : null}
                isKeyboardColumn={activeCol === 1}
                onRowHover={(index) => {
                  setActiveCol(1);
                  setActiveRowIndex(index);
                }}
                onSelect={(node) => {
                  handleCol1(node);
                  setActiveCol(1);
                  setActiveRowIndex(col1Items.findIndex((n) => n.id === node.id));
                }}
                showChevron
                breadcrumbPathIds={[]}
              />
              <ColumnList
                items={col2Items}
                selectedId={col2Id}
                highlightedId={activeCol === 2 ? highlightedId : null}
                isKeyboardColumn={activeCol === 2}
                onRowHover={(index) => {
                  setActiveCol(2);
                  setActiveRowIndex(index);
                }}
                onSelect={(node) => {
                  handleCol2(node);
                  setActiveCol(2);
                  setActiveRowIndex(col2Items.findIndex((n) => n.id === node.id));
                }}
                showChevron
                breadcrumbPathIds={col1Id ? [col1Id] : []}
              />
              <ColumnList
                items={col3Items}
                selectedId={selectedLeaf?.id ?? null}
                highlightedId={activeCol === 3 ? highlightedId : null}
                isKeyboardColumn={activeCol === 3}
                onRowHover={(index) => {
                  setActiveCol(3);
                  setActiveRowIndex(index);
                }}
                onSelect={(node) => {
                  handleCol3(node);
                  setActiveCol(3);
                  setActiveRowIndex(col3Items.findIndex((n) => n.id === node.id));
                }}
                showChevron={false}
                highlightLeaf
              />
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
  showChevron,
  breadcrumbPathIds = [],
  highlightLeaf,
}: {
  items: VariableMenuNode[];
  selectedId: string | null;
  highlightedId: string | null;
  isKeyboardColumn: boolean;
  onRowHover: (index: number) => void;
  onSelect: (node: VariableMenuNode) => void;
  showChevron: boolean;
  breadcrumbPathIds?: string[];
  highlightLeaf?: boolean;
}) {
  return (
    <div className={`flex-1 overflow-y-auto min-w-0 ${VARIABLE_LIST_MAX_HEIGHT_CLASS}`}>
      {items.map((node, index) => {
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
            onClick={() => onSelect(node)}
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
              <ChevronRight size={14} className="text-gray-400 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default AddVariablesModal;
