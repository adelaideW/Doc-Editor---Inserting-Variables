
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
    <div className="flex h-screen w-full bg-white overflow-hidden text-gray-900 selection:bg-[#7A005D]/40 selection:text-[#7A005D]">
      <PortfolioReturnLink />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        <Header />

        <div className="flex flex-col flex-1 min-h-0 min-w-0 relative overflow-hidden">
          <DocumentHeader
            title={docTitle}
            setTitle={setDocTitle}
            onInsertVariable={handleInsertVariable}
            insertVersion={insertVersion}
          />
          <Toolbar />

          <EditorCanvas insertTrigger={insertVariableTrigger} insertVersion={insertVersion} />

          <VersionSelector value={insertVersion} onChange={setInsertVersion} />
        </div>
      </div>
    </div>
  );
};

export default App;
