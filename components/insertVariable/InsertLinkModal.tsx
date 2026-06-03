import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, label: string) => void;
}

const InsertLinkModal: React.FC<Props> = ({ isOpen, onClose, onInsert }) => {
  const [url, setUrl] = useState('https://');
  const [label, setLabel] = useState('');
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setUrl('https://');
    setLabel('');
    requestAnimationFrame(() => urlRef.current?.focus());
  }, [isOpen]);

  if (!isOpen) return null;

  const canInsert = url.trim().length > 0 && label.trim().length > 0;

  const handleSubmit = () => {
    if (!canInsert) return;
    onInsert(url.trim(), label.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1150] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="insert-link-title"
        className="relative w-full max-w-[420px] bg-white rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.18)] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'Enter' && canInsert) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 id="insert-link-title" className="text-[15px] font-semibold text-gray-900">
            Insert link
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
          <div>
            <label htmlFor="link-label" className="block text-[12px] font-medium text-gray-600 mb-1.5">
              Display text
            </label>
            <input
              id="link-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Link text"
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#7A005D]/15 focus:border-[#7A005D]/30"
            />
          </div>
          <div>
            <label htmlFor="link-url" className="block text-[12px] font-medium text-gray-600 mb-1.5">
              URL
            </label>
            <input
              ref={urlRef}
              id="link-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#7A005D]/15 focus:border-[#7A005D]/30"
            />
          </div>
          {canInsert && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                Preview
              </p>
              <a
                href={url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-[#2563eb] underline underline-offset-2"
              >
                {label.trim()}
              </a>
            </div>
          )}
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
            disabled={!canInsert}
            onClick={handleSubmit}
            className={`px-5 py-2 rounded-full text-[14px] font-medium border-0 transition-colors ${
              canInsert
                ? 'bg-[#7A005D] text-white hover:bg-[#66004D]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsertLinkModal;
