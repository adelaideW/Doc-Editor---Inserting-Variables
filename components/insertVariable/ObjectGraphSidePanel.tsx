import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Database,
  Folder,
  Info,
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Type,
  X,
} from 'lucide-react';
import type { VariableMenuNode } from '../variablesCatalog';
import type { VariableItem } from '../VariableDropdown';
import {
  OBJECT_GRAPH_SECTIONS,
  getSectionNodes,
  hasChildren,
  nodeToVariableItem,
  searchLeavesGroupedBySection,
  type SearchLeafMatch,
} from './variableTreeNav';
import VariableDetailFlyout from './VariableDetailFlyout';
import { getVariableDescription } from './variableDescriptions';

export type ObjectGraphPanelVariant = 'available-data' | 'object-graph';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (item: VariableItem) => void;
  variant?: ObjectGraphPanelVariant;
  usedVariableIds?: Set<string>;
}

type PanelFilterId = 'all' | 'favorites' | 'in-use' | 'legacy';

const FAVORITE_IDS = new Set([
  'emp.tpl.full-name-0',
  'doc.c.co.business-legal-name-0',
  'emp.rec.entity-information-1',
]);

const FAVORITE_FOLDER_IDS = new Set(['root.employee', 'emp.identity']);

const VISIBLE_LEAVES = 4;
const FLYOUT_CLOSE_DELAY_MS = 140;

function toApiName(id: string) {
  return `virtual_${id.replace(/\./g, '_').replace(/-/g, '_')}`;
}

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold text-gray-900">{text.slice(idx, idx + q.length)}</strong>
      {text.slice(idx + q.length)}
    </>
  );
}

function filterTree(nodes: VariableMenuNode[], predicate: (nodeId: string) => boolean): VariableMenuNode[] {
  const result: VariableMenuNode[] = [];
  for (const node of nodes) {
    if (hasChildren(node)) {
      const children = filterTree(node.children!, predicate);
      if (children.length > 0) result.push({ ...node, children });
    } else if (predicate(node.id)) {
      result.push(node);
    }
  }
  return result;
}

function leafTypeIcon(item: VariableItem) {
  const hay = `${item.label} ${item.id}`.toLowerCase();
  if (item.fieldType === 'date-signed' || hay.includes('date') || hay.includes('time off')) {
    return <Calendar size={14} className="text-gray-400" />;
  }
  if (hay.includes('currency') || hay.includes('compensation') || hay.includes('pay')) {
    return <CircleDollarSign size={14} className="text-gray-400" />;
  }
  return <Type size={14} className="text-gray-400" />;
}

function useDelayedFlyout() {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const cancelClose = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const openFlyout = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    timerRef.current = setTimeout(() => setOpen(false), FLYOUT_CLOSE_DELAY_MS);
  }, [cancelClose]);

  return { open, openFlyout, scheduleClose, cancelClose };
}

