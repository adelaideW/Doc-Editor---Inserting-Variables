
import React from 'react';
import { Search, HelpCircle, User, Bell, LayoutGrid, Info } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-12 border-b border-gray-200 bg-white px-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2 cursor-pointer group">
          <span className="text-sm font-semibold text-gray-700">Tools</span>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        <div className="relative max-w-xl w-full mx-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-1.5 bg-gray-100 border-none rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7A005D] transition-all"
            placeholder="Search or jump to..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
           <HelpCircle className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
           <Info className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
           <div className="relative">
             <Bell className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
             <span className="absolute -top-1 -right-1 bg-[#7A005D] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">2</span>
           </div>
           <LayoutGrid className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
        </div>
        <div className="flex items-center gap-2 pl-2">
          <span className="text-sm font-medium text-gray-700">Wright, Davis and Price</span>
          <div className="w-7 h-7 bg-[#7A005D]/10 border border-[#7A005D]/20 rounded-full flex items-center justify-center text-[#7A005D] overflow-hidden">
            <img src="https://picsum.photos/32/32?random=1" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
