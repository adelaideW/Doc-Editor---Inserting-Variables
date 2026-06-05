import React from 'react';
import { Calendar, DollarSign, GitBranch, Hash, List, ToggleLeft, Type } from 'lucide-react';
import type { VariableFieldKind } from '../variablesCatalog';
import { hasVariableChildren, type VariableMenuNode } from '../variablesCatalog';

export function ModalFieldIcon({ node }: { node: VariableMenuNode }) {
  const kind: VariableFieldKind =
    node.fieldKind ?? (hasVariableChildren(node) ? 'folder' : 'text');

  const className = 'text-gray-400 shrink-0';
  const size = 16;

  switch (kind) {
    case 'folder':
      return <GitBranch size={size} className={className} strokeWidth={2} />;
    case 'date':
      return <Calendar size={size} className={className} strokeWidth={2} />;
    case 'boolean':
      return <ToggleLeft size={size} className={className} strokeWidth={2} />;
    case 'list':
      return <List size={size} className={className} strokeWidth={2} />;
    case 'number':
      return <Hash size={size} className={className} strokeWidth={2} />;
    case 'currency':
      return <DollarSign size={size} className={className} strokeWidth={2} />;
    case 'text':
    default:
      return <Type size={size} className={className} strokeWidth={2} />;
  }
}
