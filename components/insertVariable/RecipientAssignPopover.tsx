import React, { useEffect, useRef, useState } from 'react';
import { Check, Search, User, UserPlus, X } from 'lucide-react';

export type EmployeeRecord = { id: string; name: string; avatarUrl: string };

export type PlaceholderRecipient = {
  id: string;
  label: string;
  sublabel: string;
  avatarBg: string;
  avatarIcon: string;
};

export const BUILTIN_PLACEHOLDERS: PlaceholderRecipient[] = [
  {
    id: 'employee',
    label: 'Employee',
    sublabel: 'Placeholder recipient',
    avatarBg: 'rgba(122, 0, 93, 0.12)',
    avatarIcon: '#7A005D',
  },
  {
    id: 'manager',
    label: "Employee's manager",
    sublabel: 'Placeholder recipient',
    avatarBg: 'rgba(16, 185, 129, 0.15)',
    avatarIcon: '#059669',
  },
];

export type RecipientSelection =
  | { kind: 'placeholder'; id: string; label: string }
  | { kind: 'internal'; employee: EmployeeRecord };

interface Props {
  top: number;
  left: number;
  employees: EmployeeRecord[];
  placeholders?: PlaceholderRecipient[];
  selectedRecipientId?: string | null;
  onSelect: (selection: RecipientSelection) => void;
  onClose: () => void;
}

const RecipientAssignPopover: React.FC<Props> = ({
  top,
  left,
  employees,
  placeholders = BUILTIN_PLACEHOLDERS,
  selectedRecipientId,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [placeholderModalOpen, setPlaceholderModalOpen] = useState(false);
  const [placeholderLabel, setPlaceholderLabel] = useState('');
  const [customPlaceholders, setCustomPlaceholders] = useState<PlaceholderRecipient[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allPlaceholders = [...placeholders, ...customPlaceholders];
  const query = searchQuery.trim().toLowerCase();

  const filteredEmployees = query
    ? employees.filter((e) => e.name.toLowerCase().includes(query))
    : [];

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [searchQuery]);

  const handleAddPlaceholder = () => {
    const label = placeholderLabel.trim();
    if (!label) return;
    const id = `placeholder-${Date.now()}`;
    const entry: PlaceholderRecipient = {
      id,
      label,
      sublabel: 'Placeholder recipient',
      avatarBg: 'rgba(99, 102, 241, 0.12)',
      avatarIcon: '#6366f1',
    };
    setCustomPlaceholders((prev) => [...prev, entry]);
    onSelect({ kind: 'placeholder', id, label });
    setPlaceholderModalOpen(false);
    setPlaceholderLabel('');
  };

  return (
    <>
      <div
        className="fixed z-[1200] w-[340px] rounded-xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.16)] overflow-hidden ring-2 ring-blue-400/80"
        style={{ top, left }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="relative border-b border-gray-100">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
            className="w-full py-3 pl-10 pr-10 text-[15px] text-gray-700 outline-none"
            placeholder="Search people"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 text-gray-400 border-0 bg-transparent"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={listRef} role="listbox" className="max-h-80 overflow-y-auto py-1">
          {!query ? (
            <>
              {allPlaceholders.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={selectedRecipientId === p.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-0 bg-transparent"
                  onClick={() => onSelect({ kind: 'placeholder', id: p.id, label: p.label })}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: p.avatarBg, color: p.avatarIcon }}
                  >
                    <User size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{p.label}</div>
                    <div className="text-xs text-gray-500">{p.sublabel}</div>
                  </div>
                  {selectedRecipientId === p.id ? (
                    <Check size={18} className="text-blue-600 shrink-0" strokeWidth={2.5} />
                  ) : null}
                </button>
              ))}
              <div className="border-t border-gray-200 my-1" />
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-sm font-medium text-gray-900 border-0 bg-transparent"
                onClick={() => {
                  setPlaceholderLabel('');
                  setPlaceholderModalOpen(true);
                }}
              >
                <UserPlus size={18} className="text-gray-600 shrink-0" />
                Add placeholder recipient
              </button>
            </>
          ) : filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee, index) => (
              <button
                key={employee.id}
                type="button"
                role="option"
                aria-selected={index === highlightIndex}
                className={`w-full px-4 py-2.5 text-left text-[14px] text-gray-700 flex items-center gap-3 border-0 bg-transparent ${
                  index === highlightIndex ? 'bg-[#7A005D]/8' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => onSelect({ kind: 'internal', employee })}
              >
                <img
                  src={employee.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-gray-200 bg-gray-100"
                />
                <span className="truncate">{employee.name}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-5 text-[13px] text-gray-400">No results found</div>
          )}
        </div>
      </div>

      {placeholderModalOpen && (
        <div className="fixed inset-0 z-[1210] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setPlaceholderModalOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal
            className="relative w-full max-w-[360px] bg-white rounded-xl shadow-xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-semibold text-gray-900">Add placeholder recipient</h3>
            </div>
            <div className="px-5 py-4">
              <label htmlFor="placeholder-name" className="block text-[12px] font-medium text-gray-600 mb-1.5">
                Name
              </label>
              <input
                id="placeholder-name"
                type="text"
                value={placeholderLabel}
                onChange={(e) => setPlaceholderLabel(e.target.value)}
                placeholder="e.g. Legal counsel"
                className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#7A005D]/15"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPlaceholder();
                  if (e.key === 'Escape') setPlaceholderModalOpen(false);
                }}
              />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPlaceholderModalOpen(false)}
                className="text-[14px] text-gray-600 border-0 bg-transparent px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!placeholderLabel.trim()}
                onClick={handleAddPlaceholder}
                className="px-4 py-2 rounded-full text-[14px] font-medium border-0 bg-[#7A005D] text-white hover:bg-[#66004D] disabled:bg-gray-200 disabled:text-gray-400"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecipientAssignPopover;
