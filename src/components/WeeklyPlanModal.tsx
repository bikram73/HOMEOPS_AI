import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar, Check, RefreshCw, X, Sparkles } from 'lucide-react';

interface WeeklyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyPlanModal: React.FC<WeeklyPlanModalProps> = ({ isOpen, onClose }) => {
  const [plan, setPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .getWeeklyPlan()
        .then((res) => setPlan(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#131b2e] text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#006a63] text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#99efe5]" />
                  <span className="text-xs uppercase font-bold text-[#99efe5]">
                    Household Synchronization
                  </span>
                </div>
                <h3 className="text-xl font-bold">Weekly Household Operating Plan</h3>
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

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin text-[#006a63]" />
              <p className="text-sm font-medium">Orchestrating 7-day household calendar...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plan.map((dayPlan, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-gray-200 hover:border-[#006a63] transition-colors bg-gray-50/60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#0F172A]">
                      {dayPlan.day}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#99efe5]/60 text-[#006f67]">
                      {dayPlan.focus}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {dayPlan.tasks.map((task: string, tIdx: number) => (
                      <li key={tIdx} className="text-xs text-gray-700 flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
