import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PageTab } from '../types';
import { Sun, AlertTriangle, CheckSquare, ShoppingCart, Wrench, ArrowRight, X, Sparkles } from 'lucide-react';
import { getTimeGreeting } from '../utils/timeGreeting';

interface BriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: PageTab) => void;
}

export const BriefingModal: React.FC<BriefingModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const timeInfo = getTimeGreeting();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .getBriefing()
        .then((res) => setBriefing(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#006a63] to-[#00504a] text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-xs text-xl">
                {timeInfo.emoji}
              </div>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span>{timeInfo.greeting}</span>
                  <span className="text-lg">👋</span>
                </h3>
                <p className="text-xs text-[#99efe5] font-medium">{timeInfo.label} Home Operations Briefing</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Compiling daily briefing...</div>
          ) : (
            <>
              {/* Urgent Item Banner */}
              {briefing?.urgentItems?.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{briefing.urgentCount} Urgent Item(s) Requiring Immediate Attention</span>
                  </div>
                  <ul className="space-y-1">
                    {briefing.urgentItems.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm font-semibold text-rose-900">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grid of Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tasks */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <CheckSquare className="w-4 h-4 text-[#006a63]" />
                    <span>Pending Tasks</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {briefing?.pendingTasks?.slice(0, 3).map((t: string, idx: number) => (
                      <li key={idx} className="truncate">{t}</li>
                    ))}
                  </ul>
                </div>

                {/* Shopping */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <ShoppingCart className="w-4 h-4 text-[#006a63]" />
                    <span>Shopping Queue</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {briefing?.shoppingItems?.slice(0, 3).map((s: string, idx: number) => (
                      <li key={idx} className="truncate">{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Maintenance */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <Wrench className="w-4 h-4 text-[#006a63]" />
                    <span>Maintenance Status</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {briefing?.maintenanceAlerts?.slice(0, 2).map((m: string, idx: number) => (
                      <li key={idx} className="truncate">{m}</li>
                    ))}
                  </ul>
                </div>

                {/* Low Stock */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Inventory Warnings</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {briefing?.lowInventoryAlerts?.slice(0, 2).map((inv: string, idx: number) => (
                      <li key={idx} className="truncate">{inv}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended First Action */}
              <div className="p-4 rounded-xl bg-[#F0FDFA] border-l-4 border-[#006a63]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#006a63]">
                  AI Recommended First Step
                </span>
                <p className="text-sm font-semibold text-[#0F172A] mt-1">
                  {briefing?.recommendedFirstAction}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('tasks');
                  }}
                  className="bg-[#006a63] hover:bg-[#00504a] text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <span>Start Handling Tasks</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
