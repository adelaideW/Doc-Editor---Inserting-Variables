
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { gemini } from '../services/gemini';
import VariableDropdown, { VariableItem, VariableDropdownHandle } from './VariableDropdown';

interface Props {
  insertTrigger?: number;
}

type EmployeeRecord = { id: string; name: string; avatarUrl: string };

/** 40 rows with stable unique ids — required for list keys (names repeat for i and i+20). */
const EMPLOYEE_DIRECTORY: EmployeeRecord[] = Array.from({ length: 40 }, (_, i) => {
  const firstNames = [
    'Avery', 'Jordan', 'Riley', 'Cameron', 'Taylor', 'Morgan', 'Casey', 'Reese', 'Parker', 'Quinn',
    'Drew', 'Alex', 'Skyler', 'Emerson', 'Hayden', 'Logan', 'Rowan', 'Sage', 'Blake', 'Dakota'
  ];
  const lastNames = [
    'Nguyen', 'Patel', 'Kim', 'Garcia', 'Lopez', 'Brown', 'Johnson', 'Lee', 'Wilson', 'Martinez',
    'Thomas', 'Anderson', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker', 'Allen', 'Young'
  ];
  const first = firstNames[i % firstNames.length];
  const last = lastNames[(i * 3) % lastNames.length];
  const id = `emp-${i}`;
  return {
    id,
    name: `${first} ${last}`,
    avatarUrl: `https://i.pravatar.cc/128?img=${(i % 70) + 1}`,
  };
});

