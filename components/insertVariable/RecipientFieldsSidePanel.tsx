import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  GripVertical,
  PenTool,
  Pencil,
  Search,
  SquareCheck,
  Trash2,
  Type,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import type { EmployeeRecord } from './RecipientAssignPopover';
import {
  DEFAULT_RECIPIENTS,
  RECIPIENT_FIELD_LABELS,
  RECIPIENT_FIELD_MIME,
  RECIPIENT_FIELD_RID_MIME,
  type RecipientEntry,
  type RecipientFieldLabel,
  type RecipientPanelView,
  toneForRecipient,
} from './recipientFieldsData';

interface Props {
  isOpen: boolean;
  view: RecipientPanelView;
  onViewChange: (view: RecipientPanelView) => void;
  onClose: () => void;
  onInsertField: (fieldLabel: RecipientFieldLabel, recipientId: string) => void;
  employees: EmployeeRecord[];
  /** Panel attaches to the left (V1.5) or right (V1/V2/V2.5) edge of the editor. */
  edge?: 'left' | 'right';
}

const FIELD_ICONS = [Type, SquareCheck, PenTool, Calendar];

const RecipientFieldsSidePanel: React.FC<Props> = ({
  isOpen,
  view,
  onViewChange,
  onClose,
  onInsertField,
  employees,
  edge = 'right',
}) => {
  const [recipients, setRecipients] = useState<RecipientEntry[]>(DEFAULT_RECIPIENTS);
  const [activeRecipientId, setActiveRecipientId] = useState('employee');
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [placeholderModalOpen, setPlaceholderModalOpen] = useState(false);
  const [placeholderLabel, setPlaceholderLabel] = useState('');
  const [editingRecipientId, setEditingRecipientId] = useState<string | null>(null);
  const employeeMenuRef = useRef<HTMLDivElement>(null);

  const activeRecipient = recipients.find((r) => r.id === activeRecipientId);
  const activeTone = toneForRecipient(recipients, activeRecipientId);
  const employeeQuery = employeeSearch.trim().toLowerCase();

  const filteredEmployees = useMemo(() => {
    if (!employeeQuery) return [];
    return employees.filter((e) => e.name.toLowerCase().includes(employeeQuery));
  }, [employeeQuery, employees]);

  const primaryMatchId = filteredEmployees[0]?.id ?? null;

  useEffect(() => {
    if (!employeeMenuOpen) return;
    const onDocDown = (e: MouseEvent) => {
      if (employeeMenuRef.current && !employeeMenuRef.current.contains(e.target as Node)) {
        setEmployeeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [employeeMenuOpen]);

  const startPaletteDrag = (label: RecipientFieldLabel) => (e: React.DragEvent) => {
    e.dataTransfer.setData(RECIPIENT_FIELD_MIME, label);
    e.dataTransfer.setData(RECIPIENT_FIELD_RID_MIME, activeRecipientId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleSavePlaceholderRecipient = () => {
    const label = placeholderLabel.trim();
    if (!label) return;
    if (editingRecipientId) {
      setRecipients((prev) =>
        prev.map((r) => (r.id === editingRecipientId ? { ...r, label } : r))
      );
    } else {
      setRecipients((prev) => {
        const id = `ext-${Date.now().toString(36)}`;
        const nextIndex = Math.max(-1, ...prev.map((r) => r.paletteIndex)) + 1;
        const entry: RecipientEntry = {
          id,
          label,
          sublabel: 'Placeholder recipient',
          paletteIndex: nextIndex,
          kind: 'placeholder',
        };
        setActiveRecipientId(id);
        return [...prev, entry];
      });
    }
    setPlaceholderLabel('');
    setEditingRecipientId(null);
    setPlaceholderModalOpen(false);
    setEmployeeMenuOpen(false);
    setEmployeeSearch('');
  };

  const handleSelectInternalEmployee = (emp: EmployeeRecord) => {
    setRecipients((prev) => {
      const existing = prev.find((r) => r.id === emp.id);
      if (existing) {
        setActiveRecipientId(existing.id);
        return prev;
      }
      const nextIndex = Math.max(-1, ...prev.map((r) => r.paletteIndex)) + 1;
      const entry: RecipientEntry = {
        id: emp.id,
        label: emp.name,
        sublabel: 'Internal recipient',
        paletteIndex: nextIndex,
        kind: 'internal',
      };
      setActiveRecipientId(entry.id);
      return [...prev, entry];
    });
    setEmployeeMenuOpen(false);
    setEmployeeSearch('');
  };

  const handleDeleteRecipient = (id: string) => {
    if (recipients.length <= 1) return;
    setRecipients((prev) => {
      const nextList = prev.filter((r) => r.id !== id);
      if (id === activeRecipientId) {
        setActiveRecipientId(nextList[0]?.id ?? prev[0].id);
      }
      return nextList;
    });
  };

  const handleRenameRecipient = (id: string) => {
    const entry = recipients.find((r) => r.id === id);
    if (!entry) return;
    setEditingRecipientId(id);
    setPlaceholderLabel(entry.label);
    setPlaceholderModalOpen(true);
  };

  if (!isOpen) return null;

  const edgeBorder = edge === 'left' ? 'border-r' : 'border-l';

  const panelBody = (
    <>
      <div className="p-5 flex items-center justify-between border-b border-gray-100 shrink-0">
        <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">
          {view === 'recipients' ? 'RECIPIENTS' : 'RECIPIENT FIELDS'}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 border-0 bg-transparent"
          aria-label="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      <div ref={employeeMenuRef} className="relative z-30 shrink-0 px-4 pt-4">
        <button
          type="button"
          onClick={() => {
            setEmployeeMenuOpen((open) => {
              if (!open) setEmployeeSearch('');
              return !open;
            });
          }}
          className={`w-full border rounded-xl px-4 py-2.5 flex items-center justify-between bg-white hover:bg-gray-50 cursor-pointer shadow-sm transition-colors text-left ${
            employeeMenuOpen ? 'ring-2 ring-[#7A005D]/20 border-[#7A005D]/40' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: activeTone.avatarBg, color: activeTone.avatarIcon }}
            >
              <User size={14} />
            </div>
            <span className="text-[13px] font-bold text-gray-800 truncate">
              {activeRecipient?.label ?? 'Recipient'}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 shrink-0 transition-transform ${employeeMenuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {employeeMenuOpen && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Search people"
                className="flex-1 min-w-0 text-sm outline-none text-gray-900 placeholder:text-gray-400"
                autoFocus
              />
            </div>
            {!employeeQuery ? (
              <div className="py-1 max-h-64 overflow-y-auto">
                {recipients.map((r) => {
                  const tone = toneForRecipient(recipients, r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-0 bg-transparent"
                      onClick={() => {
                        setActiveRecipientId(r.id);
                        setEmployeeMenuOpen(false);
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: tone.avatarBg, color: tone.avatarIcon }}
                      >
                        <User size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{r.label}</div>
                        <div className="text-xs text-gray-500">{r.sublabel}</div>
                      </div>
                      {activeRecipientId === r.id ? (
                        <Check size={18} className="text-[#7A005D] shrink-0" strokeWidth={2.5} />
                      ) : null}
                    </button>
                  );
                })}
                <div className="border-t border-gray-200" />
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-sm font-medium text-gray-900 border-0 bg-transparent"
                  onClick={() => {
                    setEditingRecipientId(null);
                    setPlaceholderLabel('');
                    setPlaceholderModalOpen(true);
                  }}
                >
                  <UserPlus size={18} className="text-gray-600 shrink-0" />
                  Add placeholder recipient
                </button>
              </div>
            ) : (
              <div>
                <div className="max-h-52 overflow-y-auto py-1">
                  {filteredEmployees.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500 text-center">No matches</div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left border-0 bg-transparent"
                        onClick={() => handleSelectInternalEmployee(emp)}
                      >
                        <img
                          src={emp.avatarUrl}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover shrink-0 bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{emp.name}</div>
                        </div>
                        {recipients.some((r) => r.id === emp.id) || primaryMatchId === emp.id ? (
                          <Check size={18} className="text-[#7A005D] shrink-0" strokeWidth={2.5} />
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-gray-200" />
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-sm font-medium text-gray-900 border-0 bg-transparent"
                  onClick={() => {
                    setEditingRecipientId(null);
                    setPlaceholderLabel(employeeSearch.trim());
                    setPlaceholderModalOpen(true);
                  }}
                >
                  <UserPlus size={18} className="text-gray-600 shrink-0" />
                  <span className="truncate">
                    Add &apos;{employeeSearch.trim() || '…'}&apos; as a placeholder recipient
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-2">
        {view === 'fields' ? (
          <div className="space-y-3 pt-2">
            {RECIPIENT_FIELD_LABELS.map((label, i) => {
              const Icon = FIELD_ICONS[i];
              return (
                <div
                  key={label}
                  draggable
                  onDragStart={startPaletteDrag(label)}
                  onDoubleClick={() => onInsertField(label, activeRecipientId)}
                  className="flex items-center justify-between p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-sm transition-all border"
                  style={{ backgroundColor: activeTone.bg, borderColor: activeTone.border }}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={18} style={{ color: activeTone.icon }} />
                    <span className="text-[14px] font-bold text-gray-900">{label}</span>
                  </div>
                  <GripVertical size={16} style={{ color: activeTone.border }} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1 pt-2">
            {recipients.map((r) => {
              const tone = toneForRecipient(recipients, r.id);
              const canDelete = recipients.length > 1;
              const canRename =
                r.kind === 'placeholder' && r.id !== 'employee' && r.id !== 'manager';
              return (
                <div key={r.id} className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-gray-50">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: tone.avatarBg, color: tone.avatarIcon }}
                  >
                    <User size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{r.label}</div>
                    <div className="text-xs text-gray-500 truncate">{r.sublabel}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canRename && (
                      <button
                        type="button"
                        onClick={() => handleRenameRecipient(r.id)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-0 bg-transparent"
                        aria-label={`Rename ${r.label}`}
                        title="Rename placeholder"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRecipient(r.id)}
                        className="p-1.5 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 border-0 bg-transparent"
                        aria-label={`Remove ${r.label}`}
                        title="Remove recipient"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {placeholderModalOpen && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPlaceholderModalOpen(false)}
          role="presentation"
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <h3 className="text-[15px] font-semibold text-gray-900">
                {editingRecipientId ? 'Rename placeholder recipient' : 'Add placeholder recipient'}
              </h3>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600 rounded border-0 bg-transparent"
                onClick={() => setPlaceholderModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              value={placeholderLabel}
              onChange={(e) => setPlaceholderLabel(e.target.value)}
              placeholder="Recipient label"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#7A005D]/15 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePlaceholderRecipient();
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlaceholderModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border-0 bg-transparent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlaceholderRecipient}
                disabled={!placeholderLabel.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#7A005D] rounded-lg hover:bg-[#66004D] disabled:opacity-50 border-0"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <aside className={`w-80 bg-white ${edgeBorder} border-gray-200 flex flex-col shrink-0 min-h-0`}>
      {panelBody}
    </aside>
  );
};

export default RecipientFieldsSidePanel;
