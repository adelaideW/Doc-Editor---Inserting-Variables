import React from 'react';
import { createPortal } from 'react-dom';

interface Props {
  description: string;
  anchorRect: DOMRect;
}

const VariableChipRouteTooltip: React.FC<Props> = ({ description, anchorRect }) => {
  const left = Math.max(12, Math.min(anchorRect.left, window.innerWidth - 300));
  const top = anchorRect.top - 8;

  return createPortal(
    <div
      role="tooltip"
      className="fixed z-[9998] max-w-[280px] px-2.5 py-1.5 rounded-md bg-gray-900 text-white text-[11px] leading-snug shadow-lg pointer-events-none line-clamp-3"
      style={{ left, top, transform: 'translateY(-100%)' }}
    >
      {description}
    </div>,
    document.body
  );
};

export default VariableChipRouteTooltip;