const EditorCanvas: React.FC<Props> = ({ insertTrigger }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [filteredItems, setFilteredItems] = useState<VariableItem[]>([]);
  const [recipientPicker, setRecipientPicker] = useState({
    isOpen: false,
    top: 0,
    left: 0,
  });
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const variableDropdownRef = useRef<VariableDropdownHandle>(null);
  const recipientChipRef = useRef<HTMLElement | null>(null);
  const recipientInputRef = useRef<HTMLInputElement | null>(null);
  const showDropdownRef = useRef(false);
  /** Plain-text node replacing a chip during “keyword edit” mode; filter text is visible in the doc */
  const breakoutTextRef = useRef<Text | null>(null);
  /** True after Cmd/Ctrl+A while dropdown is open — next Delete/Backspace clears the whole query. */
  const searchSelectAllRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);
  showDropdownRef.current = showDropdown;

  const recipientMatches = React.useMemo(() => {
    const query = recipientSearchQuery.trim().toLowerCase();
    if (!query) return EMPLOYEE_DIRECTORY;
    const tokens = query.split(/\s+/).filter(Boolean);
    return EMPLOYEE_DIRECTORY.filter(({ name }) => {
      const lowered = name.toLowerCase();
      return tokens.every((token) => lowered.includes(token));
    });
  }, [recipientSearchQuery]);

  const closeRecipientPicker = useCallback(() => {
    recipientChipRef.current = null;
    setRecipientPicker((prev) => ({ ...prev, isOpen: false }));
    setRecipientSearchQuery('');
  }, []);

  const applyChipVisualState = useCallback((chip: HTMLElement, warning: boolean) => {
    chip.className = warning
      ? "variable-chip inline-flex items-center px-2 py-0.5 mx-0.5 rounded bg-amber-50 border border-amber-300 text-[14px] text-amber-900 font-medium select-none align-baseline leading-tight transition-all duration-200 cursor-pointer group"
      : "variable-chip inline-flex items-center px-2 py-0.5 mx-0.5 rounded bg-[#7A005D]/5 border border-[#7A005D]/20 text-[14px] text-[#7A005D] font-medium select-none align-baseline leading-tight transition-all duration-200 cursor-default group";
  }, []);

  const openRecipientPickerForChip = useCallback((chip: HTMLElement) => {
    const rect = chip.getBoundingClientRect();
    recipientChipRef.current = chip;
    setRecipientPicker({
      isOpen: true,
      top: rect.top - 6,
      left: Math.min(rect.right + 8, window.innerWidth - 360),
    });
    setRecipientSearchQuery('');
    requestAnimationFrame(() => recipientInputRef.current?.focus());
  }, []);

  const resolveChipRecipient = useCallback((employee: EmployeeRecord) => {
    const chip = recipientChipRef.current;
    if (!chip) return;
    chip.setAttribute('data-related-recipient', employee.name);
    chip.setAttribute('data-related-recipient-id', employee.id);
    chip.setAttribute('data-needs-recipient', 'false');
    chip.title =
      `${chip.getAttribute('data-variable-path') ?? ''} — ${employee.name} (${employee.id})`.trim();
    applyChipVisualState(chip, false);
    closeRecipientPicker();
  }, [applyChipVisualState, closeRecipientPicker]);

  const updateDropdownPosition = useCallback(() => {
    const sel = window.getSelection();
    const ed = editorRef.current;
    if (!sel?.rangeCount || !ed) return;

    const live = sel.getRangeAt(0).cloneRange();
    live.collapse(true);

    const rects = live.getClientRects();
    let rect: DOMRect =
      rects.length > 0 ? (rects[rects.length - 1] as DOMRect) : (live.getBoundingClientRect() as DOMRect);

    const sc = live.startContainer;
    if (
      rect.height === 0 &&
      rect.width === 0 &&
      sc.nodeType === Node.TEXT_NODE &&
      (sc as Text).data.length > 0
    ) {
      const t = sc as Text;
      const pos = Math.max(0, Math.min(live.startOffset, t.data.length - 1));
      const probe = live.cloneRange();
      probe.setStart(t, pos);
      probe.setEnd(t, pos + 1);
      const pr = probe.getBoundingClientRect();
      if (pr.height || pr.width) {
        rect = pr;
      }
    }

    /** Empty `contenteditable` often reports a caret rect as tall as `min-height` — anchor to first visual line instead of rect.bottom */
    const LINE_ESTIMATE = 22;
    const CARET_GAP = 12;
    const DROPDOWN_MAX_W = 620;
    let topPx: number;
    let leftPx: number;

    if (rect.height > 48 || rect.width > Math.min(ed.offsetWidth || 640, window.innerWidth) * 0.85) {
      topPx = rect.top + LINE_ESTIMATE + CARET_GAP;
      leftPx = rect.left + 2;
    } else if (rect.height || rect.width) {
      topPx = rect.bottom + CARET_GAP;
      leftPx = rect.left;
    } else {
      const er = ed.getBoundingClientRect();
      topPx = er.top + LINE_ESTIMATE + CARET_GAP;
      leftPx = Math.max(er.left + 8, 8);
    }

    const pad = 8;
    leftPx = Math.max(pad, Math.min(leftPx, window.innerWidth - DROPDOWN_MAX_W - pad));

    setDropdownPos({
      top: topPx,
      left: leftPx,
    });
  }, []);

  /** Replace chip with visible label text + search mode; caret at end — further Backspace removes characters until empty removes variable. */
  const replaceChipWithBreakoutText = useCallback((chip: HTMLElement) => {
    const ed = editorRef.current;
    if (!ed) return false;
    const label = chip.getAttribute('data-variable') ?? '';
    const parent = chip.parentNode;
    if (!parent) return false;

    const textNode = document.createTextNode(label);
    parent.replaceChild(textNode, chip);

    breakoutTextRef.current = textNode;
    setSearchQuery(label);
    setShowDropdown(true);
    setActiveIndex(0);

    const sel = window.getSelection();
    if (sel) {
      const r = document.createRange();
      r.setStart(textNode, textNode.data.length);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    }

    requestAnimationFrame(() => {
      updateDropdownPosition();
      ed.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return true;
  }, [updateDropdownPosition]);

  // Trigger from DocumentHeader button — `{` is not written to the canvas; caret anchors the dropdown.
  useLayoutEffect(() => {
    if (insertTrigger && insertTrigger > 0 && editorRef.current) {
      breakoutTextRef.current = null;
      editorRef.current.focus();
      setShowDropdown(true);
      setSearchQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => updateDropdownPosition());
    }
  }, [insertTrigger, updateDropdownPosition]);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  // Keep the menu aligned with the typed `{` while scrolling or resizing
  useEffect(() => {
    if (!showDropdown) return;
    const ro = new ResizeObserver(() => updateDropdownPosition());
    const root = editorRef.current?.closest('.overflow-y-auto') ?? document.documentElement;
    ro.observe(root);
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [showDropdown, updateDropdownPosition]);

  const createChip = (item: VariableItem) => {
    const label = item.insertLabel ?? item.label;
    const chip = document.createElement('span');
    const warning = item.needsRecipient === true;
    applyChipVisualState(chip, warning);
    chip.contentEditable = "false";
    chip.setAttribute('data-variable', label);
    chip.setAttribute('data-variable-path', item.path);
    chip.setAttribute('data-needs-recipient', warning ? 'true' : 'false');
    chip.title = item.path;
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'pointer-events-none';
    labelSpan.textContent = label;
    chip.appendChild(labelSpan);
    const rule = document.createElement('div');
    rule.className = 'mx-1.5 w-[1px] h-3 bg-[#7A005D]/20 pointer-events-none';
    chip.appendChild(rule);
    const delBtn = document.createElement('button');
    delBtn.className =
      'chip-delete-btn p-0.5 rounded hover:bg-[#7A005D]/10 transition-colors flex items-center justify-center cursor-pointer';
    delBtn.type = 'button';
    delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="opacity-60 pointer-events-none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
    chip.appendChild(delBtn);
    return chip;
  };

  const handleVariableSelect = useCallback((item: VariableItem) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);

    const chip = createChip(item);

    const bo = breakoutTextRef.current;
    if (bo && bo.parentNode) {
      bo.parentNode.replaceChild(chip, bo);
      breakoutTextRef.current = null;
      sel.removeAllRanges();
      const r = document.createRange();
      const space = document.createTextNode('\u00A0');
      r.setStartAfter(chip);
      r.insertNode(space);
      r.setStartAfter(space);
      r.collapse(true);
      sel.addRange(r);
      setShowDropdown(false);
      setSearchQuery('');
      setIsEmpty(false);
      setActiveIndex(0);
      return;
    }

    range.insertNode(chip);
    range.setStartAfter(chip);
    range.setEndAfter(chip);
    
    const space = document.createTextNode('\u00A0'); 
    range.insertNode(space);
    range.setStartAfter(space);
    range.setEndAfter(space);
    
    sel.removeAllRanges();
    sel.addRange(range);

    setShowDropdown(false);
    setSearchQuery("");
    setIsEmpty(false);
    setActiveIndex(0);
  }, [applyChipVisualState]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const hasChips = el.querySelectorAll('.variable-chip').length > 0;
    setIsEmpty(el.innerText.trim() === '' && !hasChips);

    const detachedBo = breakoutTextRef.current;
    if (detachedBo && !detachedBo.parentNode) {
      breakoutTextRef.current = null;
      setShowDropdown(false);
      setSearchQuery('');
    }

    const activeBo = breakoutTextRef.current;
    if (activeBo?.parentNode) {
      const data = activeBo.data;
      setSearchQuery(data);
      if (data === '') {
        activeBo.remove();
        breakoutTextRef.current = null;
        setShowDropdown(false);
        setSearchQuery('');
        const hasAnyChips = el.querySelectorAll('.variable-chip').length > 0;
        setIsEmpty(el.innerText.trim() === '' && !hasAnyChips);
      }
    }

    if (showDropdownRef.current) {
      requestAnimationFrame(() => updateDropdownPosition());
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!showDropdownRef.current) return;
    if (breakoutTextRef.current?.parentNode) return;

    const plain = e.clipboardData?.getData('text/plain');
    if (!plain) return;
    e.preventDefault();
    setSearchQuery((s) => s + plain.replace(/\s+/g, ' '));
    requestAnimationFrame(() => updateDropdownPosition());
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const deleteBtn = target.closest('.chip-delete-btn');
    
    if (deleteBtn) {
      const chip = deleteBtn.closest('.variable-chip');
      if (chip) {
        chip.remove();
        const el = editorRef.current;
        if (el) {
          const hasChips = el.querySelectorAll('.variable-chip').length > 0;
          setIsEmpty(el.innerText.trim() === "" && !hasChips);
        }
      }
    }

    const chip = target.closest('.variable-chip') as HTMLElement | null;
    if (chip && chip.getAttribute('data-needs-recipient') === 'true') {
      openRecipientPickerForChip(chip);
      return;
    }
    if (!chip) {
      closeRecipientPicker();
    }
    
    if (showDropdown) {
      breakoutTextRef.current = null;
      setShowDropdown(false);
      setSearchQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showDropdown) {
      const mod = e.ctrlKey || e.metaKey || e.altKey;
      const inBreakout = !!breakoutTextRef.current?.parentNode;

      if (inBreakout) {
        // Typing/backspace/delete apply to visible label text in the editor; picker filters via handleInput sync.
        if (e.key === 'Backspace' || e.key === 'Delete') {
          return;
        }
        if (!mod && e.key.length === 1) {
          return;
        }
      } else {
        if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
          e.preventDefault();
          searchSelectAllRef.current = true;
          return;
        }

        if (e.key === 'Backspace' || e.key === 'Delete') {
          if (searchSelectAllRef.current) {
            searchSelectAllRef.current = false;
            e.preventDefault();
            setSearchQuery('');
            requestAnimationFrame(() => updateDropdownPosition());
            return;
          }
          if (e.key === 'Backspace') {
            if (searchQuery.length > 0) {
              e.preventDefault();
              setSearchQuery((s) => s.slice(0, -1));
              requestAnimationFrame(() => updateDropdownPosition());
              return;
            }
            setShowDropdown(false);
            setSearchQuery('');
            return;
          }
        }

        if (!mod && e.key.length === 1) {
          searchSelectAllRef.current = false;
          e.preventDefault();
          setSearchQuery((s) => s + e.key);
          requestAnimationFrame(() => updateDropdownPosition());
          return;
        }
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) =>
          filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
        );
        return;
      }
      if (e.key === 'ArrowRight') {
        if (variableDropdownRef.current?.drillInto()) {
          e.preventDefault();
        }
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (variableDropdownRef.current?.drillOut()) {
          e.preventDefault();
        }
        return;
      }
      if (e.key === 'Enter') {
        if (variableDropdownRef.current?.activateSelection()) {
          e.preventDefault();
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRecipientPicker();
        breakoutTextRef.current = null;
        setShowDropdown(false);
        setSearchQuery('');
        return;
      }

      return;
    }

    if (!showDropdown && e.key === '{') {
      breakoutTextRef.current = null;
      e.preventDefault();
      setShowDropdown(true);
      setSearchQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => updateDropdownPosition());
      return;
    }

    /** Backspace/delete adjacent to chip: unwrap into editable keyword text (full label preserved); chip only disappears after keywords cleared or X button. */
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const sel = window.getSelection();
      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          let chipToBreak: HTMLElement | null = null;

          const sc = range.startContainer;

          if (e.key === 'Backspace') {
            if (sc.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
              const t = sc as Text;
              const ch = t.data.charCodeAt(range.startOffset - 1);
              const prev = t.previousSibling;
              const charBeforeCaret = t.data.charAt(range.startOffset - 1);
              const isNbspPrev = ch === 160 || charBeforeCaret === ' ';
              if (isNbspPrev && prev instanceof HTMLElement && prev.classList.contains('variable-chip')) {
                chipToBreak = prev;
              }
            } else if (sc.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
              const prev = sc.previousSibling;
              if (prev instanceof HTMLElement && prev.classList.contains('variable-chip')) {
                chipToBreak = prev;
              }
            } else if (sc.nodeType === Node.ELEMENT_NODE && range.startOffset > 0) {
              const prev = sc.childNodes[range.startOffset - 1];
              if (prev instanceof HTMLElement && prev.classList.contains('variable-chip')) {
                chipToBreak = prev;
              }
            }
          } else if (e.key === 'Delete') {
            if (sc.nodeType === Node.TEXT_NODE) {
              const t = sc as Text;
              if (range.startOffset === t.data.length) {
                const nx = t.nextSibling;
                if (nx instanceof HTMLElement && nx.classList.contains('variable-chip')) {
                  chipToBreak = nx;
                }
              }
            } else if (sc.nodeType === Node.ELEMENT_NODE && range.startOffset < sc.childNodes.length) {
              const nx = sc.childNodes[range.startOffset];
              if (nx instanceof HTMLElement && nx.classList.contains('variable-chip')) {
                chipToBreak = nx;
              }
            }
          }

          if (chipToBreak) {
            e.preventDefault();
            replaceChipWithBreakoutText(chipToBreak);
          }
        }
      }
    }
  };

  const handleAiAction = async () => {
    if (!aiPrompt || !editorRef.current) return;
    setAiLoading(true);
    const result = await gemini.generateDraft(aiPrompt);
    if (result) {
      const div = document.createElement('div');
      div.className = "mt-4 text-[#1A1A1A]";
      div.innerText = result;
      editorRef.current.appendChild(div);
      setIsEmpty(false);
      setShowAiInput(false);
      setAiPrompt("");
    }
    setAiLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FA] p-12 flex justify-center relative scroll-smooth">
      <div 
        className="w-[850px] min-h-[1100px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border border-gray-200 p-[96px] relative mb-12"
      >
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onClick={handleEditorClick}
          onKeyDown={handleKeyDown}
          className="w-full h-full min-h-[800px] outline-none border-none text-[16px] leading-[1.6] text-[#1A1A1A] font-normal whitespace-pre-wrap selection:bg-[#7A005D]/20 selection:text-[#7A005D]"
          style={{ cursor: 'text' }}
          spellCheck={false}
        />
        
        {isEmpty && (
          <div className="absolute top-[96px] left-[96px] text-gray-300 pointer-events-none text-[16px]">
            Start typing your document...
          </div>
        )}

        {showDropdown && (
          <VariableDropdown
            ref={variableDropdownRef}
            onSelect={handleVariableSelect}
            searchQuery={searchQuery}
            activeIndex={activeIndex}
            onFilteredItemsChange={setFilteredItems}
            onMenuNavigate={() => setActiveIndex(0)}
            style={{
              position: 'fixed',
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              zIndex: 1050,
            }}
          />
        )}

        {recipientPicker.isOpen && (
          <div
            className="fixed z-[1200] w-[340px] rounded-xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.16)] overflow-hidden"
            style={{ top: `${recipientPicker.top}px`, left: `${recipientPicker.left}px` }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="relative border-b border-gray-100">
              <input
                ref={recipientInputRef}
                type="text"
                value={recipientSearchQuery}
                onChange={(e) => setRecipientSearchQuery(e.target.value)}
                className="w-full py-3 pl-10 pr-3 text-[15px] text-gray-700 outline-none"
                placeholder="Search people"
                autoComplete="off"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            </div>
            <div className="max-h-72 overflow-y-auto py-2">
              {recipientMatches.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  className="w-full px-4 py-2 text-left text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  onClick={() => resolveChipRecipient(employee)}
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
              ))}
              {recipientMatches.length === 0 && (
                <div className="px-4 py-5 text-[13px] text-gray-400">No results found</div>
              )}
            </div>
          </div>
        )}

        {/* Floating AI Helper */}
        <div className="absolute top-12 right-12">
          {showAiInput ? (
            <div className="bg-white border border-[#7A005D]/20 rounded-xl shadow-2xl p-4 w-80 animate-in fade-in zoom-in duration-200 z-30">
              <div className="flex items-center gap-2 mb-3 text-[#7A005D]">
                <Sparkles size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Lumina AI assistant</span>
              </div>
              <textarea
                autoFocus
                className="w-full text-sm border-gray-200 rounded-lg p-2 focus:ring-[#7A005D] focus:border-[#7A005D] mb-2 outline-none"
                placeholder="Describe what you want to write..."
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAiInput(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleAiAction} disabled={aiLoading} className="px-3 py-1.5 text-xs bg-[#7A005D] text-white rounded-md hover:bg-[#66004D] disabled:opacity-50 flex items-center gap-2 font-semibold">
                  {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  Generate
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAiInput(true)}
              className="bg-white border border-gray-200 rounded-full p-2.5 text-[#7A005D] shadow-md hover:shadow-lg transition-all group"
            >
              <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      <div className="fixed right-0 top-1/2 -translate-y-1/2 flex items-center bg-white border border-gray-200 shadow-sm px-1 py-4 rounded-l-md cursor-pointer hover:bg-gray-50 z-20 group transition-all">
        <div className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-bold text-gray-400 group-hover:text-gray-600 uppercase tracking-widest flex items-center gap-2">
          Share feedback
          <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
