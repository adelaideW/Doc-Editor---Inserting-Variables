import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import VariableDetailPanel from './VariableDetailPanel';

interface Props {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  variableLabel: string;
  description?: string;
  categoryLabel?: string;
  objectLabel?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const FLYOUT_WIDTH = 300;
const VIEWPORT_PAD = 12;

const VariableDetailFlyout: React.FC<Props> = ({
  anchorRef,
  open,
  variableLabel,
  description,
  categoryLabel,
  objectLabel,
  onMouseEnter,
  onMouseLeave,
}) => {
  const flyoutRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const anchorRect = anchorRef.current!.getBoundingClientRect();
      const panelHeight = flyoutRef.current?.offsetHeight ?? 400;
      const gap = 10;

      let left = anchorRect.right + gap;
      if (left + FLYOUT_WIDTH > window.innerWidth - VIEWPORT_PAD) {
        left = anchorRect.right - FLYOUT_WIDTH - gap;
      }
      if (left + FLYOUT_WIDTH > window.innerWidth - VIEWPORT_PAD) {
        left = anchorRect.left - FLYOUT_WIDTH - gap;
      }
      left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - FLYOUT_WIDTH - VIEWPORT_PAD));

      const anchorCenterY = anchorRect.top + anchorRect.height / 2;
      let top = anchorCenterY - panelHeight / 2;
      top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - panelHeight - VIEWPORT_PAD));

      setStyle({
        position: 'fixed',
        top,
        left,
        zIndex: 9999,
        visibility: 'visible',
      });
    };

    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchorRef, variableLabel]);

  if (!open) return null;

  return createPortal(
    <div ref={flyoutRef} style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <VariableDetailPanel
        variableLabel={variableLabel}
        description={description}
        categoryLabel={categoryLabel}
        objectLabel={objectLabel}
      />
    </div>,
    document.body
  );
};

export default VariableDetailFlyout;
