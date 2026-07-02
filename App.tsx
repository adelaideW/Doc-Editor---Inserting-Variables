
import React, { useCallback, useRef, useState } from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import DocumentHeader, { type SaveStatus } from './components/DocumentHeader';
import EditorCanvas from './components/EditorCanvas';
import { PortfolioReturnLink } from './components/PortfolioReturnLink';
import VersionSelector from './components/VersionSelector';
import { DEFAULT_INSERT_VERSION, type InsertVersion } from './components/insertVersions';

const SAVE_DEBOUNCE_MS = 1200;

const App: React.FC = () => {
  const [docTitle, setDocTitle] = useState("Untitled template 09/16/2025 12:27 PM");
  const [insertVariableTrigger, setInsertVariableTrigger] = useState(0);
  const [recipientFieldsTrigger, setRecipientFieldsTrigger] = useState(0);
  const [insertVersion, setInsertVersion] = useState<InsertVersion>(DEFAULT_INSERT_VERSION);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const saveTimerRef = useRef<number | null>(null);

  const handleInsertVariable = () => {
    setInsertVariableTrigger((prev) => prev + 1);
  };

  const handleRecipientFields = () => {
    setRecipientFieldsTrigger((prev) => prev + 1);
  };

  const notifyDocumentChange = useCallback(() => {
    setSaveStatus('saving');
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      setSaveStatus('saved');
      saveTimerRef.current = null;
    }, SAVE_DEBOUNCE_MS);
  }, []);

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
            onRecipientFields={handleRecipientFields}
            insertVersion={insertVersion}
            saveStatus={saveStatus}
            onTitleChange={notifyDocumentChange}
          />
          <Toolbar onImport={() => setImportModalOpen(true)} />

          <EditorCanvas
            insertTrigger={insertVariableTrigger}
            recipientFieldsTrigger={recipientFieldsTrigger}
            insertVersion={insertVersion}
            importModalOpen={importModalOpen}
            onImportModalOpenChange={setImportModalOpen}
            onDocumentChange={notifyDocumentChange}
          />

          <VersionSelector value={insertVersion} onChange={setInsertVersion} />
        </div>
      </div>
    </div>
  );
};

export default App;
