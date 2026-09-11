import React from 'react';
import { UserProfile, TaskItem, InventoryItem, ShoppingItem, BillItem } from '../types';
import { Sparkles, CheckCircle2, CreditCard, PackageCheck, Wrench, TrendingUp } from 'lucide-react';

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
  // Overall / All-Time Progress calculations since user started
  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 100;

  const totalBills = bills.length;
  const paidBillsCount = bills.filter((b) => b.paidThisMonth || b.dueCategory === 'Paid').length;
  const unpaidBillsCount = bills.filter((b) => !b.paidThisMonth && b.dueCategory !== 'Paid').length;
  const billsSettledRate = totalBills > 0 ? Math.round((paidBillsCount / totalBills) * 100) : 100;

  const totalInventory = inventory.length;
  const lowStockCount = inventory.filter((i) => i.availability <= 30).length;
  const healthyStockCount = inventory.filter((i) => i.availability > 30).length;
  const stockHealthyRate = totalInventory > 0 ? Math.round((healthyStockCount / totalInventory) * 100) : 100;

  const totalMaintenance = maintenance.length;
  const optimalMaintenanceCount = maintenance.filter((m) => m.status === 'Optimal' || m.status === 'completed').length;
  const pendingMaintenanceCount = maintenance.filter((m) => m.status === 'Overdue' || m.status === 'Due Soon').length;

  const totalAccomplishments = completedTasksCount + paidBillsCount + optimalMaintenanceCount;

  // Determine user start date / active duration
  const userCreatedAt = profile?.createdAt ? new Date(profile.createdAt) : null;
  const hasValidCreatedAt = userCreatedAt && !isNaN(userCreatedAt.getTime());
  const startDateStr = hasValidCreatedAt
    ? userCreatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';

  const daysActive = hasValidCreatedAt
    ? Math.max(1, Math.floor((Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

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
              <span>{homeName} Overall Progress</span>
              <span className="text-xl sm:text-2xl inline-block" role="img" aria-label="Home">
                🏡
              </span>
            </h2>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
              {userName}
            </span>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Started {startDateStr} • Day {daysActive}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Overall household accomplishments since you started tracking: completed tasks, settled accounts, and maintained inventory.
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

      {/* Status Summary: Overall Accomplishments Since Started */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        {/* 1. All-time Tasks Accomplished */}
        <div className="bg-white p-3 rounded-xl border border-gray-200/80 flex items-center gap-2.5 hover:border-emerald-200 transition-colors shadow-2xs">
          <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <p className="text-base font-bold text-[#0F172A] leading-tight">{completedTasksCount}</p>
              <span className="text-[11px] text-gray-400 font-medium">/ {totalTasks} done</span>
            </div>
            <p className="text-[11px] text-gray-500 truncate font-medium">Tasks Accomplished</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded">
              {taskCompletionRate}% all-time ({pendingTasksCount} pending)
            </span>
          </div>
        </div>

        {/* 2. Bills Settled */}
        <div className="bg-white p-3 rounded-xl border border-gray-200/80 flex items-center gap-2.5 hover:border-blue-200 transition-colors shadow-2xs">
          <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <p className="text-base font-bold text-[#0F172A] leading-tight">{paidBillsCount}</p>
              <span className="text-[11px] text-gray-400 font-medium">/ {totalBills} paid</span>
            </div>
            <p className="text-[11px] text-gray-500 truncate font-medium">Bills Settled</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700 bg-blue-50 rounded">
              {billsSettledRate}% on track ({unpaidBillsCount} upcoming)
            </span>
          </div>
        </div>

        {/* 3. Supplies Kept Stocked */}
        <div className="bg-white p-3 rounded-xl border border-gray-200/80 flex items-center gap-2.5 hover:border-teal-200 transition-colors shadow-2xs">
          <span className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <PackageCheck className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <p className="text-base font-bold text-[#0F172A] leading-tight">{healthyStockCount}</p>
              <span className="text-[11px] text-gray-400 font-medium">/ {totalInventory} items</span>
            </div>
            <p className="text-[11px] text-gray-500 truncate font-medium">Supplies Stocked</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-semibold text-teal-700 bg-teal-50 rounded">
              {stockHealthyRate}% optimal ({lowStockCount} low)
            </span>
          </div>
        </div>

        {/* 4. Routines Maintained */}
        <div className="bg-white p-3 rounded-xl border border-gray-200/80 flex items-center gap-2.5 hover:border-purple-200 transition-colors shadow-2xs">
          <span className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Wrench className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <p className="text-base font-bold text-[#0F172A] leading-tight">{optimalMaintenanceCount}</p>
              <span className="text-[11px] text-gray-400 font-medium">/ {totalMaintenance} checks</span>
            </div>
            <p className="text-[11px] text-gray-500 truncate font-medium">Routines Maintained</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-semibold text-purple-700 bg-purple-50 rounded">
              {pendingMaintenanceCount === 0 ? 'All systems optimal' : `${pendingMaintenanceCount} need check`}
            </span>
          </div>
        </div>

        {/* 5. Tracking Journey */}
        <div className="bg-white p-3 rounded-xl border border-gray-200/80 flex items-center gap-2.5 hover:border-indigo-200 transition-colors shadow-2xs col-span-2 sm:col-span-1">
          <span className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <p className="text-base font-bold text-[#0F172A] leading-tight">{daysActive}d</p>
              <span className="text-[11px] text-gray-400 font-medium">active</span>
            </div>
            <p className="text-[11px] text-gray-500 truncate font-medium">Since {startDateStr}</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700 bg-indigo-50 rounded">
              {totalAccomplishments} total done all-time
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
