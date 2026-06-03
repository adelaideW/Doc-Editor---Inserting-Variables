import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface Props {
  top: number;
  left: number;
  prompt: string;
  loading: boolean;
  onPromptChange: (value: string) => void;
  onCancel: () => void;
  onGenerate: () => void;
}

const LuminaAiPopover: React.FC<Props> = ({
  top,
  left,
  prompt,
  loading,
  onPromptChange,
  onCancel,
  onGenerate,
}) => {
  const canGenerate = prompt.trim().length > 0 && !loading;

  return (
    <div
      className="fixed z-[1060] w-[320px] bg-white border border-[#7A005D]/20 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.14)] overflow-hidden"
      style={{ top, left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Sparkles size={16} className="text-[#7A005D] shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A005D]">
          Lumina AI assistant
        </span>
      </div>

      <div className="px-4 pb-3">
        <textarea
          autoFocus
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe what you want to write..."
          rows={4}
          className="w-full text-[14px] text-gray-800 border border-gray-200 rounded-lg p-2.5 resize-y min-h-[88px] outline-none focus:ring-2 focus:ring-[#7A005D]/15 focus:border-[#7A005D]/30"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
        />
      </div>

      <div className="flex items-center justify-end gap-2 px-4 pb-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] text-gray-500 hover:text-gray-800 border-0 bg-transparent px-2 py-1.5"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canGenerate}
          onClick={onGenerate}
          className={`inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-[13px] font-bold border-0 transition-all ${
            canGenerate
              ? 'bg-[#7A005D] text-white hover:bg-[#66004D] shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Generate
        </button>
      </div>
    </div>
  );
};

export default LuminaAiPopover;
