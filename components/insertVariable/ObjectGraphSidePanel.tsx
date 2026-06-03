import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Info,
  Monitor,
  Plus,
  Search,
  X,
  Database,
  Box,
  Laptop,
} from 'lucide-react';
import type { VariableMenuNode } from '../variablesCatalog';
import type { VariableItem } from '../VariableDropdown';
import {
  OBJECT_GRAPH_SECTIONS,
  getSectionNodes,
  hasChildren,
  nodeToVariableItem,
  searchVariableItems,
} from './variableTreeNav';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (item: VariableItem) => void;
}

type FilterId = 'all' | 'favorites' | 'legal';

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'Custom objects': <Box size={14} className="text-gray-500 shrink-0" />,
  'Derived datasets': <Database size={14} className="text-gray-500 shrink-0" />,
  Devices: <Laptop size={14} className="text-gray-500 shrink-0" />,
};

const FAVORITE_IDS = new Set([
  'emp.tpl.full-name',
  'doc.c.co.business-legal-name-0',
  'emp.rec.entity-information-1',
]);

function TreeRow({
  node,
  breadcrumbs,
  depth,
  onInsert,
}: {
  node: VariableMenuNode;
  breadcrumbs: string[];
  depth: number;
  onInsert: (item: VariableItem) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [hovered, setHovered] = useState(false);
  const child = hasChildren(node);
  const item = nodeToVariableItem(node, breadcrumbs);

  return (
    <>
      <div
        className="group flex items-center gap-1 py-1.5 pr-2 hover:bg-gray-50 rounded-md cursor-default"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {child ? (
          <button
            type="button"
            className="p-0.5 rounded hover:bg-gray-100 shrink-0 border-0 bg-transparent"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronDown size={14} className="text-gray-400" />
            ) : (
              <ChevronRight size={14} className="text-gray-400" />
            )}
          </button>
        ) : (
          <span className="w-[22px] shrink-0 flex justify-center">
            <Monitor size={13} className="text-gray-400" />
          </span>
        )}
        <span className="flex-1 text-[13px] text-gray-800 truncate">{node.label}</span>
        {!child && hovered && (
          <button
            type="button"
            className="shrink-0 p-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-[#7A005D] hover:border-[#7A005D]/30 shadow-sm"
            title="Insert variable"
            onClick={() => onInsert(item)}
          >
            <Plus size={14} />
          </button>
        )}
        {!child && hovered && (
          <Info size={13} className="text-gray-300 shrink-0 ml-0.5" aria-hidden />
        )}
      </div>
      {child && expanded &&
        node.children!.map((childNode) => (
          <TreeRow
            key={childNode.id}
            node={childNode}
            breadcrumbs={[...breadcrumbs, node.label]}
            depth={depth + 1}
            onInsert={onInsert}
          />
        ))}
    </>
  );
}

const ObjectGraphSidePanel: React.FC<Props> = ({ isOpen, onClose, onInsert }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(OBJECT_GRAPH_SECTIONS.map((s) => [s.label, true]))
  );

  const searchResults = useMemo(() => searchVariableItems(search), [search]);

  const passesFilter = (nodeId: string) => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return FAVORITE_IDS.has(nodeId);
    if (filter === 'legal') return nodeId.includes('agr.') || nodeId.includes('doc.');
    return true;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1040] bg-black/10" onClick={onClose} aria-hidden />
      <aside
        className="fixed left-0 top-0 bottom-0 z-[1050] w-[320px] bg-white border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.08)] flex flex-col animate-in slide-in-from-left duration-200"
        aria-label="Object graph variables"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-[11px] font-bold tracking-[0.12em] text-gray-500 uppercase">
            Object graph variables
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 border-0 bg-transparent"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-3 py-3 border-b border-gray-50">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full pl-8 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#7A005D]/20 focus:border-[#7A005D]/40"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {(
              [
                { id: 'all' as const, label: 'All objects' },
                { id: 'favorites' as const, label: 'Favorites' },
                { id: 'legal' as const, label: 'Legal' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                  filter === id
                    ? 'bg-[#7A005D] text-white border-[#7A005D]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {search.trim() ? (
            searchResults.length > 0 ? (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 group flex items-center gap-2 border-0 bg-transparent"
                  onClick={() => onInsert(item)}
                >
                  <span className="flex-1 text-[13px] text-gray-800 truncate">{item.label}</span>
                  <Plus size={14} className="text-gray-400 group-hover:text-[#7A005D] shrink-0" />
                </button>
              ))
            ) : (
              <p className="px-3 py-6 text-[13px] text-gray-400 text-center">No matching variables</p>
            )
          ) : (
            OBJECT_GRAPH_SECTIONS.map((section) => {
              const nodes = getSectionNodes(section.label).filter((n) => passesFilter(n.id));
              if (nodes.length === 0) return null;
              const sectionOpen = expandedSections[section.label] ?? true;
              return (
                <div key={section.label} className="mb-1">
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2 py-2 text-left rounded-md hover:bg-gray-50 border-0 bg-transparent"
                    onClick={() =>
                      setExpandedSections((prev) => ({ ...prev, [section.label]: !sectionOpen }))
                    }
                  >
                    {sectionOpen ? (
                      <ChevronDown size={14} className="text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-400 shrink-0" />
                    )}
                    {SECTION_ICONS[section.label]}
                    <span className="text-[13px] font-semibold text-gray-800">{section.label}</span>
                  </button>
                  {sectionOpen &&
                    nodes.map((node) => (
                      <TreeRow
                        key={node.id}
                        node={node}
                        breadcrumbs={[section.label]}
                        depth={0}
                        onInsert={onInsert}
                      />
                    ))}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};

export default ObjectGraphSidePanel;
