
import React, { useState } from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import DocumentHeader from './components/DocumentHeader';
import EditorCanvas from './components/EditorCanvas';
import { PortfolioReturnLink } from './components/PortfolioReturnLink';
import VersionSelector from './components/VersionSelector';
import { DEFAULT_INSERT_VERSION, type InsertVersion } from './components/insertVersions';

const App: React.FC = () => {
  const [docTitle, setDocTitle] = useState("Untitled template 09/16/2025 12:27 PM");
  const [insertVariableTrigger, setInsertVariableTrigger] = useState(0);
  const [insertVersion, setInsertVersion] = useState<InsertVersion>(DEFAULT_INSERT_VERSION);

  const handleInsertVariable = () => {
    setInsertVariableTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden text-gray-900 selection:bg-[#7A005D]/20 selection:text-[#7A005D]">
      <PortfolioReturnLink />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header />

        <div className="flex flex-col flex-1 relative">
          <DocumentHeader
            title={docTitle}
            setTitle={setDocTitle}
            onInsertVariable={handleInsertVariable}
            insertVersion={insertVersion}
          />
          <Toolbar />

          <EditorCanvas insertTrigger={insertVariableTrigger} insertVersion={insertVersion} />

          <div className="absolute bottom-6 left-6 flex items-center gap-2 z-20">
            <div className="p-1.5 bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <div className="p-1.5 bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 z-20">
            <VersionSelector value={insertVersion} onChange={setInsertVersion} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
