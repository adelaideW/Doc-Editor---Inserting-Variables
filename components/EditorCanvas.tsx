
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { gemini } from '../services/gemini';
import VariableDropdown, { VariableItem } from './VariableDropdown';

interface Props {
  insertTrigger?: number;
}

const EditorCanvas: React.FC<Props> = ({ insertTrigger }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [filteredItems, setFilteredItems] = useState<VariableItem[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Trigger from DocumentHeader button
  useEffect(() => {
    if (insertTrigger && insertTrigger > 0 && editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.collapse(false);
        
        const trigger = document.createTextNode('{');
        range.insertNode(trigger);
        range.setStartAfter(trigger);
        range.setEndAfter(trigger);
        
        updateDropdownPosition();
        setShowDropdown(true);
        setSearchQuery("");
        setActiveIndex(0);
      }
    }
  }, [insertTrigger]);

  const updateDropdownPosition = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0).cloneRange();
      const node = range.startContainer;
      const offset = range.startOffset;
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        const triggerIdx = text.lastIndexOf('{', offset);
        if (triggerIdx !== -1) {
          range.setStart(node, triggerIdx);
          range.setEnd(node, triggerIdx + 1);
        }
      }

      const rects = range.getClientRects();
      const rect = rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect();
      
      if (rect) {
        setDropdownPos({ 
          top: rect.bottom + window.scrollY + 4, 
          left: rect.left + window.scrollX 
        });
      }
    }
  };

  const createChip = (label: string) => {
    const chip = document.createElement('span');
    chip.className = "variable-chip inline-flex items-center px-2 py-0.5 mx-0.5 rounded bg-[#7A005D]/5 border border-[#7A005D]/20 text-[14px] text-[#7A005D] font-medium select-none align-baseline leading-tight transition-all duration-200 cursor-default group";
    chip.contentEditable = "false";
    chip.setAttribute('data-variable', label);
    
    chip.innerHTML = `
      <span class="pointer-events-none">${label}</span>
      <div class="mx-1.5 w-[1px] h-3 bg-[#7A005D]/20 pointer-events-none"></div>
      <button class="chip-delete-btn p-0.5 rounded hover:bg-[#7A005D]/10 transition-colors flex items-center justify-center cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="opacity-60 pointer-events-none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    `;
    return chip;
  };

  const handleVariableSelect = useCallback((label: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      const triggerIdx = text.lastIndexOf('{', range.startOffset);
      
      if (triggerIdx !== -1) {
        range.setStart(node, triggerIdx);
        range.setEnd(node, range.startOffset);
        range.deleteContents();
      }
    }

    const chip = createChip(label);
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
  }, []);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const hasChips = el.querySelectorAll('.variable-chip').length > 0;
    setIsEmpty(el.innerText.trim() === "" && !hasChips);

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      const offset = range.startOffset;
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        const textBeforeCaret = text.substring(0, offset);
        
        const lastOpen = textBeforeCaret.lastIndexOf('{');
        if (lastOpen !== -1 && textBeforeCaret.endsWith('}')) {
          const label = textBeforeCaret.substring(lastOpen + 1, textBeforeCaret.length - 1);
          if (label.trim()) {
            range.setStart(node, lastOpen);
            range.setEnd(node, offset);
            range.deleteContents();
            
            const chip = createChip(label);
            range.insertNode(chip);
            range.setStartAfter(chip);
            range.setEndAfter(chip);
            
            sel.removeAllRanges();
            sel.addRange(range);
            setShowDropdown(false);
            return;
          }
        }

        const triggerIdx = textBeforeCaret.lastIndexOf('{');
        if (triggerIdx !== -1) {
          const query = textBeforeCaret.substring(triggerIdx + 1);
          setSearchQuery(query);
          setShowDropdown(true);
          setActiveIndex(0);
          requestAnimationFrame(updateDropdownPosition);
        } else {
          setShowDropdown(false);
        }
      } else {
        setShowDropdown(false);
      }
    }
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
    
    if (showDropdown) setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0));
        return;
      }
      if (e.key === 'Enter') {
        if (filteredItems.length > 0 && activeIndex >= 0 && activeIndex < filteredItems.length) {
          e.preventDefault();
          const selectedItem = filteredItems[activeIndex];
          
          // If it's a category, we don't insert, we just let the dropdown handle navigation logic
          // (which happens through the state update in VariableDropdown)
          // But to facilitate Enter to navigate, we can trigger the same logic as a click.
          // In a real app we'd expose a handleSelect method that handles categories.
          // For now, if it's NOT a category, insert. If it IS, clicking is required or we modify the dropdown.
          if (!selectedItem.isCategory) {
            handleVariableSelect(selectedItem.label);
          } else {
            // Logic for Enter on category is handled by simulate click or internal dropdown state
            // Let's rely on the user clicking for category for now, or we can improve VariableDropdown's onSelect.
          }
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowDropdown(false);
        return;
      }
    }
    
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          let nodeToRevert = null;
          
          if (range.startOffset === 0) {
            nodeToRevert = range.startContainer.previousSibling;
          } else if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
            nodeToRevert = range.startContainer.childNodes[range.startOffset - 1];
          } else if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
             const prev = range.startContainer.previousSibling;
             if (prev instanceof HTMLElement && prev.classList.contains('variable-chip')) {
               if (range.startContainer.textContent?.charCodeAt(range.startOffset - 1) === 160 || range.startContainer.textContent?.charAt(range.startOffset -1) === ' ') {
                 nodeToRevert = prev;
               }
             }
          }

          if (nodeToRevert instanceof HTMLElement && nodeToRevert.classList.contains('variable-chip')) {
            e.preventDefault();
            const label = nodeToRevert.getAttribute('data-variable') || "";
            const textToInsert = `{${label}`;
            
            nodeToRevert.remove();
            
            const textNode = document.createTextNode(textToInsert);
            range.insertNode(textNode);
            
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            sel.removeAllRanges();
            sel.addRange(range);
            
            setSearchQuery(label);
            setShowDropdown(true);
            setActiveIndex(0);
            requestAnimationFrame(updateDropdownPosition);

            const event = new Event('input', { bubbles: true });
            editorRef.current?.dispatchEvent(event);
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
            onSelect={handleVariableSelect} 
            searchQuery={searchQuery}
            activeIndex={activeIndex}
            onFilteredItemsChange={setFilteredItems}
            style={{ 
              position: 'fixed',
              top: `${dropdownPos.top}px`, 
              left: `${dropdownPos.left}px` 
            }} 
          />
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
