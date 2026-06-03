import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import { INSERT_VERSIONS, type InsertVersion } from './insertVersions';

interface Props {
  value: InsertVersion;
  onChange: (version: InsertVersion) => void;
}

const VersionSelector: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = INSERT_VERSIONS.find((v) => v.id === value) ?? INSERT_VERSIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-3 pr-2.5 py-2 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition-all text-gray-700 hover:text-gray-900"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Layers size={16} className="text-[#7A005D] shrink-0" />
        <span className="text-[12px] font-semibold">{active.label}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Variable insertion version"
          className="absolute bottom-full right-0 mb-2 w-[240px] bg-white border border-gray-200 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {INSERT_VERSIONS.map((option) => {
            const selected = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 border-0 transition-colors ${
                  selected ? 'bg-[#7A005D]/5' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className={`text-[13px] font-semibold ${selected ? 'text-[#7A005D]' : 'text-gray-900'}`}>
                  {option.label}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">{option.subtitle}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VersionSelector;
