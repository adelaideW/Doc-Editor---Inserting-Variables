import React from 'react';
import { ChevronRight, Search } from 'lucide-react';
import VariableDropdown, {
  type VariableDropdownHandle,
  type VariableItem,
} from '../VariableDropdown';
import type { CombinedSearchItem } from './combinedMenuSearch';
import {
  IMPORT_ROW,
  INSERT_VARIABLES_ROW,
  SLASH_BLOCK_ROWS,
  WRITE_WITH_AI_ROW,
  type SlashMenuItemId,
} from './SlashBlockMenu';

export type CombinedMenuView = 'root' | 'variablesDrillIn';

interface Props {
  top: number;
  left: number;
  combinedMenuView: CombinedMenuView;
  searchQuery: string;
  searchResults: CombinedSearchItem[];
  searchActiveIndex: number;
  rootActiveIndex: number;
  activeIndex: number;
  variableDropdownRef: React.RefObject<VariableDropdownHandle | null>;
  onSelect: (item: VariableItem) => void;
  onFilteredItemsChange: (items: VariableItem[]) => void;
  onMenuNavigate: () => void;
  onVariableRowHover: (index: number) => void;
  onDrillIntoVariables: () => void;
  onBackToRoot: () => void;
  onBlockSelect: (id: SlashMenuItemId) => void;
  onRootRowHover: (index: number) => void;
  onSearchRowHover: (index: number) => void;
  onSearchBlockSelect: (id: SlashMenuItemId) => void;
  onSearchVariableSelect: (item: VariableItem) => void;
}

