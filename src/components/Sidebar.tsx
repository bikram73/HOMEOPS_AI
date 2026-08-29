import React from 'react';
import { PageTab } from '../types';
import { LOGO_URL } from '../data/mockData';

interface SidebarProps {
  activeTab: PageTab;
  setActiveTab: (tab: PageTab) => void;
  pendingTasksCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingTasksCount,
}) => {
  const navItems: { id: PageTab; label: string; icon: string; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'tasks', label: 'Tasks', icon: 'assignment', badge: pendingTasksCount },
    { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
    { id: 'shopping', label: 'Shopping', icon: 'shopping_cart' },
    { id: 'bills', label: 'Bills', icon: 'payments' },
    { id: 'maintenance', label: 'Maintenance', icon: 'handyman' },
    { id: 'assistant', label: 'AI Assistant', icon: 'smart_toy' },
  ];

  return (
    <aside
      id="sidebar-nav"
      className="hidden md:flex flex-col w-[260px] lg:w-[280px] h-screen sticky left-0 top-0 bg-[#131b2e] text-white py-8 px-4 shrink-0 shadow-lg z-20 border-r border-[#1e293b]"
    >
      {/* Brand & Home Header */}
      <div
        id="sidebar-brand"
        onClick={() => setActiveTab('home')}
        className="flex items-center gap-3 px-3 mb-8 cursor-pointer group"
      >
        <img
          src={LOGO_URL}
          alt="HomeOps Logo"
          className="w-9 h-9 rounded-lg object-contain bg-white/10 p-1 group-hover:scale-105 transition-transform"
        />
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight leading-none flex items-center gap-1.5">
            HomeOps AI
          </h1>
          <p className="text-xs text-[#99efe5]/80 mt-1 font-medium">Demo Home</p>
        </div>
      </div>

      {/* Primary Navigation Links */}
      <nav id="sidebar-menu" className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left group ${
                isActive
                  ? 'bg-[#99efe5]/20 text-[#99efe5] font-bold shadow-sm'
                  : 'text-[#bec6e0]/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`material-symbols-outlined text-[22px] transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-[#99efe5] fill-1' : 'text-[#bec6e0]'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-[#ba1a1a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Navigation (Settings & Help) */}
      <div id="sidebar-footer" className="mt-auto space-y-1 pt-4 border-t border-[#3f465c]/40">
        <button
          id="nav-link-settings"
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-[#99efe5]/20 text-[#99efe5] font-bold'
              : 'text-[#bec6e0]/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span>Settings</span>
        </button>
        <button
          id="nav-link-help"
          onClick={() => setActiveTab('help')}
          className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'help'
              ? 'bg-[#99efe5]/20 text-[#99efe5] font-bold'
              : 'text-[#bec6e0]/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span>Help</span>
        </button>
      </div>
    </aside>
  );
};
