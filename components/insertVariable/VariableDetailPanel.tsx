import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  GitBranch,
  Pencil,
  ShieldCheck,
  Star,
  Type,
  X,
} from 'lucide-react';
import { getVariableDescription } from './variableDescriptions';

interface Props {
  variableLabel: string;
  /** Same text as chip hover tooltip; defaults to getVariableDescription(variableLabel). */
  description?: string;
  categoryLabel?: string;
  objectLabel?: string;
  onClose?: () => void;
}

const VariableDetailPanel: React.FC<Props> = ({
  variableLabel,
  description: descriptionProp,
  categoryLabel = 'Employee',
  objectLabel = 'Employee',
  onClose,
}) => {
  const [lineageOpen, setLineageOpen] = React.useState(false);

  const description = descriptionProp ?? getVariableDescription(variableLabel);

  return (
    <div
      className="w-[300px] bg-white border border-gray-200 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col max-h-[min(520px,70vh)] overflow-hidden"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Star size={16} className="text-[#7A005D] shrink-0" strokeWidth={1.75} />
            <h3 className="text-[15px] font-semibold text-gray-900 truncate">{variableLabel}</h3>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-0.5 text-gray-400 hover:text-gray-700 border-0 bg-transparent shrink-0"
              aria-label="Close details"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 text-[11px] text-gray-600">
            <ShieldCheck size={12} className="text-gray-400" />
            Not verified
            <ChevronDown size={11} className="text-gray-400" />
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 text-[11px] text-gray-600">
            <Type size={12} className="text-gray-400" />
            Text
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-[12px]">
        <section>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Overview</h4>
            <ChevronUp size={14} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                Description
                <Pencil size={10} className="text-gray-300" />
              </div>
              <p className="text-gray-700 leading-relaxed line-clamp-3">{description}</p>
            </div>
            <div className="grid grid-cols-[88px_1fr] gap-y-2 gap-x-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Category</span>
              <span className="text-gray-800">{categoryLabel}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Object</span>
              <span className="text-gray-800">{objectLabel}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">API name</span>
              <span className="text-gray-800 font-mono text-[11px]">id</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">SQL name</span>
              <span className="text-gray-800 font-mono text-[11px]">id</span>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Data collected</h4>
            <ChevronUp size={14} className="text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">Data collected for 526 of 526 records</p>
          <div className="h-1.5 rounded-full bg-[#7A005D]/15 overflow-hidden mb-3">
            <div className="h-full w-full bg-[#7A005D] rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              ['Data availability', '100%'],
              ['Unique records', '526'],
              ['Min value', 'null'],
              ['Max value', 'null'],
              ['Mean value', 'null'],
            ].map(([k, v]) => (
              <React.Fragment key={k}>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{k}</span>
                <span className="text-gray-800">{v}</span>
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => setLineageOpen((o) => !o)}
            className="w-full flex items-center justify-between border-0 bg-transparent p-0 text-left"
          >
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Lineage</h4>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <GitBranch size={12} />
                View more
              </span>
              {lineageOpen ? (
                <ChevronUp size={14} className="text-gray-400" />
              ) : (
                <ChevronDown size={14} className="text-gray-400" />
              )}
            </div>
          </button>
          {lineageOpen && (
            <p className="mt-2 text-gray-500 leading-relaxed">
              Sourced from Rippling Employee object · last synced 2 hours ago.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default VariableDetailPanel;