function LeafRow({
  label,
  inContext,
  item,
  searchQuery,
  onInsert,
  indent = true,
  showApiName = false,
}: {
  label: string;
  inContext?: string;
  item: VariableItem;
  searchQuery: string;
  onInsert: (item: VariableItem) => void;
  indent?: boolean;
  showApiName?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const { open: detailOpen, openFlyout, scheduleClose } = useDelayedFlyout();
  const infoRef = useRef<HTMLButtonElement>(null);

  const subtitle = showApiName
    ? toApiName(item.id)
    : inContext
      ? `in ${inContext}`
      : null;
  const description = getVariableDescription(label);

  return (
    <div
      className={`relative rounded-md hover:bg-[#fafafa] py-3 ${indent ? 'pl-7 pr-2' : 'pl-1 pr-2'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-2">
        <span className="w-[22px] shrink-0 flex justify-center pt-0.5">{leafTypeIcon(item)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-gray-900 leading-snug break-words">
                {highlightMatch(label, searchQuery)}
              </div>
            </div>
            <div
              className={`flex items-center gap-0.5 shrink-0 transition-opacity ${
                hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                type="button"
                title="Insert variable"
                onClick={() => onInsert(item)}
                className="p-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-[#7A005D] hover:border-[#7A005D]/30 shadow-sm"
              >
                <Plus size={14} />
              </button>
              <button
                ref={infoRef}
                type="button"
                title="Variable details"
                onMouseEnter={openFlyout}
                onMouseLeave={scheduleClose}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600"
              >
                <Info size={14} />
              </button>
            </div>
          </div>
          {subtitle && (
            <div
              className={`text-[12px] text-gray-400 mt-1 leading-snug break-words ${
                showApiName ? 'font-mono text-[11px]' : ''
              }`}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <VariableDetailFlyout
        anchorRef={infoRef}
        open={detailOpen}
        variableLabel={label}
        description={description}
        categoryLabel={inContext ?? 'Employee'}
        objectLabel={item.category?.split(' › ')[0] ?? 'Employee'}
        onMouseEnter={openFlyout}
        onMouseLeave={scheduleClose}
      />
    </div>
  );
}

function FolderRow({
  label,
  searchQuery,
  description,
  source = 'Rippling',
}: {
  label: string;
  searchQuery: string;
  description?: string;
  source?: string;
}) {
  return (
    <div className="py-3">
      <div className="flex items-start gap-2.5">
        <Folder size={15} className="text-gray-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-gray-900 leading-snug break-words">
            {highlightMatch(label, searchQuery)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1.5">
            <Database size={11} />
            <span>{source}</span>
          </div>
          {description && (
            <p className="text-[12px] text-gray-500 mt-2 leading-relaxed break-words">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ObjectRow({
  label,
  searchQuery,
  description,
  source = 'Rippling',
}: {
  label: string;
  searchQuery: string;
  description?: string;
  source?: string;
}) {
  return (
    <div className="py-3">
      <div className="flex items-start gap-2.5">
        <LayoutGrid size={15} className="text-gray-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-gray-900 leading-snug break-words">
            {highlightMatch(label, searchQuery)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1.5 flex-wrap">
            <Database size={11} />
            <span>{source}</span>
            <span>·</span>
            <span>{label}</span>
          </div>
          {description && (
            <p className="text-[12px] text-gray-500 mt-2 leading-relaxed break-words">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TreeRow({
  node,
  breadcrumbs,
  depth,
  searchQuery,
  onInsert,
  browseMode = false,
}: {
  node: VariableMenuNode;
  breadcrumbs: string[];
  depth: number;
  searchQuery: string;
  onInsert: (item: VariableItem) => void;
  browseMode?: boolean;
}) {
  const [expanded, setExpanded] = useState(browseMode ? depth < 2 : depth < 1);
  const child = hasChildren(node);
  const item = nodeToVariableItem(node, breadcrumbs);
  const isFavoriteFolder = FAVORITE_FOLDER_IDS.has(node.id);

  if (!child) {
    return (
      <LeafRow
        label={node.label}
        inContext={breadcrumbs[breadcrumbs.length - 1]}
        item={item}
        searchQuery={searchQuery}
        onInsert={onInsert}
        indent={depth > 0}
        showApiName={browseMode}
      />
    );
  }

  return (
    <>
      <div
        className="flex items-center min-h-[40px] px-1 py-2 rounded-md hover:bg-[#fafafa]"
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        <button
          type="button"
          className="p-0.5 rounded hover:bg-gray-100 shrink-0 border-0 bg-transparent mr-1"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown size={14} className="text-gray-400" />
          ) : (
            <ChevronRight size={14} className="text-gray-400" />
          )}
        </button>
        <Folder size={14} className="text-gray-400 shrink-0 mr-2" />
        <span className="flex-1 text-[13px] font-medium text-gray-900 break-words">{node.label}</span>
        {browseMode && isFavoriteFolder && (
          <Star size={13} className="text-[#7A005D] shrink-0 mr-1" fill="currentColor" />
        )}
      </div>
      {expanded &&
        node.children!.map((childNode) => (
          <TreeRow
            key={childNode.id}
            node={childNode}
            breadcrumbs={[...breadcrumbs, node.label]}
            depth={depth + 1}
            searchQuery={searchQuery}
            onInsert={onInsert}
            browseMode={browseMode}
          />
        ))}
    </>
  );
}

function SearchGroupBlock({
  sectionLabel,
  matches,
  searchQuery,
  onInsert,
}: {
  sectionLabel: string;
  matches: SearchLeafMatch[];
  searchQuery: string;
  onInsert: (item: VariableItem) => void;
}) {
  const byObject = matches.reduce<Record<string, SearchLeafMatch[]>>((acc, m) => {
    const key = m.objectLabel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(byObject).map(([obj, objMatches], groupIndex) => {
        const visible = objMatches.slice(0, VISIBLE_LEAVES);
        const hasMore = objMatches.length > VISIBLE_LEAVES;
        const folderDescription =
          obj.toLowerCase() === 'employee'
            ? 'Information about time off policies, balances, and requests for employees.'
            : `Information that Rippling stores about ${obj.toLowerCase()} and related records.`;
        const objectDescription = `Information that Rippling stores about ${obj.toLowerCase()} and related records.`;

        return (
          <div
            key={`${sectionLabel}-${obj}`}
            className={groupIndex > 0 ? 'border-t border-[#ececec] mt-6 pt-2' : ''}
          >
            <FolderRow label={obj} searchQuery={searchQuery} description={folderDescription} />
            <ObjectRow label={obj} searchQuery={searchQuery} description={objectDescription} />
            <div className="mt-1">
              {visible.map(({ item, inContext }) => (
                <LeafRow
                  key={item.id}
                  label={item.insertLabel ?? item.label}
                  inContext={inContext}
                  item={item}
                  searchQuery={searchQuery}
                  onInsert={onInsert}
                />
              ))}
            </div>
            {hasMore && (
              <button
                type="button"
                className="inline-flex items-center gap-1 mt-2 mb-1 pl-7 text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8] border-0 bg-transparent p-0"
              >
                Show all results in object
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}

const ObjectGraphSidePanel: React.FC<Props> = ({
  isOpen,
  onClose,
  onInsert,
  variant = 'available-data',
  usedVariableIds = new Set(),
}) => {
  const isBrowse = variant === 'object-graph';
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PanelFilterId>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(OBJECT_GRAPH_SECTIONS.map((s) => [s.label, true]))
  );

  const passesFilter = useCallback(
    (nodeId: string) => {
      if (filter === 'all') return true;
      if (filter === 'favorites') return FAVORITE_IDS.has(nodeId) || FAVORITE_FOLDER_IDS.has(nodeId);
      if (filter === 'in-use') return usedVariableIds.has(nodeId);
      if (filter === 'legacy') return nodeId.includes('agr.') || nodeId.includes('docwf.');
      return true;
    },
    [filter, usedVariableIds]
  );

  const searchGroups = useMemo(() => {
    return searchLeavesGroupedBySection(search, passesFilter);
  }, [search, passesFilter]);

  const browseSections = useMemo(() => {
    return OBJECT_GRAPH_SECTIONS.map((section) => {
      const roots = getSectionNodes(section.label);
      const nodes =
        filter === 'all' ? roots : filterTree(roots, (nodeId) => passesFilter(nodeId));
      return { section, nodes };
    }).filter(({ nodes }) => nodes.length > 0);
  }, [filter, passesFilter]);

  if (!isOpen) return null;

  const isSearching = search.trim().length > 0;
  const trimmedSearch = search.trim();
  const inUseEmpty = filter === 'in-use' && usedVariableIds.size === 0;

  const browseFilters: { id: PanelFilterId; label: string; icon: React.ReactNode }[] = isBrowse
    ? [
        { id: 'all', label: 'All', icon: <List size={12} /> },
        { id: 'favorites', label: 'Favorites', icon: <Star size={12} /> },
        { id: 'in-use', label: 'In use', icon: <CheckCircle2 size={12} /> },
        { id: 'legacy', label: 'Legacy', icon: <Clock size={12} /> },
      ]
    : [
        { id: 'all', label: 'All', icon: <List size={12} /> },
        { id: 'favorites', label: 'Favorites', icon: <Star size={12} /> },
        { id: 'in-use', label: 'In use', icon: <CheckCircle2 size={12} /> },
      ];

  return (
    <aside
      className="w-[360px] shrink-0 h-full min-h-0 max-h-full bg-white border-r border-[#e0dede] flex flex-col overflow-hidden"
      aria-label={isBrowse ? 'Object graph variables' : 'Available data'}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={`shrink-0 px-6 pb-0 ${isBrowse ? 'pt-4' : 'pt-6'}`}>
        <div className="flex items-center justify-between gap-3">
          <h2
            className={
              isBrowse
                ? 'text-[11px] font-bold uppercase tracking-[0.1em] text-gray-800'
                : 'text-[15px] font-semibold text-gray-900 tracking-tight'
            }
          >
            {isBrowse ? 'Object graph variables' : 'Available data'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 border-0 bg-transparent shrink-0"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative mt-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full min-h-[40px] pl-9 pr-9 text-[13px] border border-[#d3d3d3] rounded-lg outline-none focus:ring-2 focus:ring-[#7A005D]/15 focus:border-[#7A005D]/30 bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent p-0.5 rounded-full hover:bg-gray-100"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4 pb-4 border-b border-[#ececec]">
          {browseFilters.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium border transition-colors ${
                filter === id
                  ? 'bg-[#7A005D] text-white border-[#7A005D]'
                  : 'bg-white text-gray-600 border-[#e0dede] hover:border-gray-300'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
          <button
            type="button"
            className="ml-auto p-1.5 text-gray-400 border-0 bg-transparent rounded-md hover:bg-gray-50"
            aria-hidden
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-6 pb-8"
        onWheel={(e) => e.stopPropagation()}
      >
        {inUseEmpty ? (
          <p className="py-12 text-[13px] text-gray-400 text-center leading-relaxed">
            No variables from this document are in use yet. Insert variables in the editor to see them here.
          </p>
        ) : isSearching ? (
          searchGroups.length > 0 ? (
            <>
              <p className="text-[13px] text-gray-600 mb-5">
                Results for &ldquo;{trimmedSearch}&rdquo;
              </p>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 shrink-0">
                  All data
                </span>
                <div className="flex-1 h-px bg-[#ececec]" />
              </div>
              {searchGroups.map((group) => (
                <SearchGroupBlock
                  key={group.sectionLabel}
                  sectionLabel={group.sectionLabel}
                  matches={group.matches}
                  searchQuery={search}
                  onInsert={onInsert}
                />
              ))}
            </>
          ) : (
            <p className="py-12 text-[13px] text-gray-400 text-center">No matching variables</p>
          )
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4 mt-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 shrink-0">
                {isBrowse ? 'Categories' : 'Object graph variables'}
              </span>
              <div className="flex-1 h-px bg-[#ececec]" />
            </div>
            {browseSections.length === 0 ? (
              <p className="py-12 text-[13px] text-gray-400 text-center">No matching variables</p>
            ) : (
              browseSections.map(({ section, nodes }) => {
                const sectionOpen = expandedSections[section.label] ?? true;
                return (
                  <div key={section.label} className="mb-2">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-1 py-2.5 min-h-[40px] text-left rounded-md hover:bg-[#fafafa] border-0 bg-transparent"
                      onClick={() =>
                        setExpandedSections((prev) => ({ ...prev, [section.label]: !sectionOpen }))
                      }
                    >
                      {sectionOpen ? (
                        <ChevronDown size={14} className="text-gray-400 shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-gray-400 shrink-0" />
                      )}
                      <Folder size={14} className="text-gray-400 shrink-0" />
                      <span className="text-[13px] font-medium text-gray-800 flex-1 text-left break-words">
                        {section.label}
                      </span>
                    </button>
                    {sectionOpen &&
                      nodes.map((node) => (
                        <TreeRow
                          key={node.id}
                          node={node}
                          breadcrumbs={[section.label]}
                          depth={0}
                          searchQuery={search}
                          onInsert={onInsert}
                          browseMode={isBrowse}
                        />
                      ))}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default ObjectGraphSidePanel;
