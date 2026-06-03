import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { VARIABLE_TREE, type VariableMenuNode } from '../variablesCatalog';
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

const AddVariablesModal: React.FC<Props> = ({ isOpen, onClose, onInsert }) => {
  const [search, setSearch] = useState('');
  const [col1Id, setCol1Id] = useState<string | null>(null);
  const [col2Id, setCol2Id] = useState<string | null>(null);
  const [selectedLeaf, setSelectedLeaf] = useState<VariableItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    const first = VARIABLE_TREE[0];
    setCol1Id(first?.id ?? null);
    const firstChild = first?.children?.[0];
    setCol2Id(firstChild?.id ?? null);
    setSelectedLeaf(null);
  }, [isOpen]);

  const col1Items = VARIABLE_TREE;
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

  const breadcrumbs = useMemo(() => {
    const ids = [col1Id, col2Id].filter(Boolean) as string[];
    return getBreadcrumbLabels(ids);
  }, [col1Id, col2Id]);

  const searchResults = useMemo(() => searchVariableItems(search), [search]);

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

  const handleInsert = () => {
    if (!selectedLeaf) return;
    onInsert(selectedLeaf);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="add-variables-title"
        className="relative w-full max-w-[820px] max-h-[min(560px,calc(100vh-48px))] bg-white rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 id="add-variables-title" className="text-[15px] font-semibold text-gray-900 shrink-0">
            Add variables
          </h2>
          <div className="flex-1 max-w-md mx-auto relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

        {search.trim() ? (
          <div className="flex-1 overflow-y-auto py-2">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`w-full text-left px-5 py-3 text-[14px] border-0 bg-transparent hover:bg-gray-50 ${
                  selectedLeaf?.id === item.id ? 'bg-gray-100' : ''
                }`}
                onClick={() => setSelectedLeaf(item)}
              >
                {item.label}
              </button>
            ))}
            {searchResults.length === 0 && (
              <p className="py-10 text-center text-[13px] text-gray-400">No matching variables</p>
            )}
          </div>
        ) : (
          <>
            {breadcrumbs.length > 0 && (
              <div className="px-5 py-2 text-[12px] text-gray-400 border-b border-gray-50 shrink-0">
                {breadcrumbs.join(' › ')}
              </div>
            )}
            <div className="flex flex-1 min-h-0 divide-x divide-gray-100">
              <ColumnList
                items={col1Items}
                selectedId={col1Id}
                onSelect={handleCol1}
                showChevron
              />
              <ColumnList
                items={col2Items}
                selectedId={col2Id}
                onSelect={handleCol2}
                showChevron
              />
              <ColumnList
                items={col3Items}
                selectedId={selectedLeaf?.id ?? null}
                onSelect={handleCol3}
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
  onSelect,
  showChevron,
  highlightLeaf,
}: {
  items: VariableMenuNode[];
  selectedId: string | null;
  onSelect: (node: VariableMenuNode) => void;
  showChevron: boolean;
  highlightLeaf?: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto min-w-0">
      {items.map((node) => {
        const isSelected = selectedId === node.id;
        const expandable = hasChildren(node);
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelect(node)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-[14px] border-0 transition-colors ${
              isSelected && (highlightLeaf || !expandable)
                ? 'bg-gray-100 text-gray-900 font-medium'
                : isSelected
                  ? 'bg-gray-50 text-gray-900'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex-1 truncate">{node.label}</span>
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
