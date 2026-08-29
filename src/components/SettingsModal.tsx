import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-6">
        <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#0F172A] text-[24px]">settings</span>
            <h3 className="text-xl font-bold text-[#0F172A]">Home Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <div>
              <p className="font-semibold text-[#0F172A]">Household Name</p>
              <p className="text-xs text-gray-500">Demo Home (San Francisco, CA)</p>
            </div>
            <span className="text-xs font-semibold text-[#0F766E] cursor-pointer hover:underline">
              Edit
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <div>
              <p className="font-semibold text-[#0F172A]">AI Smart Automation</p>
              <p className="text-xs text-gray-500">Predictive restocking & utility alerts</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-[#0F766E] rounded accent-[#0F766E]"
            />
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <div>
              <p className="font-semibold text-[#0F172A]">Electricity Late Fee Protection</p>
              <p className="text-xs text-gray-500">Remind 24h before bill due date</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-[#0F766E] rounded accent-[#0F766E]"
            />
          </div>

          <div className="flex justify-between items-center py-2">
            <div>
              <p className="font-semibold text-[#0F172A]">Temperature Units</p>
              <p className="text-xs text-gray-500">Currently Fahrenheit (°F)</p>
            </div>
            <select className="border border-gray-300 rounded-lg text-xs p-1.5">
              <option>Fahrenheit (°F)</option>
              <option>Celsius (°C)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#115E59] transition-colors"
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
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
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
              and maintenance schedules all in a unified operational console.
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="font-semibold text-[#0F172A] text-xs mb-1">💡 Quick Shortcuts</p>
            <ul className="text-xs space-y-1 list-disc pl-4 text-gray-600">
              <li>Use the top device switcher to preview desktop or mobile interface.</li>
              <li>Ask HomeOps AI in the assistant tab for immediate prioritized recommendations.</li>
              <li>Tap inventory cards to quickly record items consumed or restocked.</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0f172a] text-white rounded-lg text-sm font-semibold hover:bg-[#1e293b]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
