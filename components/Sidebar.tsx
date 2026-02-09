
import React from 'react';
import { 
  Files, 
  Layout, 
  Users, 
  History, 
  Mail, 
  Settings, 
  HelpCircle,
  Shapes,
  Grid
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const topItems = [
    { icon: <Files size={20} />, id: 'docs' },
    { icon: <Layout size={20} />, id: 'templates' },
    { icon: <Shapes size={20} />, id: 'elements' },
    { icon: <Users size={20} />, id: 'collaborators' },
    { icon: <Mail size={20} />, id: 'messages' },
    { icon: <History size={20} />, id: 'history' },
  ];

  const bottomItems = [
    { icon: <Grid size={20} />, id: 'apps' },
    { icon: <Settings size={20} />, id: 'settings' },
    { icon: <HelpCircle size={20} />, id: 'help' },
  ];

  return (
    <div className="w-14 h-full border-r border-gray-200 bg-white flex flex-col justify-between py-4 items-center flex-shrink-0">
      <div className="flex flex-col gap-6 items-center">
        <div className="w-8 h-8 bg-[#7A005D] rounded-lg flex items-center justify-center text-white font-bold text-lg mb-2">
          R
        </div>
        {topItems.map((item) => (
          <button
            key={item.id}
            className="p-2 text-gray-500 hover:text-[#7A005D] hover:bg-[#7A005D]/5 rounded-lg transition-colors"
            title={item.id}
          >
            {item.icon}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-6 items-center">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
