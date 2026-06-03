
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { gemini } from '../services/gemini';
import VariableDropdown, { VariableItem, VariableDropdownHandle } from './VariableDropdown';
import {
  usesAddVariablesModal,
  usesCombinedInsertMenu,
  usesSidePanel,
  type InsertVersion,
} from './insertVersions';
import {
  applyChipVisualState,
  getChipsInSelection,
  insertClonedChipsAtCaret,
  insertHtmlAtCaret,
  insertBulletedListAtCaret,
  insertNumberedListAtCaret,
  insertVariableAtCaret,
  parseChipsFromHtml,
} from './insertVariable/insertVariableAtCaret';
import { getVariableDescription } from './insertVariable/variableDescriptions';
import ObjectGraphSidePanel from './insertVariable/ObjectGraphSidePanel';
import ObjectGraphCollapsedRail from './insertVariable/ObjectGraphCollapsedRail';
import AddVariablesModal from './insertVariable/AddVariablesModal';
import SlashBlockMenu, {
  SLASH_BLOCK_ROWS,
  SLASH_MENU_ROWS,
  type SlashMenuItemId,
} from './insertVariable/SlashBlockMenu';
import CombinedInsertMenu, { type CombinedMenuView } from './insertVariable/CombinedInsertMenu';
import {
  COMBINED_ROOT_ROW_COUNT,
  searchCombinedMenu,
} from './insertVariable/combinedMenuSearch';
import InsertLinkModal from './insertVariable/InsertLinkModal';
import {
  codeSnippetHtml,
  linkHtml,
  quoteBlockHtml,
} from './insertVariable/slashMenuContent';
import VariableChipRouteTooltip from './insertVariable/VariableChipRouteTooltip';
import { collectUsedVariableIds } from './insertVariable/collectUsedVariableIds';

interface Props {
  insertTrigger?: number;
  insertVersion: InsertVersion;
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

const EditorCanvas: React.FC<Props> = ({ insertTrigger, insertVersion }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [slashActiveIndex, setSlashActiveIndex] = useState(0);
  const [combinedMenuView, setCombinedMenuView] = useState<CombinedMenuView>('root');
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);
  
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
  const [recipientHighlightIndex, setRecipientHighlightIndex] = useState(0);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const variableDropdownRef = useRef<VariableDropdownHandle>(null);
  const recipientChipRef = useRef<HTMLElement | null>(null);
  const recipientInputRef = useRef<HTMLInputElement | null>(null);
  const recipientScrollRef = useRef<HTMLDivElement | null>(null);
  const showDropdownRef = useRef(false);
  /** Plain-text node replacing a chip during “keyword edit” mode; filter text is visible in the doc */
  const breakoutTextRef = useRef<Text | null>(null);
  /** True after Cmd/Ctrl+A while dropdown is open — next Delete/Backspace clears the whole query. */
  const searchSelectAllRef = useRef(false);
  /** Backspaces pressed while search query is already empty; dismiss after 2. */
  const emptyBackspaceCountRef = useRef(0);
  const [isEmpty, setIsEmpty] = useState(true);
  const [usedVariableIds, setUsedVariableIds] = useState<Set<string>>(() => new Set());
  const [chipRouteTooltip, setChipRouteTooltip] = useState<{
    description: string;
    rect: DOMRect;
  } | null>(null);
  showDropdownRef.current = showDropdown;

  const refreshUsedVariables = useCallback(() => {
    setUsedVariableIds(collectUsedVariableIds(editorRef.current));
  }, []);

  const recipientMatches = React.useMemo(() => {
    const query = recipientSearchQuery.trim().toLowerCase();
    if (!query) return EMPLOYEE_DIRECTORY;
    const tokens = query.split(/\s+/).filter(Boolean);
    return EMPLOYEE_DIRECTORY.filter(({ name }) => {
      const lowered = name.toLowerCase();
      return tokens.every((token) => lowered.includes(token));
    });
  }, [recipientSearchQuery]);

  const recipientHl =
    recipientMatches.length === 0
      ? 0
      : Math.min(recipientHighlightIndex, recipientMatches.length - 1);

  useEffect(() => {
    if (!recipientPicker.isOpen) return;
    setRecipientHighlightIndex(0);
  }, [recipientPicker.isOpen, recipientSearchQuery]);

