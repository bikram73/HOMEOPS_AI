import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PageTab } from '../types';
import { Sparkles, Clock, ArrowRight, CheckCircle, Zap, X, RefreshCw } from 'lucide-react';

interface WhatShouldIDoNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: PageTab) => void;
  onRefreshState: () => void;
}

export const WhatShouldIDoNowModal: React.FC<WhatShouldIDoNowModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onRefreshState,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [actionDone, setActionDone] = useState(false);

  const fetchDecision = async () => {
    setLoading(true);
    setActionDone(false);
    try {
      const res = await api.getWhatShouldIDoNow();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDecision();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecutePrimary = async () => {
    if (data?.urgentBill) {
      await api.sendAgentMessage(`Mark ${data.urgentBill} bill as paid`);
    } else if (data?.criticalStock) {
      await api.sendAgentMessage(`Add ${data.criticalStock} to shopping list`);
    } else if (data?.overdueMaintenance) {
      await api.sendAgentMessage(`Mark ${data.overdueMaintenance} as scheduled`);
    }
    setActionDone(true);
    onRefreshState();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#131b2e] text-white p-6 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#006a63] text-white">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#99efe5]">
                  Agentic Reasoning Engine
                </span>
                <h3 className="text-xl font-bold text-white">What Should I Do Right Now?</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#006a63]/30 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin text-[#006a63]" />
              <p className="text-sm font-medium">Evaluating tasks, deadlines, inventory &amp; maintenance...</p>
            </div>
          ) : (
            <>
              {/* Primary Recommendation Card */}
              <div className="p-5 rounded-xl bg-[#F0FDFA] border-l-4 border-[#006a63] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#99efe5] text-[#006f67]">
                    Top Priority Action
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#006a63]" />
                    <span>Est. {data?.estimatedTime || '15 mins'}</span>
                  </div>
                </div>

                <p className="text-base font-semibold text-[#0F172A] leading-snug">
                  {data?.primaryRecommendation}
                </p>

                {actionDone ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />
                    <span>Action executed and recorded into in-memory state!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleExecutePrimary}
                    className="w-full mt-2 bg-[#006a63] hover:bg-[#00504a] text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98"
                  >
                    <span>Execute Recommendation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Secondary Step */}
              {data?.secondaryAction && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Follow-Up Action</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {data.secondaryAction}
                  </p>
                </div>
              )}

              {/* Quick Navigation Shortcuts */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('tasks');
                  }}
                  className="p-2.5 text-center rounded-lg border border-gray-200 hover:border-[#006a63] hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-700"
                >
                  View Tasks
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('bills');
                  }}
                  className="p-2.5 text-center rounded-lg border border-gray-200 hover:border-[#006a63] hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-700"
                >
                  View Bills
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('shopping');
                  }}
                  className="p-2.5 text-center rounded-lg border border-gray-200 hover:border-[#006a63] hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-700"
                >
                  Shopping List
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
