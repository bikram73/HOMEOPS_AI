import React, { useState } from 'react';
import { PageTab, UserProfile } from '../types';
import { LOGO_URL } from '../data/mockData';
import { saveProfile, validateProfileInput } from '../utils/profileStore';
import { User, Home, MapPin, DollarSign, Edit3, Check, X, CheckCircle2, Bot } from 'lucide-react';

interface TopHeaderProps {
  activeTab: PageTab;
  setActiveTab: (tab: PageTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode?: 'desktop' | 'mobile-preview';
  setViewMode?: (mode: 'desktop' | 'mobile-preview') => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  profile?: UserProfile | null;
  onUpdateProfile?: (updated: UserProfile) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenNotifications,
  unreadCount = 2,
  profile,
  onUpdateProfile,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editHouseholdName, setEditHouseholdName] = useState(profile?.householdName || '');
  const [editCity, setEditCity] = useState(profile?.city || '');
  const [editCurrency, setEditCurrency] = useState(profile?.currency || 'INR (₹)');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const displayName = profile?.name || 'Demo Home';
  const householdName = profile?.householdName || 'My Household';

  const handleToggleMenu = () => {
    if (!showUserMenu) {
      setEditName(profile?.name || '');
      setEditHouseholdName(profile?.householdName || '');
      setEditCity(profile?.city || '');
      setEditCurrency(profile?.currency || 'INR (₹)');
      setEditError(null);
      setIsEditing(true); // Open directly in editable mode per user request
      setSaveSuccess(false);
      setShowUserMenu(true);
    } else {
      setShowUserMenu(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    const validation = validateProfileInput(editName);
    if (!validation.valid) {
      setEditError(validation.error || 'Please provide a valid name');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveProfile({
        name: editName,
        householdName: editHouseholdName,
        city: editCity,
        currency: editCurrency,
      });

      if (res.success && res.profile) {
        onUpdateProfile?.(res.profile);
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsEditing(false);
        }, 900);
      } else {
        setEditError(res.error || 'Failed to save profile');
      }
    } catch (err: any) {
      setEditError(err?.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <header
      id="top-app-bar"
      className="flex justify-between items-center w-full px-4 md:px-8 py-3.5 bg-white border-b border-[#e2e8f0] shadow-sm sticky top-0 z-30"
    >
      {/* Mobile brand & Logo */}
      <div
        onClick={() => setActiveTab('landing')}
        className="md:hidden flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
        title="HomeOps AI Hub"
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
        {/* Feature Overview Trigger */}
        <button
          id="btn-goto-landing"
          onClick={() => setActiveTab('landing')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0F766E] bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
          title="Product Overview & Features"
        >
          <span className="material-symbols-outlined text-[16px]">explore</span>
          <span>Overview</span>
        </button>

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
          type="button"
          aria-label="Open AI Assistant"
          className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center ${
            activeTab === 'assistant'
              ? 'bg-[#CCFBF1] text-[#0F766E] ring-2 ring-[#0F766E]/20 shadow-xs'
              : 'text-gray-600 hover:text-[#0F766E] hover:bg-[#f1f5f9] active:scale-95'
          }`}
          title="HomeOps AI Assistant"
        >
          <Bot className="w-5 h-5 pointer-events-none" />
        </button>

        {/* User / Household Profile Pill */}
        <div className="relative">
          <button
            id="btn-user-profile"
            onClick={handleToggleMenu}
            title="User Profile & Household Settings — Click to view and edit details"
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 border rounded-full transition-all bg-white cursor-pointer group shadow-2xs ${
              showUserMenu
                ? 'border-[#0F766E] ring-2 ring-[#0F766E]/15 bg-[#F0FDFA]/40'
                : 'border-[#e2e8f0] hover:border-[#0F766E]/50 hover:bg-[#f8fafc]'
            }`}
          >
            <span className="relative flex items-center justify-center">
              <span className="w-6 h-6 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center text-[11px] font-bold group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
            </span>
            <span className="text-xs font-semibold text-[#0F172A] hidden sm:inline max-w-[120px] truncate group-hover:text-[#0F766E] transition-colors">
              {displayName}
            </span>
            <span className="material-symbols-outlined text-gray-400 group-hover:text-[#0F766E] text-[16px] transition-transform duration-150">
              {showUserMenu ? 'expand_less' : 'arrow_drop_down'}
            </span>
          </button>

          {/* Backdrop for easy closing */}
          {showUserMenu && (
            <div
              className="fixed inset-0 z-40 bg-black/5"
              onClick={() => {
                setShowUserMenu(false);
                setIsEditing(false);
              }}
            />
          )}

          {showUserMenu && (
            <div
              id="user-dropdown-menu"
              className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] py-3 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Header / Current Profile Details */}
              <div className="px-4 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F766E] to-[#00504a] text-white flex items-center justify-center text-base font-bold shadow-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A] leading-tight flex items-center gap-1.5">
                        <span>{displayName}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{householdName}</p>
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      id="btn-quick-edit-profile-icon"
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-[#0F766E] hover:bg-[#F0FDFA] rounded-lg transition-colors cursor-pointer"
                      title="Edit User Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {saveSuccess && (
                  <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>User details updated successfully!</span>
                  </div>
                )}
              </div>

              {/* Editable Form OR Readonly Summary */}
              <div className="px-4 py-3">
                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Edit Profile Details
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditError(null);
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {editError && (
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                        {editError}
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Your Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="input-edit-user-name"
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. Alex"
                        autoFocus
                        className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-hidden transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Household Name
                      </label>
                      <input
                        id="input-edit-household-name"
                        type="text"
                        value={editHouseholdName}
                        onChange={(e) => setEditHouseholdName(e.target.value)}
                        placeholder="e.g. Maple Cottage"
                        className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-hidden transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          City / Region
                        </label>
                        <input
                          id="input-edit-city"
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="e.g. San Francisco"
                          className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-hidden transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Currency
                        </label>
                        <select
                          id="select-edit-currency"
                          value={editCurrency}
                          onChange={(e) => setEditCurrency(e.target.value)}
                          className="w-full px-2 py-1.5 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-hidden transition-all"
                        >
                          <option value="USD ($)">USD ($)</option>
                          <option value="INR (₹)">INR (₹)</option>
                          <option value="EUR (€)">EUR (€)</option>
                          <option value="GBP (£)">GBP (£)</option>
                          <option value="CAD ($)">CAD ($)</option>
                          <option value="AUD ($)">AUD ($)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        id="btn-cancel-edit-profile"
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditError(null);
                        }}
                        className="flex-1 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="btn-save-user-details"
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 py-1.5 bg-[#0F766E] hover:bg-[#115E59] active:scale-[0.98] text-white font-semibold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Save Details'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="bg-[#F8FAFC] rounded-xl p-3 border border-gray-200/80 space-y-1.5">
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-500 flex items-center gap-1.5 text-[11px]">
                          <User className="w-3.5 h-3.5 text-gray-400" /> User Name
                        </span>
                        <span className="font-semibold text-gray-800">{displayName}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-500 flex items-center gap-1.5 text-[11px]">
                          <Home className="w-3.5 h-3.5 text-gray-400" /> Household
                        </span>
                        <span className="font-semibold text-gray-800">{householdName}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-500 flex items-center gap-1.5 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" /> City
                        </span>
                        <span className="font-medium text-gray-700">{profile?.city || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-500 flex items-center gap-1.5 text-[11px]">
                          <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Currency
                        </span>
                        <span className="font-medium text-gray-700">{profile?.currency || 'INR (₹)'}</span>
                      </div>
                    </div>

                    <button
                      id="btn-edit-user-details"
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="w-full mt-2 py-2 px-3 bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] font-semibold text-xs rounded-xl border border-[#99efe5] flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit User Details</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Navigation Links */}
              <div className="pt-2 border-t border-gray-100 px-2">
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setShowUserMenu(false);
                    setIsEditing(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-[#f8fafc] rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-gray-400">home</span> Dashboard
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowUserMenu(false);
                    setIsEditing(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-[#f8fafc] rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-gray-400">settings</span> Full Settings &amp; Data
                </button>
                <button
                  onClick={() => {
                    setActiveTab('landing');
                    setShowUserMenu(false);
                    setIsEditing(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-[#f8fafc] rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-gray-400">explore</span> Feature Overview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