  useLayoutEffect(() => {
    if (!recipientPicker.isOpen || recipientMatches.length === 0) return;
    const pane = recipientScrollRef.current;
    const el = pane?.querySelector<HTMLElement>(`[data-recipient-highlight-index="${recipientHl}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [recipientPicker.isOpen, recipientHl, recipientMatches]);

  const closeRecipientPicker = useCallback(() => {
    recipientChipRef.current = null;
    setRecipientPicker((prev) => ({ ...prev, isOpen: false }));
    setRecipientSearchQuery('');
    setRecipientHighlightIndex(0);
  }, []);

  const closeAllInsertOverlays = useCallback(() => {
    setShowDropdown(false);
    setSearchQuery('');
    setActiveIndex(0);
    breakoutTextRef.current = null;
    setSidePanelOpen(false);
    setAddModalOpen(false);
    setLinkModalOpen(false);
    setShowSlashMenu(false);
    setSlashActiveIndex(0);
    setCombinedMenuView('root');
    setSearchActiveIndex(0);
    searchSelectAllRef.current = false;
    emptyBackspaceCountRef.current = 0;
    closeRecipientPicker();
  }, [closeRecipientPicker]);

  const dismissVariablePicker = useCallback(() => {
    setShowDropdown(false);
    setShowSlashMenu(false);
    setCombinedMenuView('root');
    setSearchQuery('');
    setActiveIndex(0);
    setSearchActiveIndex(0);
    breakoutTextRef.current = null;
    searchSelectAllRef.current = false;
    emptyBackspaceCountRef.current = 0;
  }, []);

  useEffect(() => {
    closeAllInsertOverlays();
  }, [insertVersion, closeAllInsertOverlays]);

  useEffect(() => {
    if (insertVersion === 'v1_5') {
      setSidePanelOpen(true);
    }
  }, [insertVersion]);

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

  const computeCaretAnchor = useCallback(() => {
    const sel = window.getSelection();
    const ed = editorRef.current;
    if (!sel?.rangeCount || !ed) return { top: 0, left: 8 };

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

    return { top: topPx, left: leftPx };
  }, []);

  const updateDropdownPosition = useCallback(() => {
    const anchor = computeCaretAnchor();
    setDropdownPos(anchor);
  }, [computeCaretAnchor]);

  const updateInsertMenuPosition = useCallback(() => {
    const anchor = computeCaretAnchor();
    if (usesCombinedInsertMenu(insertVersion)) {
      setSlashMenuPos(anchor);
    } else {
      setDropdownPos(anchor);
    }
  }, [computeCaretAnchor, insertVersion]);

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
    setActiveIndex(0);
    emptyBackspaceCountRef.current = 0;
    if (usesCombinedInsertMenu(insertVersion)) {
      setSlashMenuPos(computeCaretAnchor());
      setShowSlashMenu(true);
      setCombinedMenuView('variablesDrillIn');
    } else {
      setShowDropdown(true);
    }

    const sel = window.getSelection();
    if (sel) {
      const r = document.createRange();
      r.setStart(textNode, textNode.data.length);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    }

    requestAnimationFrame(() => {
      updateInsertMenuPosition();
      ed.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return true;
  }, [updateInsertMenuPosition, insertVersion, computeCaretAnchor]);

  // Trigger from DocumentHeader button — behavior depends on insertion version.
  useLayoutEffect(() => {
    if (!insertTrigger || insertTrigger <= 0 || !editorRef.current) return;

    editorRef.current.focus();

    if (insertVersion === 'ideal') {
      breakoutTextRef.current = null;
      emptyBackspaceCountRef.current = 0;
      setShowDropdown(true);
      setSearchQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => updateDropdownPosition());
      return;
    }

    if (insertVersion === 'v3_5') {
      breakoutTextRef.current = null;
      emptyBackspaceCountRef.current = 0;
      setSlashMenuPos(computeCaretAnchor());
      setShowSlashMenu(true);
      setCombinedMenuView('root');
      setSearchQuery('');
      setActiveIndex(0);
      setSlashActiveIndex(0);
      setSearchActiveIndex(0);
      return;
    }

    if (insertVersion === 'v1') {
      setSidePanelOpen((open) => !open);
      return;
    }

    if (insertVersion === 'v1_5') {
      setSidePanelOpen(true);
      return;
    }

    if (usesAddVariablesModal(insertVersion)) {
      setAddModalOpen(true);
    }
  }, [insertTrigger, insertVersion, updateDropdownPosition, computeCaretAnchor]);

  const combinedSearchResults = React.useMemo(
    () => searchCombinedMenu(searchQuery),
    [searchQuery]
  );

  useEffect(() => {
    setSearchActiveIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  // Keep the menu aligned with the caret while scrolling or resizing
  useEffect(() => {
    const combinedOpen = showSlashMenu && usesCombinedInsertMenu(insertVersion);
    if (!showDropdown && !combinedOpen) return;
    const ro = new ResizeObserver(() => updateInsertMenuPosition());
    const root = editorRef.current?.closest('.overflow-y-auto') ?? document.documentElement;
    ro.observe(root);
    window.addEventListener('scroll', updateInsertMenuPosition, true);
    window.addEventListener('resize', updateInsertMenuPosition);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', updateInsertMenuPosition, true);
      window.removeEventListener('resize', updateInsertMenuPosition);
    };
  }, [showDropdown, showSlashMenu, insertVersion, updateInsertMenuPosition]);

  const afterChipInserted = useCallback(() => {
    setIsEmpty(false);
    setShowDropdown(false);
    setShowSlashMenu(false);
    setCombinedMenuView('root');
    setSearchQuery('');
    setActiveIndex(0);
    setSearchActiveIndex(0);
    breakoutTextRef.current = null;
    refreshUsedVariables();
  }, [refreshUsedVariables]);

  const handleVariableSelect = useCallback((item: VariableItem) => {
    const ed = editorRef.current;
    if (!ed) return;

    insertVariableAtCaret({
      editorEl: ed,
      item,
      breakoutText: breakoutTextRef.current,
      onInserted: afterChipInserted,
    });
  }, [afterChipInserted]);

  const handleSharedInsert = useCallback(
    (item: VariableItem) => {
      const ed = editorRef.current;
      if (!ed) return;
      ed.focus();
      insertVariableAtCaret({
        editorEl: ed,
        item,
        onInserted: () => {
          setIsEmpty(false);
          refreshUsedVariables();
        },
      });
    },
    [refreshUsedVariables]
  );

  const removeSlashBeforeCaret = useCallback(() => {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const sc = range.startContainer;
    if (sc.nodeType === Node.TEXT_NODE) {
      const t = sc as Text;
      const offset = range.startOffset;
      if (offset > 0 && t.data.charAt(offset - 1) === '/') {
        t.deleteData(offset - 1, 1);
        const r = document.createRange();
        r.setStart(t, offset - 1);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
  }, []);

  const openSlashMenuAtCaret = useCallback(() => {
    removeSlashBeforeCaret();
    setSlashMenuPos(computeCaretAnchor());
    setShowSlashMenu(true);
    setSlashActiveIndex(0);
  }, [computeCaretAnchor, removeSlashBeforeCaret]);

  const openCombinedMenuAtCaret = useCallback(() => {
    removeSlashBeforeCaret();
    setSlashMenuPos(computeCaretAnchor());
    setShowSlashMenu(true);
    setCombinedMenuView('root');
    setSearchQuery('');
    setActiveIndex(0);
    setSlashActiveIndex(0);
    setSearchActiveIndex(0);
    emptyBackspaceCountRef.current = 0;
  }, [computeCaretAnchor, removeSlashBeforeCaret]);

  const openVariableDropdownAtCaret = useCallback(() => {
    removeSlashBeforeCaret();
    breakoutTextRef.current = null;
    emptyBackspaceCountRef.current = 0;
    setShowDropdown(true);
    setSearchQuery('');
    setActiveIndex(0);
    requestAnimationFrame(() => updateDropdownPosition());
  }, [removeSlashBeforeCaret, updateDropdownPosition]);

  const drillIntoCombinedVariables = useCallback(() => {
    setCombinedMenuView('variablesDrillIn');
    setActiveIndex(0);
  }, []);

  const handleSlashSelect = useCallback((id: SlashMenuItemId) => {
    setShowSlashMenu(false);
    setCombinedMenuView('root');
    const ed = editorRef.current;
    if (!ed) return;

    if (id === 'insert-variables') {
      if (!usesCombinedInsertMenu(insertVersion)) {
        setAddModalOpen(true);
      }
      return;
    }

    if (id === 'link') {
      setLinkModalOpen(true);
      return;
    }

    if (id === 'bulleted-list') {
      insertBulletedListAtCaret(ed, () => setIsEmpty(false));
      return;
    }

    if (id === 'numbered-list') {
      insertNumberedListAtCaret(ed, () => setIsEmpty(false));
      return;
    }

    const htmlById: Record<
      Exclude<SlashMenuItemId, 'insert-variables' | 'link' | 'bulleted-list' | 'numbered-list'>,
      string
    > = {
      divider: '<hr><p><br></p>',
      quote: quoteBlockHtml(),
      'normal-text': '<p>Text</p>&nbsp;',
      'code-snippet': codeSnippetHtml(),
    };

    insertHtmlAtCaret(ed, htmlById[id], () => setIsEmpty(false));
  }, [insertVersion]);

  const handleLinkInsert = useCallback((url: string, label: string) => {
    const ed = editorRef.current;
    if (!ed) return;
    insertHtmlAtCaret(ed, linkHtml(url, label), () => setIsEmpty(false));
  }, []);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const hasChips = el.querySelectorAll('.variable-chip').length > 0;
    setIsEmpty(el.innerText.trim() === '' && !hasChips);
    refreshUsedVariables();

    const detachedBo = breakoutTextRef.current;
    if (detachedBo && !detachedBo.parentNode) {
      breakoutTextRef.current = null;
      setShowDropdown(false);
      setShowSlashMenu(false);
      setCombinedMenuView('root');
      setSearchQuery('');
    }

    const activeBo = breakoutTextRef.current;
    if (activeBo?.parentNode) {
      const data = activeBo.data;
      setSearchQuery(data);
      if (data === '') {
        setSearchQuery('');
        emptyBackspaceCountRef.current = 0;
      } else {
        emptyBackspaceCountRef.current = 0;
      }
    }

    if (showDropdownRef.current || (showSlashMenu && usesCombinedInsertMenu(insertVersion))) {
      requestAnimationFrame(() => updateInsertMenuPosition());
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (showDropdownRef.current) {
      if (breakoutTextRef.current?.parentNode) return;

      const plain = e.clipboardData?.getData('text/plain');
      if (!plain) return;
      e.preventDefault();
      setSearchQuery((s) => s + plain.replace(/\s+/g, ' '));
      requestAnimationFrame(() => updateDropdownPosition());
      return;
    }

    const html = e.clipboardData?.getData('text/html');
    if (html?.includes('variable-chip')) {
      const parsed = parseChipsFromHtml(html);
      if (parsed.length > 0) {
        e.preventDefault();
        const ed = editorRef.current;
        if (!ed) return;
        insertClonedChipsAtCaret(ed, parsed, () => {
          setIsEmpty(false);
          refreshUsedVariables();
        });
      }
    }
  };

  const writeChipsToClipboard = (e: React.ClipboardEvent, removeAfter: boolean) => {
    const ed = editorRef.current;
    if (!ed) return false;

    const chips = getChipsInSelection(ed);
    if (chips.length === 0) return false;

    e.preventDefault();
    const html = chips.map((chip) => chip.outerHTML).join(' ');
    const plain = chips.map((chip) => chip.getAttribute('data-variable') ?? '').join(' ');
    e.clipboardData.setData('text/html', html);
    e.clipboardData.setData('text/plain', plain);

    if (removeAfter) {
      chips.forEach((chip) => chip.remove());
      const hasChips = ed.querySelectorAll('.variable-chip').length > 0;
      setIsEmpty(ed.innerText.trim() === '' && !hasChips);
      refreshUsedVariables();
    }
    return true;
  };

  const handleCopy = (e: React.ClipboardEvent<HTMLDivElement>) => {
    writeChipsToClipboard(e, false);
  };

  const handleCut = (e: React.ClipboardEvent<HTMLDivElement>) => {
    writeChipsToClipboard(e, true);
  };

  const handleEditorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const chip = (e.target as HTMLElement).closest('.variable-chip') as HTMLElement | null;
    if (chip?.classList.contains('variable-chip')) {
      const label = chip.getAttribute('data-variable') ?? '';
      const stored = chip.getAttribute('data-variable-description');
      const description = stored || getVariableDescription(label);
      if (description) {
        setChipRouteTooltip({ description, rect: chip.getBoundingClientRect() });
        return;
      }
    }
    setChipRouteTooltip(null);
  };

  const handleEditorMouseLeave = () => {
    setChipRouteTooltip(null);
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
          refreshUsedVariables();
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
    if (showSlashMenu) {
      setShowSlashMenu(false);
      setCombinedMenuView('root');
      setSearchQuery('');
    }
  };

  const handleCombinedSearchEnter = useCallback(
    (index: number) => {
      const row = combinedSearchResults[index];
      if (!row) return;
      if (row.kind === 'block') {
        handleSlashSelect(row.id);
      } else {
        handleVariableSelect(row.item);
      }
    },
    [combinedSearchResults, handleSlashSelect, handleVariableSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const combinedMenuOpen = showSlashMenu && usesCombinedInsertMenu(insertVersion);
    const combinedSearchActive = combinedMenuOpen && searchQuery.trim().length > 0;
    const combinedDrillActive =
      combinedMenuOpen && combinedMenuView === 'variablesDrillIn' && !searchQuery.trim();
    const combinedRootActive =
      combinedMenuOpen && combinedMenuView === 'root' && !searchQuery.trim();

    if (showDropdown) {
      const mod = e.ctrlKey || e.metaKey || e.altKey;
      const inBreakout = !!breakoutTextRef.current?.parentNode;

      if (inBreakout) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          const bo = breakoutTextRef.current;
          if (bo?.parentNode && bo.data.length === 0 && e.key === 'Backspace') {
            e.preventDefault();
            emptyBackspaceCountRef.current += 1;
            if (emptyBackspaceCountRef.current >= 2) {
              bo.remove();
              dismissVariablePicker();
              const el = editorRef.current;
              if (el) {
                const hasAnyChips = el.querySelectorAll('.variable-chip').length > 0;
                setIsEmpty(el.innerText.trim() === '' && !hasAnyChips);
              }
            }
            return;
          }
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
            emptyBackspaceCountRef.current = 0;
            requestAnimationFrame(() => updateInsertMenuPosition());
            return;
          }
          if (e.key === 'Backspace') {
            if (searchQuery.length > 0) {
              e.preventDefault();
              setSearchQuery((s) => s.slice(0, -1));
              emptyBackspaceCountRef.current = 0;
              requestAnimationFrame(() => updateInsertMenuPosition());
              return;
            }
            e.preventDefault();
            emptyBackspaceCountRef.current += 1;
            if (emptyBackspaceCountRef.current >= 2) {
              dismissVariablePicker();
            }
            return;
          }
        }

        if (!mod && e.key.length === 1) {
          searchSelectAllRef.current = false;
          emptyBackspaceCountRef.current = 0;
          e.preventDefault();
          setSearchQuery((s) => s + e.key);
          requestAnimationFrame(() => updateInsertMenuPosition());
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
        dismissVariablePicker();
        return;
      }

      return;
    }

    if (combinedSearchActive || combinedDrillActive) {
      const mod = e.ctrlKey || e.metaKey || e.altKey;
      const inBreakout = !!breakoutTextRef.current?.parentNode;

      if (inBreakout) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          const bo = breakoutTextRef.current;
          if (bo?.parentNode && bo.data.length === 0 && e.key === 'Backspace') {
            e.preventDefault();
            emptyBackspaceCountRef.current += 1;
            if (emptyBackspaceCountRef.current >= 2) {
              bo.remove();
              dismissVariablePicker();
              const el = editorRef.current;
              if (el) {
                const hasAnyChips = el.querySelectorAll('.variable-chip').length > 0;
                setIsEmpty(el.innerText.trim() === '' && !hasAnyChips);
              }
            }
            return;
          }
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
            emptyBackspaceCountRef.current = 0;
            requestAnimationFrame(() => updateInsertMenuPosition());
            return;
          }
          if (e.key === 'Backspace') {
            if (searchQuery.length > 0) {
              e.preventDefault();
              setSearchQuery((s) => s.slice(0, -1));
              emptyBackspaceCountRef.current = 0;
              requestAnimationFrame(() => updateInsertMenuPosition());
              return;
            }
            e.preventDefault();
            emptyBackspaceCountRef.current += 1;
            if (emptyBackspaceCountRef.current >= 2) {
              dismissVariablePicker();
            }
            return;
          }
        }

        if (!mod && e.key.length === 1) {
          searchSelectAllRef.current = false;
          emptyBackspaceCountRef.current = 0;
          e.preventDefault();
          setSearchQuery((s) => s + e.key);
          requestAnimationFrame(() => updateInsertMenuPosition());
          return;
        }
      }

      if (combinedSearchActive) {
        const len = combinedSearchResults.length;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSearchActiveIndex((prev) => (len > 0 ? (prev + 1) % len : 0));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSearchActiveIndex((prev) => (len > 0 ? (prev - 1 + len) % len : 0));
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCombinedSearchEnter(searchActiveIndex);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          dismissVariablePicker();
          return;
        }
        return;
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
        } else {
          e.preventDefault();
          setCombinedMenuView('root');
          setSlashActiveIndex(0);
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
        dismissVariablePicker();
        return;
      }

      return;
    }

    if (combinedRootActive) {
      const mod = e.ctrlKey || e.metaKey || e.altKey;

      if (!mod && e.key.length === 1) {
        e.preventDefault();
        emptyBackspaceCountRef.current = 0;
        setSearchQuery((s) => s + e.key);
        requestAnimationFrame(() => updateInsertMenuPosition());
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        emptyBackspaceCountRef.current += 1;
        if (emptyBackspaceCountRef.current >= 2) {
          dismissVariablePicker();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashActiveIndex((prev) => (prev + 1) % COMBINED_ROOT_ROW_COUNT);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashActiveIndex((prev) => (prev - 1 + COMBINED_ROOT_ROW_COUNT) % COMBINED_ROOT_ROW_COUNT);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (slashActiveIndex === 0) {
          e.preventDefault();
          drillIntoCombinedVariables();
        } else {
          e.preventDefault();
          const block = SLASH_BLOCK_ROWS[slashActiveIndex - 1];
          if (block) handleSlashSelect(block.id);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        dismissVariablePicker();
        return;
      }
      return;
    }

    if (showSlashMenu && insertVersion === 'v2_5') {
      const menuLen = SLASH_MENU_ROWS.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashActiveIndex((prev) => (prev + 1) % menuLen);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashActiveIndex((prev) => (prev - 1 + menuLen) % menuLen);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const row = SLASH_MENU_ROWS[slashActiveIndex];
        if (row) handleSlashSelect(row.id);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
        return;
      }
      return;
    }

    if (insertVersion === 'ideal' && !showDropdown && !linkModalOpen && e.key === '/') {
      e.preventDefault();
      openVariableDropdownAtCaret();
      return;
    }

    if (insertVersion === 'v2_5' && !showSlashMenu && !addModalOpen && !linkModalOpen && e.key === '/') {
      e.preventDefault();
      openSlashMenuAtCaret();
      return;
    }

    if (insertVersion === 'v3_5' && !showSlashMenu && !linkModalOpen && e.key === '/') {
      e.preventDefault();
      openCombinedMenuAtCaret();
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
    <div className="flex flex-1 min-h-0 w-full overflow-hidden">
      {insertVersion === 'v1_5' && (
        <ObjectGraphCollapsedRail
          panelOpen={sidePanelOpen}
          onToggle={() => setSidePanelOpen((open) => !open)}
        />
      )}

      {usesSidePanel(insertVersion) && sidePanelOpen && (
        <ObjectGraphSidePanel
          isOpen={sidePanelOpen}
          onClose={() => setSidePanelOpen(false)}
          onInsert={handleSharedInsert}
          variant={insertVersion === 'v1_5' ? 'object-graph' : 'available-data'}
          usedVariableIds={usedVariableIds}
          closeVariant={insertVersion === 'v1_5' ? 'collapse' : 'close'}
        />
      )}

      <div className="flex-1 min-h-0 overflow-y-auto bg-[#F8F9FA] p-12 flex justify-center relative scroll-smooth">
        <div className="w-[850px] min-h-[1100px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border border-gray-200 p-[96px] relative mb-12">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onCopy={handleCopy}
          onCut={handleCut}
          onClick={handleEditorClick}
          onMouseMove={handleEditorMouseMove}
          onMouseLeave={handleEditorMouseLeave}
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

        {insertVersion === 'ideal' && showDropdown && (
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

        {usesAddVariablesModal(insertVersion) && (
          <AddVariablesModal
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onInsert={handleSharedInsert}
          />
        )}

        {(insertVersion === 'v2_5' || insertVersion === 'v3_5') && (
          <InsertLinkModal
            isOpen={linkModalOpen}
            onClose={() => setLinkModalOpen(false)}
            onInsert={handleLinkInsert}
          />
        )}

        {insertVersion === 'v2_5' && showSlashMenu && (
          <SlashBlockMenu
            top={slashMenuPos.top}
            left={slashMenuPos.left}
            activeIndex={slashActiveIndex}
            onSelect={handleSlashSelect}
            onHover={setSlashActiveIndex}
          />
        )}

        {usesCombinedInsertMenu(insertVersion) && showSlashMenu && (
          <CombinedInsertMenu
            top={slashMenuPos.top}
            left={slashMenuPos.left}
            combinedMenuView={combinedMenuView}
            searchQuery={searchQuery}
            searchResults={combinedSearchResults}
            searchActiveIndex={searchActiveIndex}
            rootActiveIndex={slashActiveIndex}
            activeIndex={activeIndex}
            variableDropdownRef={variableDropdownRef}
            onSelect={handleVariableSelect}
            onFilteredItemsChange={setFilteredItems}
            onMenuNavigate={() => setActiveIndex(0)}
            onVariableRowHover={setActiveIndex}
            onDrillIntoVariables={drillIntoCombinedVariables}
            onBackToRoot={() => {
              setCombinedMenuView('root');
              setSlashActiveIndex(0);
            }}
            onBlockSelect={handleSlashSelect}
            onRootRowHover={setSlashActiveIndex}
            onSearchRowHover={setSearchActiveIndex}
            onSearchBlockSelect={handleSlashSelect}
            onSearchVariableSelect={handleVariableSelect}
          />
        )}

        {recipientPicker.isOpen && (insertVersion === 'ideal' || insertVersion === 'v3_5') && (
          <div
            className="fixed z-[1200] w-[340px] rounded-xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.16)] overflow-hidden"
            style={{ top: `${recipientPicker.top}px`, left: `${recipientPicker.left}px` }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="relative border-b border-gray-100">
              <input
                ref={recipientInputRef}
                type="text"
                role="combobox"
                aria-expanded={recipientMatches.length > 0}
                aria-controls="recipient-picker-listbox"
                aria-activedescendant={
                  recipientMatches.length > 0
                    ? `recipient-option-${recipientMatches[recipientHl]?.id ?? ''}`
                    : undefined
                }
                value={recipientSearchQuery}
                onChange={(e) => setRecipientSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    closeRecipientPicker();
                    return;
                  }
                  const len = recipientMatches.length;
                  if (len === 0) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setRecipientHighlightIndex((i) => (i + 1) % len);
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setRecipientHighlightIndex((i) => (i - 1 + len) % len);
                    return;
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const pick = recipientMatches[recipientHl];
                    if (pick) resolveChipRecipient(pick);
                  }
                }}
                className="w-full py-3 pl-10 pr-3 text-[15px] text-gray-700 outline-none"
                placeholder="Search people"
                autoComplete="off"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            </div>
            <div
              id="recipient-picker-listbox"
              ref={recipientScrollRef}
              role="listbox"
              aria-label="People"
              className="max-h-72 overflow-y-auto py-2"
            >
              {recipientMatches.map((employee, index) => (
                <button
                  key={employee.id}
                  id={`recipient-option-${employee.id}`}
                  role="option"
                  type="button"
                  data-recipient-highlight-index={index}
                  aria-selected={index === recipientHl}
                  className={`w-full px-4 py-2 text-left text-[14px] text-gray-700 flex items-center gap-3 ${
                    index === recipientHl ? 'bg-[#7A005D]/8' : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setRecipientHighlightIndex(index)}
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
      </div>

      <div className="fixed right-0 top-1/2 -translate-y-1/2 flex items-center bg-white border border-gray-200 shadow-sm px-1 py-4 rounded-l-md cursor-pointer hover:bg-gray-50 z-20 group transition-all">
        <div className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-bold text-gray-400 group-hover:text-gray-600 uppercase tracking-widest flex items-center gap-2">
          Share feedback
          <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
        </div>
      </div>

      {chipRouteTooltip && (
        <VariableChipRouteTooltip
          description={chipRouteTooltip.description}
          anchorRect={chipRouteTooltip.rect}
        />
      )}
    </div>
  );
};

export default EditorCanvas;
