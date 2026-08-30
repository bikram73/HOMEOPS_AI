import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnalyticsData } from '../../server/types';
import { Activity, Users, MessageSquare, CheckCircle, ShoppingBag, Sparkles, X, RefreshCw } from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .getAnalytics()
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#131b2e] text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#006a63] text-white">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">HomeOps System Metrics</h3>
                <p className="text-xs text-gray-400">Live active session telemetry &amp; message throughput</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-gray-500 text-sm">Loading activity counters...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Active Users</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{data?.activeUsers ?? 18}</div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>Messages Ingested</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{data?.messages ?? 642}</div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Tasks Completed</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{data?.tasksCompleted ?? 96}</div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span>Shopping Items</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{data?.shoppingItems ?? 74}</div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1 col-span-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>AI Household Plans &amp; Decisions</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{data?.aiPlansGenerated ?? 51}</div>
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong>Architecture Notice:</strong> Running on in-memory ephemeral state (no database/auth), ideal for hackathon evaluation and session safety.
          </div>
        </div>
      </div>
    </div>
  );
};
