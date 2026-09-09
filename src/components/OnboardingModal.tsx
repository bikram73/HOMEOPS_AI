import React, { useState } from 'react';
import { UserProfile, HouseholdMember } from '../types';
import { saveProfile, setOnboardingCompleted, validateProfileInput } from '../utils/profileStore';
import { Sparkles, Home, CheckCircle2, User, MapPin, DollarSign, Users, X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Form inputs
  const [name, setName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('INR (₹)');
  const [notificationPref, setNotificationPref] = useState<'dashboard' | 'telegram' | 'both'>('dashboard');
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Family member');
  const [showAddMember, setShowAddMember] = useState(false);

  // Error feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const newMember: HouseholdMember = {
      id: `member-${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole || 'Family member',
    };
    setMembers((prev) => [...prev, newMember]);
    setNewMemberName('');
    setShowAddMember(false);
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateProfileInput(name);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Please enter a valid name');
      return;
    }

    setStep(2);
  };

  const handleFinish = async () => {
    const res = await saveProfile({
      name: name.trim(),
      householdName: householdName.trim() || (name.trim() ? `${name.trim()}'s Home` : 'My Home'),
      city: city.trim() || undefined,
      currency,
      notificationPref,
      members,
    });

    if (res.success && res.profile) {
      setOnboardingCompleted(true);
      onComplete(res.profile);
    } else {
      setErrorMessage(res.error || 'Failed to save household profile');
      setStep(1);
    }
  };

  return (
    <div
      id="onboarding-modal-overlay"
      className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div
        id="onboarding-container"
        className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#e2e8f0] space-y-6 relative overflow-hidden"
      >
        {/* Header & Step Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E]">
              <Home className="w-4 h-4" />
            </span>
            <div>
              <span className="text-sm font-semibold text-[#0F172A] block leading-tight">
                HomeOps AI Setup
              </span>
              <span className="text-[11px] text-gray-500">
                {step === 1 ? 'Step 1 of 2: Household Profile' : 'Step 2 of 2: Confirmation'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-[#0F766E]' : 'bg-gray-200'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-[#0F766E]' : 'bg-gray-200'}`}></span>
            </div>
            {onClose && (
              <button
                id="btn-close-onboarding"
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Close and explore demo"
                aria-label="Close setup"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* STEP 1: PERSONALIZATION FORM */}
        {step === 1 && (
          <form
            id="onboarding-step-1-form"
            onSubmit={handleProfileSubmit}
            className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200 max-h-[72vh] overflow-y-auto pr-1"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0FDFA] text-[#0F766E] text-xs font-semibold border border-[#CCFBF1]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Personalize Your Home</span>
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
                Let's set up your HomeOps
              </h2>
              <p className="text-xs text-gray-500">
                Your records are stored securely in your browser's local database. Only your name is required.
              </p>
            </div>

            {errorMessage && (
              <div
                id="onboarding-error-banner"
                className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* User Name (Required) */}
            <div className="space-y-1.5">
              <label htmlFor="onboarding-user-name" className="block text-xs font-bold text-gray-700">
                What should HomeOps call you? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="onboarding-user-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. Bikram"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-[#0F172A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 focus:border-[#0F766E]"
                />
              </div>
            </div>

            {/* Household Name (Optional) */}
            <div className="space-y-1.5">
              <label htmlFor="onboarding-home-name" className="block text-xs font-semibold text-gray-700">
                Give your home a name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Home className="w-4 h-4" />
                </span>
                <input
                  id="onboarding-home-name"
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder={name ? `${name}'s Home` : 'e.g. Manna Home'}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-[#0F172A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 focus:border-[#0F766E]"
                />
              </div>
            </div>

            {/* City & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="onboarding-city" className="block text-xs font-semibold text-gray-700">
                  Where is your home? <span className="text-gray-400 font-normal">(city)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    id="onboarding-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-[#0F172A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="onboarding-currency" className="block text-xs font-semibold text-gray-700">
                  Currency for bills &amp; shopping
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <select
                    id="onboarding-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 focus:border-[#0F766E]"
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

            {/* Notification Preference */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-gray-700">
                How would you like reminders handled?
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNotificationPref('dashboard')}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all text-center cursor-pointer ${
                    notificationPref === 'dashboard'
                      ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E] font-bold shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Dashboard only
                </button>
                <button
                  type="button"
                  onClick={() => setNotificationPref('telegram')}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all text-center cursor-pointer ${
                    notificationPref === 'telegram'
                      ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E] font-bold shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Telegram
                </button>
                <button
                  type="button"
                  onClick={() => setNotificationPref('both')}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all text-center cursor-pointer ${
                    notificationPref === 'both'
                      ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E] font-bold shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Both
                </button>
              </div>
            </div>

            {/* Household Members (Optional) */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span>Household Members (Optional)</span>
                </label>
                {!showAddMember && (
                  <button
                    type="button"
                    onClick={() => setShowAddMember(true)}
                    className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
                  >
                    + Add member
                  </button>
                )}
              </div>

              {members.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      <span>{m.name} ({m.role})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {showAddMember && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Name (e.g. Mom)"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="px-2 py-1.5 bg-white border border-gray-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Partner, Parent)"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="px-2 py-1.5 bg-white border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="px-2 py-1 text-xs text-gray-500 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="px-3 py-1 bg-[#0F766E] text-white text-xs font-semibold rounded cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Explore Demo First
                </button>
              ) : (
                <span />
              )}
              <button
                id="onboarding-continue-btn"
                type="submit"
                className="py-2.5 px-6 bg-[#0F766E] hover:bg-[#115E59] active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer"
              >
                Continue &rarr;
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: READY & COMPLETE */}
        {step === 2 && (
          <div id="onboarding-step-2" className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center mx-auto border border-[#CCFBF1] shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                You're all set, {name}!
              </h2>
              <p className="text-sm text-gray-600">
                HomeOps AI is ready to manage your household operations with local browser persistence.
              </p>
            </div>

            {/* Profile summary card */}
            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-gray-200 text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Home Name</span>
                <span className="font-semibold text-gray-800">
                  {householdName.trim() || `${name}'s Home`}
                </span>
              </div>
              {city.trim() && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Location</span>
                  <span className="font-semibold text-gray-800">{city.trim()}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Currency</span>
                <span className="font-semibold text-gray-800">{currency}</span>
              </div>
              {members.length > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Household Members</span>
                  <span className="font-semibold text-gray-800">
                    {members.map((m) => m.name).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Storage</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Local IndexedDB (Private &amp; Offline-Ready)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                &larr; Back to Edit
              </button>
              <button
                id="onboarding-open-dashboard-btn"
                onClick={handleFinish}
                className="py-3 px-6 bg-[#0F766E] hover:bg-[#115E59] active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open Dashboard</span>
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

