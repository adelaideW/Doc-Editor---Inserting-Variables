import React from 'react';
import { Grid, User, Variable } from 'lucide-react';

export type LeftPanelTab = 'variables' | 'fields' | 'recipients';

interface Props {
  panelOpen: boolean;
  activeTab: LeftPanelTab;
  onSelectTab: (tab: LeftPanelTab) => void;
}

const NAV_ITEMS: { id: LeftPanelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'variables', label: 'Variables', icon: <Variable size={18} /> },
  { id: 'fields', label: 'Recipient fields', icon: <Grid size={18} /> },
  { id: 'recipients', label: 'Recipients', icon: <User size={18} /> },
];

/** V1.5 — always-visible left rail; Variables first, recipient tabs below. */
const LeftPanelNavRail: React.FC<Props> = ({ panelOpen, activeTab, onSelectTab }) => (
  <nav
    className="w-[52px] shrink-0 h-full min-h-0 bg-[#fafafa] border-r border-gray-200 flex flex-col items-center py-4 gap-2"
    aria-label="Editor panels"
  >
    {NAV_ITEMS.map(({ id, label, icon }) => {
      const isActive = panelOpen && activeTab === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onSelectTab(id)}
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

export default LeftPanelNavRail;
