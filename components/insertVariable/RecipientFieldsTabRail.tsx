import React from 'react';
import { Grid, User } from 'lucide-react';
import type { RecipientPanelView } from './recipientFieldsData';

interface Props {
  panelOpen: boolean;
  view: RecipientPanelView;
  onOpenView: (view: RecipientPanelView) => void;
}

const TAB_ITEMS: { id: RecipientPanelView; label: string; icon: React.ReactNode }[] = [
  { id: 'fields', label: 'Recipient fields', icon: <Grid size={18} /> },
  { id: 'recipients', label: 'Recipients', icon: <User size={18} /> },
];

/** Right-side tab rail for V1 / V2 / V2.5 — matches V1.5 left rail sizing. */
const RecipientFieldsTabRail: React.FC<Props> = ({ panelOpen, view, onOpenView }) => (
  <nav
    className="w-[52px] shrink-0 h-full min-h-0 bg-[#fafafa] border-l border-gray-200 flex flex-col items-center py-4 gap-2 z-20"
    aria-label="Recipient panel tabs"
  >
    {TAB_ITEMS.map(({ id, label, icon }) => {
      const isActive = panelOpen && view === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onOpenView(id)}
          title={label}
          className={`p-2 rounded-lg transition-colors border ${
            isActive
              ? 'border-[#7A005D]/20 bg-[#7A005D]/5 text-[#7A005D]'
              : 'border-transparent text-gray-500 hover:bg-white hover:border-gray-200 bg-white'
          }`}
          aria-pressed={isActive}
        >
          {icon}
        </button>
      );
    })}
  </nav>
);

export default RecipientFieldsTabRail;
