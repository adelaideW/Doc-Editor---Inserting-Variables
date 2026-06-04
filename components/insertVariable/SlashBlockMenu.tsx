import React from 'react';
import {
  Code,
  FileUp,
  Link,
  List,
  ListOrdered,
  Minus,
  Quote,
  Sparkles,
  Type,
  Variable,
} from 'lucide-react';

export type SlashMenuItemId =
  | 'write-with-ai'
  | 'insert-variables'
  | 'import'
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
}

export const SLASH_MENU_ROWS: MenuRow[] = [
  {
    id: 'insert-variables',
    label: 'Insert variables',
    subtitle: 'Variables insert data from the object graph and are not editable when sending.',
    icon: <Variable size={16} className="text-gray-600 shrink-0" />,
  },
  {
    id: 'import',
    label: 'Import',
    subtitle: 'Upload a file or paste a link to replace document content.',
    icon: <FileUp size={16} className="text-gray-500 shrink-0" />,
  },
  { id: 'bulleted-list', label: 'Bulleted list', icon: <List size={16} className="text-gray-500 shrink-0" /> },
  { id: 'numbered-list', label: 'Numbered list', icon: <ListOrdered size={16} className="text-gray-500 shrink-0" /> },
  { id: 'link', label: 'Link', icon: <Link size={16} className="text-gray-500 shrink-0" /> },
  { id: 'divider', label: 'Divider', icon: <Minus size={16} className="text-gray-500 shrink-0" /> },
  { id: 'quote', label: 'Quote', icon: <Quote size={16} className="text-gray-500 shrink-0" /> },
  { id: 'normal-text', label: 'Normal text', icon: <Type size={16} className="text-gray-500 shrink-0" /> },
  { id: 'code-snippet', label: 'Code snippet', icon: <Code size={16} className="text-gray-500 shrink-0" /> },
];

export const SLASH_BLOCK_ROWS = SLASH_MENU_ROWS.filter(
  (row) => row.id !== 'insert-variables' && row.id !== 'import'
);

export const WRITE_WITH_AI_ROW: MenuRow = {
  id: 'write-with-ai',
  label: 'Write with AI',
  subtitle: 'Generate draft content with Lumina AI.',
  icon: <Sparkles size={16} className="text-[#7A005D] shrink-0" />,
};

export const INSERT_VARIABLES_ROW = SLASH_MENU_ROWS[0];
export const IMPORT_ROW = SLASH_MENU_ROWS[1];

/** V2.5 slash menu: insert variables only (opens Add Variables modal). */
export const V2_5_SLASH_MENU_ROWS: MenuRow[] = [INSERT_VARIABLES_ROW];

interface Props {
  top: number;
  left: number;
  activeIndex: number;
  rows?: MenuRow[];
  onSelect: (id: SlashMenuItemId) => void;
  onHover: (index: number) => void;
}

const SlashBlockMenu: React.FC<Props> = ({
  top,
  left,
  activeIndex,
  rows = SLASH_MENU_ROWS,
  onSelect,
  onHover,
}) => {
  return (
    <div
      className="fixed z-[1050] w-[280px] bg-white border border-gray-200 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden py-1"
      style={{ top, left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {rows.map((row, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={row.id}
            type="button"
            onMouseEnter={() => onHover(index)}
            onClick={() => onSelect(row.id)}
            className={`w-full text-left px-3 py-2.5 flex gap-3 border-0 transition-colors ${
              active ? 'bg-gray-100 cursor-pointer' : 'bg-white hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <span className="mt-0.5">{row.icon}</span>
            <span className="min-w-0">
              <span className={`block text-[14px] ${active ? 'font-medium text-gray-900' : 'text-gray-800'}`}>
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
