import React from 'react';
import { UserProfile, TaskItem, InventoryItem, ShoppingItem, BillItem } from '../types';
import { Sparkles, CheckCircle2, AlertTriangle, ShoppingCart, Calendar, Wrench } from 'lucide-react';

interface ReturningUserGreetingProps {
  profile: UserProfile | null;
  tasks: TaskItem[];
  inventory: InventoryItem[];
  shoppingItems: ShoppingItem[];
  bills: BillItem[];
  maintenance?: any[];
  onOpenWhatNowModal: () => void;
  onOpenBriefingModal: () => void;
}

export const ReturningUserGreeting: React.FC<ReturningUserGreetingProps> = ({
  profile,
  tasks,
  inventory,
  shoppingItems,
  bills,
  maintenance = [],
  onOpenWhatNowModal,
  onOpenBriefingModal,
}) => {
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const lowStockCount = inventory.filter((i) => i.availability <= 30).length;
  const pendingShoppingCount = shoppingItems.filter((s) => !s.checked).length;
  const unpaidBillsCount = bills.filter((b) => !b.paidThisMonth && b.dueCategory !== 'Paid').length;
  const pendingMaintenanceCount = maintenance.filter((m) => m.status !== 'completed').length || 1;

  const userName = profile?.name || 'Homeowner';
  const homeName = profile?.householdName || 'My Home';

  return (
    <div
      id="returning-user-banner"
      className="bg-gradient-to-br from-white to-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
              <span>{homeName} Overview</span>
              <span className="text-xl sm:text-2xl inline-block" role="img" aria-label="Home">
                🏡
              </span>
            </h2>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
              {userName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Household records loaded from your private browser storage. Here is your current status:
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="returning-what-now-btn"
            onClick={onOpenWhatNowModal}
            className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>What Should I Do Now?</span>
          </button>
          <button
            onClick={onOpenBriefingModal}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Briefing</span>
          </button>
        </div>
      </div>

      {/* Status Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#0F172A] leading-tight">{pendingTasksCount}</p>
            <p className="text-[11px] text-gray-500 truncate">pending tasks</p>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#0F172A] leading-tight">{lowStockCount}</p>
            <p className="text-[11px] text-gray-500 truncate">low-stock items</p>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#0F172A] leading-tight">{pendingShoppingCount}</p>
            <p className="text-[11px] text-gray-500 truncate">shopping items</p>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#0F172A] leading-tight">{unpaidBillsCount}</p>
            <p className="text-[11px] text-gray-500 truncate">upcoming bills</p>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 flex items-center gap-2.5 col-span-2 sm:col-span-1">
          <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#0F172A] leading-tight">{pendingMaintenanceCount}</p>
            <p className="text-[11px] text-gray-500 truncate">maintenance</p>
          </div>
        </div>
      </div>
    </div>
  );
};
