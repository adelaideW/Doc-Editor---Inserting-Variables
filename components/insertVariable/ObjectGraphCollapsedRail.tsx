import React from 'react';

interface Props {
  onToggle: () => void;
  panelOpen?: boolean;
}

/** Narrow rail always visible in V1.5; toggles panel expand/collapse. */
const ObjectGraphCollapsedRail: React.FC<Props> = ({ onToggle, panelOpen = false }) => {
  return (
    <div
      className="w-11 shrink-0 h-full min-h-0 max-h-full bg-white border-r border-[#e0dede] flex flex-col items-center pt-3"
      aria-label="Object graph panel rail"
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-8 h-8 flex items-center justify-center rounded-md border border-[#e0dede] bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        aria-label={panelOpen ? 'Collapse object graph panel' : 'Expand object graph panel'}
        title={panelOpen ? 'Collapse object graph panel' : 'Expand object graph panel'}
      >
        <span className="text-[11px] font-semibold tracking-tight leading-none select-none">[×]</span>
      </button>
    </div>
  );
};

export default ObjectGraphCollapsedRail;
