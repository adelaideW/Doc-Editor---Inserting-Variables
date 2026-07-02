import React from 'react';
import { Grid, User } from 'lucide-react';
import type { RecipientPanelView } from './recipientFieldsData';

interface Props {
  panelOpen: boolean;
  view: RecipientPanelView;
  onOpenView: (view: RecipientPanelView) => void;
}

const RecipientFieldsTabRail: React.FC<Props> = ({ panelOpen, view, onOpenView }) => (
  <div className="w-14 bg-white border-l border-gray-200 flex flex-col items-center py-4 space-y-6 shrink-0 z-20">
    <button
      type="button"
      onClick={() => onOpenView('fields')}
      className={`p-2 rounded-lg shadow-sm transition-colors ${
        panelOpen && view === 'fields'
          ? 'border border-[#7A005D]/20 bg-[#7A005D]/5 text-[#7A005D]'
          : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
      }`}
      title="Recipient fields"
      aria-pressed={panelOpen && view === 'fields'}
    >
      <Grid size={20} />
    </button>
    <button
      type="button"
      onClick={() => onOpenView('recipients')}
      className={`p-2 rounded-lg shadow-sm transition-colors ${
        panelOpen && view === 'recipients'
          ? 'border border-[#7A005D]/20 bg-[#7A005D]/5 text-[#7A005D]'
          : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
      }`}
      title="Recipients"
      aria-pressed={panelOpen && view === 'recipients'}
    >
      <User size={20} />
    </button>
  </div>
);

export default RecipientFieldsTabRail;
