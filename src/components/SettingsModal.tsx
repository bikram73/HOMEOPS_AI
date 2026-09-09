import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { Download, Upload, Trash2, AlertTriangle, ShieldCheck, Check, User, Home, MapPin, DollarSign } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile | null;
  onUpdateProfile?: (updated: UserProfile) => void;
  onExportData?: () => void;
  onImportData?: (jsonString: string) => Promise<{ success: boolean; error?: string }>;
  onClearData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onExportData,
  onImportData,
  onClearData,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editHouseholdName, setEditHouseholdName] = useState(profile?.householdName || '');
  const [editCity, setEditCity] = useState(profile?.city || '');
  const [editCurrency, setEditCurrency] = useState(profile?.currency || 'INR (₹)');

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    if (!editName.trim()) return;
    const updated: UserProfile = {
      ...(profile || ({} as UserProfile)),
      id: profile?.id || `profile-${Date.now()}`,
      name: editName.trim(),
      householdName: editHouseholdName.trim() || `${editName.trim()}'s Home`,
      city: editCity.trim() || undefined,
      currency: editCurrency,
      notificationPref: profile?.notificationPref || 'dashboard',
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateProfile?.(updated);
    setIsEditingProfile(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      if (onImportData) {
        const res = await onImportData(text);
        if (res.success) {
          setImportStatus({ type: 'success', message: 'Household data restored successfully!' });
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1500);
        } else {
          setImportStatus({ type: 'error', message: res.error || 'Failed to import backup' });
        }
      }
    } catch {
      setImportStatus({ type: 'error', message: 'Could not read file' });
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div
        id="settings-modal-container"
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#0F172A] text-[24px]">settings</span>
            <h3 className="text-xl font-bold text-[#0F172A]">Home Settings &amp; Data</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {importStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {importStatus.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{importStatus.message}</span>
          </div>
        )}

        {/* Profile Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Household Profile</h4>
            {!isEditingProfile ? (
              <button
                onClick={() => {
                  setEditName(profile?.name || '');
                  setEditHouseholdName(profile?.householdName || '');
                  setEditCity(profile?.city || '');
                  setEditCurrency(profile?.currency || 'INR (₹)');
                  setIsEditingProfile(true);
                }}
                className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
              >
                Edit Details
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="text-xs font-semibold text-[#0F766E] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            )}
          </div>

          {!isEditingProfile ? (
            <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" /> User Name
                </span>
                <span className="font-semibold text-gray-800">{profile?.name || 'Bikram'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-gray-400" /> Household
                </span>
                <span className="font-semibold text-gray-800">{profile?.householdName || 'My Home'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> City
                </span>
                <span className="font-semibold text-gray-800">{profile?.city || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" /> Currency
                </span>
                <span className="font-semibold text-gray-800">{profile?.currency || 'INR (₹)'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#0F766E]/30 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Home Name</label>
                <input
                  type="text"
                  value={editHouseholdName}
                  onChange={(e) => setEditHouseholdName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Currency</label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Automation Settings */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Automation &amp; Alerts</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <div>
                <p className="font-semibold text-[#0F172A]">AI Smart Automation</p>
                <p className="text-gray-500 text-[11px]">Predictive restocking &amp; utility alerts</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-[#0F766E] rounded accent-[#0F766E]"
              />
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <div>
                <p className="font-semibold text-[#0F172A]">Electricity Late Fee Protection</p>
                <p className="text-gray-500 text-[11px]">Remind 24h before bill due date</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-[#0F766E] rounded accent-[#0F766E]"
              />
            </div>
          </div>
        </div>

        {/* Data & Privacy Section (Section 15 & 16) */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data &amp; Privacy</h4>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your household data is preserved locally in your browser using <strong>IndexedDB</strong>.
            No external database or cookies are used for household history.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              id="settings-export-btn"
              onClick={onExportData}
              className="px-3.5 py-2.5 bg-[#F8FAFC] hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#0F766E]" />
              <span>Export Household Data</span>
            </button>

            <button
              id="settings-import-btn"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2.5 bg-[#F8FAFC] hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#0F766E]" />
              <span>Import Data</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="pt-2">
            <button
              id="settings-clear-data-btn"
              onClick={() => setConfirmClearOpen(true)}
              className="w-full px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Data</span>
            </button>
          </div>
        </div>

        {/* Confirmation Modal for Clear Data */}
        {confirmClearOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-100">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-red-200 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-gray-900">Are you sure?</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  This will permanently remove your locally stored HomeOps household data, tasks, and profile from this browser.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => setConfirmClearOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-clear-data-btn"
                  onClick={() => {
                    setConfirmClearOpen(false);
                    onClearData?.();
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#115E59] transition-colors cursor-pointer"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-5">
        <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#0F172A] text-[24px]">help</span>
            <h3 className="text-xl font-bold text-[#0F172A]">HomeOps AI Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-3.5 text-sm text-gray-600">
          <div className="p-3 bg-[#F0FDFA] rounded-xl border-l-3 border-[#0F766E]">
            <p className="font-bold text-[#0F172A] text-xs uppercase mb-1">
              ✨ Core Capabilities
            </p>
            <p className="text-xs text-gray-700">
              HomeOps AI tracks household chores, automated bill deadlines, pantry inventory levels,
              and maintenance schedules all in a unified operational console with local browser persistence.
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="font-semibold text-[#0F172A] text-xs mb-1">💡 Quick Shortcuts</p>
            <ul className="text-xs space-y-1 list-disc pl-4 text-gray-600">
              <li>Use the top device switcher to preview desktop or mobile interface.</li>
              <li>Ask HomeOps AI in the assistant tab for immediate prioritized recommendations.</li>
              <li>Tap inventory cards to quickly record items consumed or restocked.</li>
              <li>Export and import your household backups anytime via Settings.</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0f172a] text-white rounded-lg text-sm font-semibold hover:bg-[#1e293b] cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
