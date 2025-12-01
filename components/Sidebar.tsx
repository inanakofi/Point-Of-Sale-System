import React from 'react';
import { ViewState, User, StoreSettings } from '../types';
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Settings, LogOut, Users } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  currentUser: User | null;
  onLogout: () => void;
  settings: StoreSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, currentUser, onLogout, settings }) => {
  const navItems: { view: ViewState; label: string; icon: React.ReactNode; roles: string[] }[] = [
    { view: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'STAFF'] },
    { view: 'REGISTER', label: 'Register', icon: <ShoppingCart size={20} />, roles: ['ADMIN', 'STAFF'] },
    { view: 'INVENTORY', label: 'Inventory', icon: <Package size={20} />, roles: ['ADMIN'] }, // Restricted to Admin for full editing, though typically staff might need view access. Keeping simple per request.
    { view: 'CUSTOMERS', label: 'Customers', icon: <Users size={20} />, roles: ['ADMIN', 'STAFF'] },
    { view: 'REPORTS', label: 'Reports', icon: <BarChart3 size={20} />, roles: ['ADMIN'] },
  ];

  const filteredItems = navItems.filter(item => 
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 shadow-xl z-20">
      <div className="p-6 flex items-center space-x-2 border-b border-slate-800">
        <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center text-white font-bold text-xl">
          {settings.storeName.charAt(0)}
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight truncate">{settings.storeName}</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.view
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        {currentUser?.role === 'ADMIN' && (
            <button 
                onClick={() => onChangeView('SETTINGS')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
                    currentView === 'SETTINGS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
                <Settings size={20} />
                <span>Settings</span>
            </button>
        )}
        
        <div className="mb-2 px-4 py-2">
            <p className="text-xs text-slate-500">Logged in as</p>
            <p className="text-sm font-semibold text-slate-300">{currentUser?.name}</p>
        </div>

        <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-rose-400 hover:text-rose-300 hover:bg-rose-900/20 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;