
import React, { useMemo, useEffect, useState } from 'react';
import { User, Zap, ChevronRight, Search } from 'lucide-react';

export interface VariableItem {
  id: string;
  label: string;
  category: string;
  isCategory?: boolean;
}

const EMPLOYEE_SUB_ITEMS: VariableItem[] = [
  { id: 'emp.details', label: 'Employee details', category: 'Employee' },
  { id: 'emp.entity', label: 'Entity information', category: 'Employee' },
  { id: 'emp.contractor', label: 'Entity contractor details', category: 'Employee' },
  { id: 'emp.country_pers', label: 'Country-specific personal inform...', category: 'Employee' },
  { id: 'emp.status', label: 'Employment status', category: 'Employee' },
  { id: 'emp.apps', label: 'Third Party Apps', category: 'Employee' },
  { id: 'emp.auth', label: 'Authentication settings', category: 'Employee' },
  { id: 'emp.info', label: 'Employment information', category: 'Employee' },
  { id: 'emp.band', label: 'Compensation Band', category: 'Employee' },
  { id: 'emp.insurance', label: 'Employee insurance fields', category: 'Employee' },
  { id: 'emp.contractor_det', label: 'Employee contractor details', category: 'Employee' },
  { id: 'emp.login', label: 'Employee login details', category: 'Employee' },
  { id: 'emp.country_emp', label: 'Country-specific employment inf...', category: 'Employee' },
  { id: 'emp.personal', label: 'Employee personal information', category: 'Employee' },
];

const CUSTOM_VARIABLES = {
  consultant: [
    'Contractor Name', 'Contractor Full Address', 'Contractor Address', 'Contractor City',
    'Contractor State', 'Contractor Zip', '1099 Contractor Project Description',
    '1099 Contractor Compensation Description', 'Contractor Signatory Signature',
    'Contractor Signatory Name', 'Contractor Signatory Title', 'Contractor Signatory Signature Date',
    'Personal Email', 'Contractor ABN'
  ],
  company: [
    'Business Legal Name', 'Business DBA Name', 'Business Full Address name',
    'Business Street Address', 'Business city', 'Business State', 'Business Zip',
    'Business Phone', 'the Fein For the business', 'Company Email'
  ],
  employee: [
    'Full name', 'First name', 'Last name', 'Employee home full address',
    'Employee home street address', 'employee home city', 'employee home state',
    'employee home zip code', 'Personal Email', 'Relocation origin city',
    'Relocation Destination city', 'End Date', 'Title', 'department', 'Duties',
    'Additional terms', 'US State or Country (for non-US Location)', 'Start Date',
    'Manager Name', 'Manager title', 'Standard weekly hours', 'Exempt / non-exempt',
    'Full /part-time', 'pay frequency', 'PTO days per year', 'Work location name',
    'Work location address', 'Work location city', 'Work location state',
    'Manager\'s work email', 'Manager\'s phone number', 'Personal leave days per year'
  ]
};

const ROOT_CATEGORIES: VariableItem[] = [
  { id: 'cat.employee', label: 'Employee', category: 'Root', isCategory: true },
  { id: 'cat.custom', label: 'Document custom variables', category: 'Root', isCategory: true },
];

interface VariableDropdownProps {
  onSelect: (value: string) => void;
  searchQuery: string;
  activeIndex: number;
  onFilteredItemsChange?: (items: VariableItem[]) => void;
  style?: React.CSSProperties;
}

