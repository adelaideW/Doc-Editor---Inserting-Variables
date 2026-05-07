
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import DocumentHeader from './components/DocumentHeader';
import EditorCanvas from './components/EditorCanvas';
import { PortfolioReturnLink } from './components/PortfolioReturnLink';

const App: React.FC = () => {
  const [docTitle, setDocTitle] = useState("Untitled template 09/16/2025 12:27 PM");
  const [insertVariableTrigger, setInsertVariableTrigger] = useState(0);

  const handleInsertVariable = () => {
    setInsertVariableTrigger(prev => prev + 1);
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden text-gray-900 selection:bg-[#7A005D]/20 selection:text-[#7A005D]">
      <PortfolioReturnLink />
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Global Navigation */}
        <Header />

        {/* Document Context Area */}
        <div className="flex flex-col flex-1 relative">
          <DocumentHeader 
            title={docTitle} 
            setTitle={setDocTitle} 
            onInsertVariable={handleInsertVariable}
          />
          <Toolbar />
          
          {/* Main Editor Canvas */}
          <EditorCanvas insertTrigger={insertVariableTrigger} />

          {/* Bottom Controls */}
          <div className="absolute bottom-6 left-6 flex items-center gap-2 z-20">
             <div className="p-1.5 bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
               <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M4 6h16M4 12h16M4 18h16" />
               </svg>
             </div>
             <div className="p-1.5 bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
               <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <circle cx="12" cy="12" r="3" />
                 <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
               </svg>
             </div>
          </div>
          <div className="absolute bottom-6 right-6 z-20">
             <div className="p-2 bg-white border border-gray-200 rounded-full shadow-md cursor-pointer hover:shadow-lg transition-all text-gray-500 hover:text-gray-800">
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
               </svg>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
