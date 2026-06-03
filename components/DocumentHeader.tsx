
import React from 'react';
import { Users, Variable, Eye } from 'lucide-react';
import type { InsertVersion } from './insertVersions';
import { showsRecipientFieldsHeaderButton } from './insertVersions';

export type SaveStatus = 'saving' | 'saved';

interface Props {
  title: string;
  setTitle: (t: string) => void;
  onInsertVariable: () => void;
  insertVersion: InsertVersion;
  saveStatus: SaveStatus;
  onTitleChange?: () => void;
}

const DocumentHeader: React.FC<Props> = ({
  title,
  setTitle,
  onInsertVariable,
  insertVersion,
  saveStatus,
  onTitleChange,
}) => {
  const showRecipientFields = showsRecipientFieldsHeaderButton(insertVersion);

  return (
    <div className="h-14 px-6 flex items-center bg-white border-b border-gray-200 min-w-0">
      <div className="flex-1 min-w-0 mr-10">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            onTitleChange?.();
          }}
          className="block w-full max-w-full min-w-0 text-lg font-semibold text-gray-800 bg-transparent border-none focus:ring-0 hover:bg-gray-50 rounded px-1 transition-colors outline-none truncate"
          placeholder="Untitled document"
          title={title}
        />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-gray-400 min-w-[44px]">
          {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
        </span>
        {showRecipientFields && (
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Users size={14} className="text-gray-400" />
            Recipient fields
          </button>
        )}
        <button
          type="button"
          onClick={onInsertVariable}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Variable size={14} className="text-gray-400" />
          Insert variable
        </button>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Eye size={14} className="text-gray-400" />
          Preview
        </button>
        <button
          type="button"
          className="px-5 py-1.5 text-xs font-bold text-white bg-[#7A005D] rounded-md hover:bg-[#66004D] shadow-sm transition-all"
        >
          Publish
        </button>
      </div>
    </div>
  );
};

export default DocumentHeader;
