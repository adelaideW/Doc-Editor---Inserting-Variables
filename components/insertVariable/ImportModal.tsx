import React, { useEffect, useRef, useState } from 'react';
import { FileUp, Upload, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (payload: { file?: File; url?: string }) => void;
}

const ImportModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setUrl('');
    setFile(null);
    setDragOver(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmedUrl = url.trim();
  const canImport = Boolean(file) || trimmedUrl.length > 0;

  const pickFile = (next: File | null) => {
    setFile(next);
    if (next) setUrl('');
  };

  const handleSubmit = () => {
    if (!canImport) return;
    if (file) {
      onImport({ file });
    } else {
      onImport({ url: trimmedUrl });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1150] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="import-modal-title"
        className="relative w-full max-w-[480px] bg-white rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.18)] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 id="import-modal-title" className="text-[15px] font-semibold text-gray-900">
            Import content
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 border-0 bg-transparent"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) pickFile(dropped);
            }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-[#7A005D]/50 bg-[#7A005D]/5'
                : file
                  ? 'border-[#7A005D]/30 bg-[#7A005D]/5'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.html,.htm,.md"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <Upload size={28} className="mx-auto text-gray-400 mb-2" />
            {file ? (
              <p className="text-[13px] font-medium text-gray-800 truncate px-2">{file.name}</p>
            ) : (
              <>
                <p className="text-[13px] font-medium text-gray-800">Drop a file or browse</p>
                <p className="text-[11px] text-gray-500 mt-1">.txt, .html, .htm, .md</p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400 uppercase tracking-wide">or paste a link</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div>
            <label htmlFor="import-url" className="block text-[12px] font-medium text-gray-600 mb-1.5">
              Link URL
            </label>
            <input
              id="import-url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (e.target.value.trim()) setFile(null);
              }}
              placeholder="https://example.com/document.html"
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#7A005D]/15 focus:border-[#7A005D]/30"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="text-[14px] text-gray-600 hover:text-gray-900 border-0 bg-transparent px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canImport}
            onClick={handleSubmit}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-medium border-0 transition-colors ${
              canImport
                ? 'bg-[#7A005D] text-white hover:bg-[#66004D]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FileUp size={14} />
            Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