const VariableDropdown: React.FC<VariableDropdownProps> = ({ 
  onSelect, 
  searchQuery, 
  activeIndex, 
  onFilteredItemsChange,
  style 
}) => {
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  // Flattened items for search
  const allSearchableItems = useMemo(() => {
    const flattened: VariableItem[] = [...ROOT_CATEGORIES, ...EMPLOYEE_SUB_ITEMS];
    Object.entries(CUSTOM_VARIABLES).forEach(([cat, labels]) => {
      labels.forEach(label => {
        flattened.push({ id: `custom.${cat}.${label}`, label, category: cat });
      });
    });
    return flattened;
  }, []);

  const filteredItems = useMemo(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return allSearchableItems.filter(item => 
        item.label.toLowerCase().includes(query)
      );
    }

    if (currentCategory === 'Employee') {
      return EMPLOYEE_SUB_ITEMS;
    }

    // For "Document custom variables", we don't return a simple list because it uses a custom grid view.
    // However, to keep EditorCanvas happy with activeIndex, we'll return an empty array if in that view
    // or we could return all sub-items. Let's return the root categories if not drilled in.
    return ROOT_CATEGORIES;
  }, [searchQuery, currentCategory, allSearchableItems]);

  useEffect(() => {
    onFilteredItemsChange?.(filteredItems);
  }, [filteredItems, onFilteredItemsChange]);

  const handleItemClick = (item: VariableItem) => {
    if (item.isCategory) {
      setCurrentCategory(item.label);
    } else {
      onSelect(item.label);
    }
  };

  const renderCustomVariables = () => (
    <div className="flex flex-col overflow-y-auto max-h-[500px] p-4 bg-white">
      <div className="mb-6">
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">CONSULTANT / 1099 CONTRACTOR INFORMATION</h3>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_VARIABLES.consultant.map(label => (
            <button 
              key={label}
              onClick={() => onSelect(label)}
              className="px-3 py-1.5 text-[13px] text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">COMPANY INFORMATION</h3>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_VARIABLES.company.map(label => (
            <button 
              key={label}
              onClick={() => onSelect(label)}
              className="px-3 py-1.5 text-[13px] text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2">
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">EMPLOYEE INFORMATION</h3>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_VARIABLES.employee.map(label => (
            <button 
              key={label}
              onClick={() => onSelect(label)}
              className="px-3 py-1.5 text-[13px] text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="absolute bg-white border border-gray-200 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        ...style,
        width: currentCategory === 'Document custom variables' && !searchQuery ? '600px' : '320px'
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Category Header */}
      {currentCategory && !searchQuery && (
        <div 
          className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 bg-[#F9FAFB]"
          onClick={() => setCurrentCategory(null)}
        >
          {currentCategory === 'Employee' ? (
             <span className="text-gray-600 font-mono text-xs w-5 h-5 flex items-center justify-center border border-gray-400 rounded leading-none">[x]</span>
          ) : (
             <Zap size={16} className="text-[#7A005D]" />
          )}
          <span className="text-[14px] font-semibold text-gray-900 flex-1">{currentCategory}</span>
          <ChevronRight size={14} className="text-gray-400 rotate-180" />
        </div>
      )}

      {/* Main List or Grid Content */}
      {currentCategory === 'Document custom variables' && !searchQuery ? (
        renderCustomVariables()
      ) : (
        <div className="flex flex-col py-2 overflow-y-auto max-h-[400px]">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isFocused = index === activeIndex;
              return (
                <div 
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-center gap-3 px-4 py-3 text-[14px] transition-colors cursor-pointer group ${
                    isFocused 
                      ? 'bg-[#7A005D]/5 text-[#7A005D]' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {/* Root icons */}
                  {!currentCategory && !searchQuery && (
                    <div className="w-5 flex justify-center">
                      {item.label === 'Employee' ? (
                        <span className="text-gray-500 font-mono text-[10px] w-5 h-5 flex items-center justify-center border border-gray-300 rounded leading-none">[x]</span>
                      ) : (
                        <Zap size={16} className="text-gray-500" />
                      )}
                    </div>
                  )}

                  <span className={`flex-1 truncate ${isFocused ? 'font-medium' : ''}`}>
                    {item.label}
                  </span>

                  <ChevronRight size={14} className={`text-gray-300 group-hover:text-gray-500 ${isFocused ? 'text-[#7A005D]/50' : ''}`} />
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Search className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-[13px] text-gray-400">No matching variables found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VariableDropdown;