const CombinedInsertMenu: React.FC<Props> = ({
  top,
  left,
  combinedMenuView,
  searchQuery,
  searchResults,
  searchActiveIndex,
  rootActiveIndex,
  activeIndex,
  variableDropdownRef,
  onSelect,
  onFilteredItemsChange,
  onMenuNavigate,
  onVariableRowHover,
  onDrillIntoVariables,
  onBackToRoot,
  onBlockSelect,
  onRootRowHover,
  onSearchRowHover,
  onSearchBlockSelect,
  onSearchVariableSelect,
}) => {
  const isSearchMode = searchQuery.trim().length > 0;
  const insertVariablesRow = INSERT_VARIABLES_ROW;

  return (
    <div
      className="fixed z-[1050] w-[min(100vw-32px,620px)] min-w-[280px] bg-white border border-gray-200 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col"
      style={{ top, left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {isSearchMode ? (
        <>
          <div className="px-4 pt-3 pb-2 text-[11px] text-gray-500 border-b border-gray-50 shrink-0">
            Searching:{' '}
            <span className="font-medium text-gray-700" title={searchQuery}>
              “{searchQuery}”
            </span>
          </div>
          <div className="flex flex-col py-1 overflow-y-auto max-h-[min(460px,calc(100vh-220px))]">
            {searchResults.length > 0 ? (
              searchResults.map((row, index) => {
                const active = index === searchActiveIndex;
                if (row.kind === 'block') {
                  return (
                    <button
                      key={`block:${row.id}`}
                      type="button"
                      onMouseEnter={() => onSearchRowHover(index)}
                      onClick={() => onSearchBlockSelect(row.id)}
                      className={`w-full text-left px-3 py-2.5 flex gap-3 border-0 transition-colors ${
                        active
                          ? 'bg-[#7A005D]/5 text-[#7A005D] cursor-pointer'
                          : 'bg-white hover:bg-gray-50 cursor-pointer text-gray-800'
                      }`}
                    >
                      <span className="mt-0.5">{row.icon}</span>
                      <span className={`flex-1 text-[14px] ${active ? 'font-medium' : ''}`}>{row.label}</span>
                    </button>
                  );
                }
                return (
                  <button
                    key={`var:${row.item.id}`}
                    type="button"
                    onMouseEnter={() => onSearchRowHover(index)}
                    onClick={() => onSearchVariableSelect(row.item)}
                    className={`w-full text-left px-4 py-3 flex gap-3 border-0 transition-colors ${
                      active
                        ? 'bg-[#7A005D]/5 text-[#7A005D] cursor-pointer'
                        : 'bg-white hover:bg-gray-50 cursor-pointer text-gray-700'
                    }`}
                  >
                    <span className={`flex-1 truncate text-[14px] ${active ? 'font-medium' : ''}`}>
                      {row.item.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Search className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-[13px] text-gray-400">No matching options found</p>
              </div>
            )}
          </div>
        </>
      ) : combinedMenuView === 'variablesDrillIn' ? (
        <>
          <button
            type="button"
            onClick={onBackToRoot}
            className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 bg-[#F9FAFB] text-left w-full border-0 shrink-0"
          >
            <ChevronRight size={14} className="text-gray-400 rotate-180 shrink-0" />
            <span className="text-[13px] font-semibold text-gray-900 flex-1 truncate">
              {insertVariablesRow.label}
            </span>
          </button>
          <VariableDropdown
            ref={variableDropdownRef}
            embedded
            searchQuery=""
            activeIndex={activeIndex}
            onSelect={onSelect}
            onFilteredItemsChange={onFilteredItemsChange}
            onMenuNavigate={onMenuNavigate}
            onRowHover={onVariableRowHover}
            showFocusHighlight
          />
        </>
      ) : (
        <div className="py-1">
          <button
            type="button"
            onMouseEnter={() => onRootRowHover(0)}
            onClick={() => onBlockSelect('write-with-ai')}
            className={`w-full text-left px-3 py-2.5 flex gap-3 items-start border-0 transition-colors ${
              rootActiveIndex === 0
                ? 'bg-[#7A005D]/5 text-[#7A005D] cursor-pointer'
                : 'bg-white hover:bg-gray-50 cursor-pointer text-gray-800'
            }`}
          >
            <span className="mt-0.5">{WRITE_WITH_AI_ROW.icon}</span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[14px] ${rootActiveIndex === 0 ? 'font-medium' : ''}`}>
                {WRITE_WITH_AI_ROW.label}
              </span>
              {WRITE_WITH_AI_ROW.subtitle && (
                <span className="block text-[11px] text-gray-500 mt-0.5 leading-snug">
                  {WRITE_WITH_AI_ROW.subtitle}
                </span>
              )}
            </span>
          </button>

          <button
            type="button"
            onMouseEnter={() => onRootRowHover(1)}
            onClick={onDrillIntoVariables}
            className={`w-full text-left px-3 py-2.5 flex gap-3 items-start border-0 transition-colors ${
              rootActiveIndex === 1
                ? 'bg-[#7A005D]/5 text-[#7A005D] cursor-pointer'
                : 'bg-white hover:bg-gray-50 cursor-pointer text-gray-800'
            }`}
          >
            <span className="mt-0.5">{insertVariablesRow.icon}</span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[14px] ${rootActiveIndex === 1 ? 'font-medium' : ''}`}>
                {insertVariablesRow.label}
              </span>
              {insertVariablesRow.subtitle && (
                <span className="block text-[11px] text-gray-500 mt-0.5 leading-snug">
                  {insertVariablesRow.subtitle}
                </span>
              )}
            </span>
            <ChevronRight
              size={14}
              className={`shrink-0 mt-1 ${rootActiveIndex === 1 ? 'text-[#7A005D]' : 'text-gray-400'}`}
            />
          </button>

          <button
            type="button"
            onMouseEnter={() => onRootRowHover(2)}
            onClick={() => onBlockSelect('import')}
            className={`w-full text-left px-3 py-2.5 flex gap-3 items-start border-0 transition-colors ${
              rootActiveIndex === 2
                ? 'bg-gray-100 cursor-pointer'
                : 'bg-white hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <span className="mt-0.5">{IMPORT_ROW.icon}</span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[14px] ${rootActiveIndex === 2 ? 'font-medium text-gray-900' : 'text-gray-800'}`}>
                {IMPORT_ROW.label}
              </span>
              {IMPORT_ROW.subtitle && (
                <span className="block text-[11px] text-gray-500 mt-0.5 leading-snug">{IMPORT_ROW.subtitle}</span>
              )}
            </span>
          </button>

          {SLASH_BLOCK_ROWS.map((row, index) => {
            const rowIndex = index + 3;
            const active = rootActiveIndex === rowIndex;
            return (
              <button
                key={row.id}
                type="button"
                onMouseEnter={() => onRootRowHover(rowIndex)}
                onClick={() => onBlockSelect(row.id)}
                className={`w-full text-left px-3 py-2.5 flex gap-3 border-0 transition-colors ${
                  active
                    ? 'bg-gray-100 cursor-pointer'
                    : 'bg-white hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <span className="mt-0.5">{row.icon}</span>
                <span className="min-w-0">
                  <span className={`block text-[14px] ${active ? 'font-medium text-gray-900' : 'text-gray-800'}`}>
                    {row.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CombinedInsertMenu;
