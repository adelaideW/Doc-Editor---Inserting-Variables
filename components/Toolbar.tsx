
import React from 'react';
import { 
  Undo2, Redo2, Printer, ChevronDown, Plus, Minus,
  Bold, Italic, Underline, Strikethrough, Code, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent, Link, Image, MessageSquare,
  Sparkles, Type, Palette, Scissors
} from 'lucide-react';

const Toolbar: React.FC = () => {
  const Group: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-0.5 px-2 border-r border-gray-200 last:border-r-0">
      {children}
    </div>
  );

  const ToolBtn: React.FC<{ icon: React.ReactNode; active?: boolean; dropdown?: boolean }> = ({ icon, active, dropdown }) => (
    <button className={`p-1.5 rounded flex items-center justify-center hover:bg-gray-100 transition-colors ${active ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}>
      {icon}
      {dropdown && <ChevronDown size={12} className="ml-0.5 opacity-60" />}
    </button>
  );

  return (
    <div className="h-10 bg-white border-b border-gray-200 flex items-center px-1 overflow-x-auto no-scrollbar">
      <Group>
        <ToolBtn icon={<Undo2 size={16} />} />
        <ToolBtn icon={<Redo2 size={16} />} />
        <ToolBtn icon={<Printer size={16} />} />
      </Group>

      <Group>
        <button className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded">
          Normal text <ChevronDown size={12} />
        </button>
      </Group>

      <Group>
        <button className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded">
          Rippling's Default <ChevronDown size={12} />
        </button>
      </Group>

      <Group>
        <ToolBtn icon={<Minus size={14} />} />
        <div className="px-3 py-0.5 border border-gray-200 rounded text-xs font-medium mx-1">11</div>
        <ToolBtn icon={<Plus size={14} />} />
      </Group>

      <Group>
        <ToolBtn icon={<Bold size={16} />} />
        <ToolBtn icon={<Italic size={16} />} />
        <ToolBtn icon={<Underline size={16} />} />
        <ToolBtn icon={<Strikethrough size={16} />} />
        <ToolBtn icon={<Code size={16} />} />
        <ToolBtn icon={<Highlighter size={16} />} />
        <ToolBtn icon={<Palette size={16} />} />
      </Group>

      <Group>
        <ToolBtn icon={<Link size={16} />} />
        <ToolBtn icon={<Image size={16} />} />
        <ToolBtn icon={<MessageSquare size={16} />} />
        <ToolBtn icon={<Sparkles size={16} />} />
      </Group>

      <Group>
        <ToolBtn icon={<AlignLeft size={16} />} active />
        <ToolBtn icon={<AlignCenter size={16} />} />
        <ToolBtn icon={<AlignRight size={16} />} />
        <ToolBtn icon={<AlignJustify size={16} />} />
      </Group>

      <Group>
        <ToolBtn icon={<List size={16} />} />
        <ToolBtn icon={<ListOrdered size={16} />} />
        <ToolBtn icon={<Outdent size={16} />} />
        <ToolBtn icon={<Indent size={16} />} />
      </Group>

      <Group>
        <ToolBtn icon={<Type size={16} />} dropdown />
        <ToolBtn icon={<Scissors size={16} />} />
      </Group>
    </div>
  );
};

export default Toolbar;
