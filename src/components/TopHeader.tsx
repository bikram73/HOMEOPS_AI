import React, { useState } from 'react';
import { PageTab, UserProfile } from '../types';
import { LOGO_URL } from '../data/mockData';

interface TopHeaderProps {
  activeTab: PageTab;
  setActiveTab: (tab: PageTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'desktop' | 'mobile-preview';
  setViewMode: (mode: 'desktop' | 'mobile-preview') => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  profile?: UserProfile | null;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onOpenNotifications,
  unreadCount = 2,
  profile,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const displayName = profile?.name || 'Demo Home';
  const householdName = profile?.householdName || 'My Household';

  return (
    <header
      id="top-app-bar"
      className="flex justify-between items-center w-full px-4 md:px-8 py-3.5 bg-white border-b border-[#e2e8f0] shadow-sm sticky top-0 z-30"
    >
      {/* Mobile brand & Logo */}
      <div
        onClick={() => setActiveTab('landing')}
        className="md:hidden flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
        title="Return to Home / Landing Page"
        role="button"
        tabIndex={0}
      >
        <img
          src={LOGO_URL}
          alt="HomeOps Logo"
          className="w-7 h-7 rounded-md object-contain bg-[#131b2e] p-1"
        />
        <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">
          HomeOps AI
        </h1>
      </div>

      {/* Desktop Search / Breadcrumbs */}
      <div className="hidden md:flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
            search
          </span>
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, inventory, bills, AI..."
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-full py-2 pl-10 pr-4 text-sm text-[#0F172A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:bg-white transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Landing Page Trigger */}
        <button
          id="btn-goto-landing"
          onClick={() => setActiveTab('landing')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0F766E] bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
          title="View Landing Page"
        >
          <span className="material-symbols-outlined text-[16px]">public</span>
          <span>Website</span>
        </button>

        {/* Device View Switcher Toggle for easy testing of Desktop vs Mobile screens */}
        <div className="flex items-center bg-[#f1f5f9] p-1 rounded-lg border border-[#e2e8f0]">
          <button
            id="btn-view-desktop"
            onClick={() => setViewMode('desktop')}
            title="Desktop Mode"
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'desktop'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            id="btn-view-mobile"
            onClick={() => setViewMode('mobile-preview')}
            title="Mobile Screen View"
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'mobile-preview'
                ? 'bg-white text-[#0F766E] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smartphone</span>
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Notifications Icon Button */}
        <button
          id="btn-notifications"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-[#f1f5f9] transition-colors"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white"></span>
          )}
        </button>

        {/* AI Assistant Quick Trigger */}
        <button
          id="btn-quick-ai"
          onClick={() => setActiveTab('assistant')}
          className={`p-2 rounded-full transition-colors ${
            activeTab === 'assistant'
              ? 'bg-[#CCFBF1] text-[#0F766E]'
              : 'text-gray-600 hover:text-[#0F766E] hover:bg-[#f1f5f9]'
          }`}
          title="HomeOps AI Assistant"
        >
          <span className="material-symbols-outlined text-[22px]">smart_toy</span>
        </button>

        {/* User / Household Profile Pill */}
        <div className="relative">
          <button
            id="btn-user-profile"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 border border-[#e2e8f0] rounded-full hover:bg-[#f8fafc] transition-colors bg-white cursor-pointer"
          >
            <span className="w-5 h-5 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center text-[10px] font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="text-xs font-semibold text-[#0F172A] hidden sm:inline max-w-[120px] truncate">
              {displayName}
            </span>
            <span className="material-symbols-outlined text-gray-400 text-[16px]">
              arrow_drop_down
            </span>
          </button>

          {showUserMenu && (
            <div
              id="user-dropdown-menu"
              className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-[#e2e8f0] py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-[#0F172A] truncate">{householdName}</p>
                <p className="text-[11px] text-gray-500 truncate">
                  {profile?.city ? `${profile.city} • ` : ''}Active Ops
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('landing');
                  setShowUserMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-[#f8fafc] flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">public</span> Landing Page
              </button>
              <button
                onClick={() => {
                  setActiveTab('home');
                  setShowUserMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-[#f8fafc] flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">home</span> Dashboard
              </button>
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setShowUserMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-[#f8fafc] flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span> Settings &amp; Data
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
