import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="fixed bottom-6 right-6 z-[1300]"
      aria-label="Prototype version"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 bg-white border rounded-full shadow-md transition-all text-gray-700 hover:text-gray-900 hover:shadow-lg ${
          open ? 'border-[#7A005D]/40 ring-2 ring-[#7A005D]/10' : 'border-gray-200'
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Switch variable insertion version"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Ver</span>
        <span className="text-[12px] font-semibold text-[#7A005D]">{active.label}</span>
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Variable insertion version"
          className="absolute bottom-full right-0 mb-2 w-[220px] bg-white border border-gray-200 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.14)] overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Insertion version
            </p>
          </div>
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
                className={`w-full text-left px-3 py-2.5 border-0 flex items-start gap-2 transition-colors ${
                  selected ? 'bg-[#7A005D]/5' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <span className="flex-1 min-w-0">
                  <span
                    className={`block text-[12px] font-semibold ${
                      selected ? 'text-[#7A005D]' : 'text-gray-900'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="block text-[10px] text-gray-500 mt-0.5 leading-snug break-words">
                    {option.subtitle}
                  </span>
                </span>
                {selected && <Check size={14} className="text-[#7A005D] shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VersionSelector;
