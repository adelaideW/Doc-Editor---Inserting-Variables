import React from 'react';

// Fix: Added React import to provide React namespace for ReactNode
export interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  type?: 'button' | 'dropdown' | 'separator';
}

// Fix: icon property now has access to React.ReactNode
export interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  id: string;
}

export enum EditorMode {
  EDIT = 'edit',
  PREVIEW = 'preview'
}