
import React from 'react';
import { Users, Variable, Eye, FileUp } from 'lucide-react';

interface Props {
  title: string;
  setTitle: (t: string) => void;
  onInsertVariable: () => void;
}

const DocumentHeader: React.FC<Props> = ({ title, setTitle, onInsertVariable }) => {
  return (
    <div className="h-14 px-6 flex items-center justify-between bg-white border-b border-gray-200">
      <div className="flex-1">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold text-gray-800 bg-transparent border-none focus:ring-0 w-full hover:bg-gray-50 rounded px-1 transition-colors outline-none"
          placeholder="Untitled document"
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          <Users size={14} className="text-gray-400" />
          Recipient fields
        </button>
        <button 
          onClick={onInsertVariable}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Variable size={14} className="text-gray-400" />
          Insert variable
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          <Eye size={14} className="text-gray-400" />
          Preview
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          <FileUp size={14} className="text-gray-400" />
          Import
        </button>
        <button className="px-5 py-1.5 text-xs font-bold text-white bg-[#7A005D] rounded-md hover:bg-[#66004D] shadow-sm transition-all">
          Publish
        </button>
      </div>
    </div>
  );
};

export default DocumentHeader;
