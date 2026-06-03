import React from 'react';
import {
  Code,
  Link,
  List,
  ListOrdered,
  Minus,
  Quote,
  Type,
  Variable,
} from 'lucide-react';

export type SlashMenuItemId =
  | 'insert-variables'
  | 'bulleted-list'
  | 'numbered-list'
  | 'link'
  | 'divider'
  | 'quote'
  | 'normal-text'
  | 'code-snippet';

interface MenuRow {
  id: SlashMenuItemId;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const MENU_ROWS: MenuRow[] = [
  {
    id: 'insert-variables',
    label: 'Insert variables',
    subtitle: 'Variables insert data from the object graph and are not editable when sending.',
    icon: <Variable size={16} className="text-gray-600 shrink-0" />,
  },
  { id: 'bulleted-list', label: 'Bulleted list', icon: <List size={16} className="text-gray-500 shrink-0" />, disabled: true },
  { id: 'numbered-list', label: 'Numbered list', icon: <ListOrdered size={16} className="text-gray-500 shrink-0" />, disabled: true },
  { id: 'link', label: 'Link', icon: <Link size={16} className="text-gray-500 shrink-0" />, disabled: true },
  { id: 'divider', label: 'Divider', icon: <Minus size={16} className="text-gray-500 shrink-0" />, disabled: true },
  { id: 'quote', label: 'Quote', icon: <Quote size={16} className="text-gray-500 shrink-0" />, disabled: true },
  { id: 'normal-text', label: 'Normal text', icon: <Type size={16} className="text-gray-500 shrink-0" />, disabled: true },
  { id: 'code-snippet', label: 'Code snippet', icon: <Code size={16} className="text-gray-500 shrink-0" />, disabled: true },
];

interface Props {
  top: number;
  left: number;
  activeIndex: number;
  onSelect: (id: SlashMenuItemId) => void;
  onHover: (index: number) => void;
}

const SlashBlockMenu: React.FC<Props> = ({ top, left, activeIndex, onSelect, onHover }) => {
  return (
    <div
      className="fixed z-[1050] w-[280px] bg-white border border-gray-200 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden py-1"
      style={{ top, left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {MENU_ROWS.map((row, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={row.id}
            type="button"
            disabled={row.disabled}
            onMouseEnter={() => onHover(index)}
            onClick={() => !row.disabled && onSelect(row.id)}
            className={`w-full text-left px-3 py-2.5 flex gap-3 border-0 transition-colors ${
              row.disabled
                ? 'opacity-50 cursor-default bg-white'
                : active
                  ? 'bg-gray-100 cursor-pointer'
                  : 'bg-white hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <span className="mt-0.5">{row.icon}</span>
            <span className="min-w-0">
              <span className={`block text-[14px] ${active && !row.disabled ? 'font-medium text-gray-900' : 'text-gray-800'}`}>
                {active && row.id === 'insert-variables' ? '[x] ' : ''}
                {row.label}
              </span>
              {row.subtitle && (
                <span className="block text-[11px] text-gray-500 mt-0.5 leading-snug">{row.subtitle}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SlashBlockMenu;
