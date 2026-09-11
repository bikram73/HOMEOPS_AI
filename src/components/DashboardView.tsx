import React, { useState } from 'react';
import { PageTab, TaskItem, InventoryItem, ShoppingItem, BillItem, MaintenanceItem, UserProfile } from '../types';
import { HERO_IMAGE_URL } from '../data/mockData';
import { Sparkles, Calendar, Zap, MessageSquare, Trash2, RotateCcw } from 'lucide-react';
import { ReturningUserGreeting } from './ReturningUserGreeting';
import { getTimeGreeting } from '../utils/timeGreeting';
import { hasEnteredUserDetails } from '../utils/demoDataHelper';
import { getLocalDateString } from '../utils/activityStore';
import { isDateMatch } from './CalendarView';

interface DashboardViewProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  inventory: InventoryItem[];
  shoppingItems?: ShoppingItem[];
  bills?: BillItem[];
  maintenance?: MaintenanceItem[];
  userProfile?: UserProfile | null;
  setActiveTab: (tab: PageTab) => void;
  onAddAllLowToShopping: () => void;
  onSelectTask: (task: TaskItem) => void;
  onOpenWhatNowModal?: () => void;
  onOpenBriefingModal?: () => void;
  onOpenWeeklyPlanModal?: () => void;
  onOpenCaspianModal?: () => void;
  onClearAllDemoData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  onToggleTask,
  inventory,
  shoppingItems = [],
  bills = [],
  maintenance = [],
  userProfile,
  setActiveTab,
  onAddAllLowToShopping,
  onSelectTask,
  onOpenWhatNowModal,
  onOpenBriefingModal,
  onOpenWeeklyPlanModal,
  onOpenCaspianModal,
  onClearAllDemoData,
}) => {
  const [isAiCardDismissed, setIsAiCardDismissed] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const timeInfo = getTimeGreeting();
  const isReturningUser = hasEnteredUserDetails() && !!userProfile?.name;

  // Priority tasks filter
  const priorityTasks = tasks.slice(0, 4);
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const highPriorityCount = tasks.filter((t) => !t.completed && t.priority === 'High').length;
  const lowInventoryItems = inventory.filter((i) => i.availability <= 30);
  const upcomingBills = bills.filter((b) => !b.paidThisMonth && b.dueCategory !== 'Paid');
  const upcomingBillsCount = upcomingBills.length;
  const dueMaintenance = maintenance.filter((m) => m.status === 'Overdue' || m.status === 'Due Soon');
  const dueMaintenanceCount = dueMaintenance.length;

  // Current Day Calculations (for Element 2: Current Day Things)
  const todayDate = new Date();
  const todayStr = getLocalDateString(todayDate);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrowDate);
  const todayShortFormatted = todayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // 1. Current Day Tasks
  const todayTasks = tasks.filter(
    (t) => isDateMatch(t.dueDate, todayStr, todayStr, tomorrowStr) || t.date === todayStr || t.dueDate?.toLowerCase().includes('today')
  );
  const todayPendingTasks = todayTasks.filter((t) => !t.completed);
  const todayCompletedTasks = todayTasks.filter((t) => t.completed);

  // 2. Current Day Supplies & Urgent Needs
  const todayCriticalStock = inventory.filter((i) => i.availability <= 25);
  const todayShoppingNeeds = shoppingItems.filter(
    (s) => !s.checked && (isDateMatch(s.dueDate, todayStr, todayStr, tomorrowStr) || isDateMatch(s.date, todayStr, todayStr, tomorrowStr) || s.dueDate?.toLowerCase().includes('today'))
  );
  const todaySupplyAttentionCount = todayCriticalStock.length + todayShoppingNeeds.length;

  // 3. Current Day Bills & Dues
  const todayBillsDue = bills.filter(
    (b) => !b.paidThisMonth && (isDateMatch(b.dueDate, todayStr, todayStr, tomorrowStr) || b.dueCategory === 'Due Tomorrow' || b.dueDate?.toLowerCase().includes('today'))
  );
  const todayBillsPaid = bills.filter(
    (b) => b.paidThisMonth && (isDateMatch(b.date, todayStr, todayStr, tomorrowStr) || b.dueDate === todayStr)
  );

  // 4. Current Day Maintenance & Routines
  const todayMaintenanceDue = maintenance.filter(
    (m) => m.status === 'Overdue' || isDateMatch(m.nextDue, todayStr, todayStr, tomorrowStr) || m.nextDue?.toLowerCase().includes('today')
  );

  const handleActionItems = () => {
    setActiveTab('tasks');
  };

  const handleAddAllClick = () => {
    onAddAllLowToShopping();
    setActionSuccessMsg('Added low stock items to your Shopping List!');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1440px] mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed top-18 right-8 z-50 bg-[#0F766E] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-sm font-medium">{actionSuccessMsg}</span>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-white/80 hover:text-white ml-2"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Page Header with Action Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
              <span>{timeInfo.greeting}{userProfile?.name ? `, ${userProfile.name}` : ''}</span>
              <span className="text-2xl md:text-3xl inline-block" role="img" aria-label={timeInfo.label}>
                {timeInfo.emoji}
              </span>
            </h2>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${timeInfo.periodBadgeClass}`}
            >
              {timeInfo.label}
            </span>
            <button
              onClick={onOpenBriefingModal}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#99efe5]/60 text-[#006f67] hover:bg-[#99efe5] transition-colors flex items-center gap-1 cursor-pointer"
              title={`Open ${timeInfo.label} Home Briefing`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{timeInfo.label} Briefing</span>
            </button>
          </div>
          <p className="text-base md:text-lg text-gray-500 mt-1">
            {userProfile?.householdName ? `${userProfile.householdName} • ` : ''}{timeInfo.subtext}
          </p>
        </div>

        {/* Action Buttons Toolbar - Hidden per user instruction */}
        <div id="dashboard-header-action-toolbar" className="hidden">
          {/* What Should I Do Now Signature Trigger */}
          <button
            id="btn-what-should-i-do-now"
            onClick={onOpenWhatNowModal}
            className="bg-[#006a63] hover:bg-[#00504a] text-white px-4 py-2.5 rounded-lg font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow active:scale-98 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>What Should I Do Now?</span>
          </button>

          {/* Weekly Plan Trigger */}
          <button
            id="btn-weekly-plan"
            onClick={onOpenWeeklyPlanModal}
            className="bg-white hover:bg-gray-50 border border-[#e2e8f0] text-gray-700 px-3.5 py-2.5 rounded-lg font-semibold text-xs md:text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Weekly Plan</span>
          </button>

          {/* Caspian Telegram Demo Trigger */}
          <button
            id="btn-caspian-simulator"
            onClick={onOpenCaspianModal}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-lg font-semibold text-xs md:text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Caspian Channel</span>
          </button>

          <button
            id="btn-ask-homeops-hero"
            onClick={() => setActiveTab('assistant')}
            className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2.5 rounded-lg font-medium text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow active:scale-98 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span>Ask HomeOps</span>
          </button>
        </div>
      </div>

      {/* Returning User Quick Status Overview - ONLY rendered if user has saved details; removed for any new user */}
      {isReturningUser ? (
        <ReturningUserGreeting
          profile={userProfile || null}
          tasks={tasks}
          inventory={inventory}
          shoppingItems={shoppingItems}
          bills={bills}
          maintenance={maintenance}
          onOpenWhatNowModal={onOpenWhatNowModal || (() => {})}
          onOpenBriefingModal={onOpenBriefingModal || (() => {})}
        />
      ) : onClearAllDemoData ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E6F4F1] flex items-center justify-center text-[#0F766E]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">New User Setup</p>
              <p className="text-xs text-gray-500">
                Adding your own task, inventory, shopping item, bill, or maintenance automatically removes all sample data.
              </p>
            </div>
          </div>
          <button
            onClick={onClearAllDemoData}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Fresh (Clean Slate)</span>
          </button>
        </div>
      ) : null}

      {/* Quick Stats Row: Current Day Things (Focused Selector 2) */}
      <div id="card-stat-row-today" className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* Today's Tasks */}
        <div
          id="card-stat-tasks"
          onClick={() => setActiveTab('tasks')}
          className="bg-white p-5 md:p-6 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] flex flex-col gap-2 hover:border-[#0f172a] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#006a63] text-[24px] group-hover:scale-110 transition-transform">
              assignment_late
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                todayPendingTasks.length > 0
                  ? 'bg-amber-100 text-amber-900'
                  : todayCompletedTasks.length > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {todayPendingTasks.length > 0
                ? `${todayPendingTasks.length} Due Today`
                : todayCompletedTasks.length > 0
                ? 'All Done Today'
                : 'Clear Today'}
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{todayPendingTasks.length}</p>
            <p className="text-xs md:text-sm text-gray-900 font-semibold">Today's Tasks</p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              {todayCompletedTasks.length > 0
                ? `${todayCompletedTasks.length} completed today`
                : `${pendingCount} total pending`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#006a63] font-semibold mt-auto pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006a63] inline-block animate-pulse"></span>
            <span>Today • {todayShortFormatted}</span>
          </div>
        </div>

        {/* Today's Supplies */}
        <div
          id="card-stat-inventory"
          onClick={() => setActiveTab('inventory')}
          className="bg-white p-5 md:p-6 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] flex flex-col gap-2 hover:border-[#0f172a] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#188ace] text-[24px] group-hover:scale-110 transition-transform">
              inventory_2
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                todayCriticalStock.length > 0
                  ? 'bg-amber-100 text-amber-800'
                  : todayShoppingNeeds.length > 0
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {todayCriticalStock.length > 0
                ? `${todayCriticalStock.length} Low Today`
                : todayShoppingNeeds.length > 0
                ? `${todayShoppingNeeds.length} Buy Today`
                : 'Stock Healthy'}
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{todaySupplyAttentionCount}</p>
            <p className="text-xs md:text-sm text-gray-900 font-semibold">Today's Supplies</p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              {todayCriticalStock.length > 0
                ? `${todayCriticalStock.length} items need restock`
                : 'Pantry & household stock good'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#188ace] font-semibold mt-auto pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#188ace] inline-block"></span>
            <span>Today • {todayShortFormatted}</span>
          </div>
        </div>

        {/* Today's Bills */}
        <div
          id="card-stat-bills"
          onClick={() => setActiveTab('bills')}
          className="bg-white p-5 md:p-6 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] flex flex-col gap-2 hover:border-[#0f172a] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#565e74] text-[24px] group-hover:scale-110 transition-transform">
              receipt_long
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                todayBillsDue.length > 0
                  ? 'bg-rose-100 text-rose-800'
                  : todayBillsPaid.length > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {todayBillsDue.length > 0
                ? `${todayBillsDue.length} Due Soon`
                : todayBillsPaid.length > 0
                ? 'Paid Today'
                : 'No Dues Today'}
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{todayBillsDue.length}</p>
            <p className="text-xs md:text-sm text-gray-900 font-semibold">Today's Bills</p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              {todayBillsDue.length > 0
                ? 'Due today or tomorrow'
                : `${upcomingBillsCount} total upcoming this month`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#565e74] font-semibold mt-auto pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#565e74] inline-block"></span>
            <span>Today • {todayShortFormatted}</span>
          </div>
        </div>

        {/* Today's Maintenance */}
        <div
          id="card-stat-maintenance"
          onClick={() => setActiveTab('maintenance')}
          className="bg-white p-5 md:p-6 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] flex flex-col gap-2 hover:border-[#0f172a] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#006f67] text-[24px] group-hover:scale-110 transition-transform">
              build
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                todayMaintenanceDue.length > 0
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {todayMaintenanceDue.length > 0
                ? `${todayMaintenanceDue.length} Due Today`
                : 'All Normal Today'}
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{todayMaintenanceDue.length}</p>
            <p className="text-xs md:text-sm text-gray-900 font-semibold">Today's Routines</p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              {todayMaintenanceDue.length > 0
                ? 'Action needed for appliances'
                : 'Household systems on schedule'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#006f67] font-semibold mt-auto pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006f67] inline-block"></span>
            <span>Today • {todayShortFormatted}</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Focus Area (Left 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* AI Recommendation Card */}
          {!isAiCardDismissed && (
            <div
              id="ai-recommendation-banner"
              className="bg-[#F0FDFA] p-5 md:p-6 rounded-xl border-l-4 border-[#0F766E] shadow-[0_1px_3px_rgba(15,23,42,0.06)] flex gap-4 items-start"
            >
              <div className="bg-[#CCFBF1] p-2.5 rounded-full shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[#0F766E] text-[20px]">
                  auto_awesome
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-bold text-[#115E59]">
                    HomeOps Recommendation
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#99efe5] text-[#006f67]">
                    Autonomous Priority
                  </span>
                </div>
                <p className="text-sm text-[#134E4A] mt-1 leading-relaxed">
                  {upcomingBillsCount > 0
                    ? `Pay your upcoming bill (${bills.find((b) => !b.paidThisMonth)?.name || 'pending bill'}) to avoid late penalties.`
                    : lowInventoryItems.length > 0
                    ? `You have low stock items (${lowInventoryItems.slice(0, 2).map((i) => i.name).join(', ')}) that should be restocked.`
                    : pendingCount > 0
                    ? `Focus on your top priority task: "${priorityTasks[0]?.title || 'Household task'}".`
                    : 'Your household is completely up to date with 0 pending tasks, 0 low stock warnings, and 0 overdue bills. Add tasks, inventory, or bills to begin automated tracking.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    id="btn-ai-action-items"
                    onClick={handleActionItems}
                    className="bg-[#0F766E] hover:bg-[#115E59] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
                  >
                    {pendingCount > 0 ? 'Action Items' : 'Add First Task'}
                  </button>
                  <button
                    id="btn-ai-dismiss"
                    onClick={() => setIsAiCardDismissed(true)}
                    className="bg-white border border-[#c6c6cd] text-[#191c1e] px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Today's Priorities */}
          <div
            id="todays-priorities-card"
            className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden"
          >
            <div className="p-5 md:p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0F172A]">Today's Priorities</h3>
              <button
                id="btn-view-all-priorities"
                onClick={() => setActiveTab('tasks')}
                className="text-[#0F766E] text-sm font-semibold hover:underline"
              >
                View All
              </button>
            </div>
            <ul className="divide-y divide-[#e2e8f0]">
              {priorityTasks.length > 0 ? (
                priorityTasks.map((task) => (
                  <li
                    key={task.id}
                    id={`priority-item-${task.id}`}
                    onClick={() => {
                      onSelectTask(task);
                      setActiveTab('tasks');
                    }}
                    className="p-4 md:px-6 hover:bg-[#f8fafc] transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(task.id);
                        }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-[#0F766E] border-[#0F766E] text-white'
                            : 'border-[#76777d] group-hover:border-[#0F766E]'
                        }`}
                      >
                        {task.completed && (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        )}
                      </button>
                      <div>
                        <p
                          className={`text-sm font-semibold text-[#0F172A] ${
                            task.completed ? 'line-through text-gray-400' : ''
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500">{task.subtitle}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        task.priority === 'High'
                          ? 'bg-[#ffdad6] text-[#93000a]'
                          : task.priority === 'Medium'
                          ? 'bg-[#99efe5]/60 text-[#006f67]'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </li>
                ))
              ) : (
                <li className="p-8 text-center text-gray-500">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl mb-1">check_circle</span>
                  <p className="text-sm font-semibold text-gray-700">0 Pending Tasks</p>
                  <p className="text-xs text-gray-400 mt-0.5">All tasks are clear. Click below to add one.</p>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="mt-3 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
                  >
                    + Add New Task
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Featured Image / Living Room Card */}
          <div
            id="home-environment-card"
            className="rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06)] relative h-64 md:h-72 border border-[#e2e8f0] group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent z-10"></div>
            <img
              src={HERO_IMAGE_URL}
              alt="Calming modern living room interior with sunlight streaming through large windows."
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Home Environment Stable
                </h3>
              </div>
              <p className="text-sm text-white/90 font-medium">
                Temperature 72°F • Humidity 45% • Air Quality Excellent
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Panel (Right 1 col) */}
        <div className="flex flex-col gap-6">
          {/* Today's Briefing Timeline */}
          <div
            id="todays-briefing-card"
            className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[#0F172A]">Today's Briefing</h3>
              <button
                onClick={onOpenBriefingModal}
                className="text-xs text-[#0F766E] font-semibold hover:underline"
              >
                Expand
              </button>
            </div>
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:h-full before:w-0.5 before:bg-[#e2e8f0]">
              {/* Timeline Item 1 */}
              <div className="relative flex items-start gap-4">
                <div className="w-6 h-6 rounded-full border-2 border-white bg-[#0F766E] shadow-sm shrink-0 flex items-center justify-center z-10 mt-1">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                </div>
                <div className="flex-1 p-3.5 rounded-lg border border-[#0F766E]/30 bg-[#F0FDFA]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-[#0F766E]">09:00 AM</span>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-[#0F172A]">Morning Operations Review</p>
                </div>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative flex items-start gap-4">
                <div className="w-6 h-6 rounded-full border-2 border-white bg-[#e0e3e5] shadow-sm shrink-0 flex items-center justify-center z-10 mt-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                </div>
                <div className="flex-1 p-3.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-gray-500">01:00 PM</span>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-[#0F172A]">
                    Grocery Restock Window
                  </p>
                </div>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative flex items-start gap-4">
                <div className="w-6 h-6 rounded-full border-2 border-white bg-[#e0e3e5] shadow-sm shrink-0 flex items-center justify-center z-10 mt-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                </div>
                <div className="flex-1 p-3.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-gray-500">05:30 PM</span>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-[#0F172A]">
                    HVAC Tech Arrival Window
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Low Inventory Progress Card */}
          <div
            id="low-inventory-card"
            className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#0F172A]">Low Inventory</h3>
              <button
                id="btn-scan-inventory"
                onClick={() => setActiveTab('inventory')}
                className="text-[#0F766E] text-xs font-semibold hover:underline"
              >
                Scan
              </button>
            </div>
            {lowInventoryItems.length > 0 ? (
              <div className="space-y-4">
                {lowInventoryItems.slice(0, 3).map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-[#0F172A]">{item.name}</span>
                      <span className={item.availability <= 10 ? 'text-[#ba1a1a] font-bold' : 'text-[#f59e0b] font-bold'}>
                        {item.availability}% {item.availability <= 10 ? '(Critical)' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-[#e0e3e5] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${item.availability <= 10 ? 'bg-[#ba1a1a]' : 'bg-[#f59e0b]'}`}
                        style={{ width: `${Math.max(5, item.availability)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-gray-500">
                <span className="material-symbols-outlined text-emerald-600 text-3xl mb-1">inventory_2</span>
                <p className="text-xs font-semibold text-gray-700">0 Low Stock Items</p>
                <p className="text-[11px] text-gray-400 mt-0.5">All household inventory is stocked.</p>
              </div>
            )}

            {lowInventoryItems.length > 0 && (
              <button
                id="btn-add-all-to-list"
                onClick={handleAddAllClick}
                className="w-full mt-6 py-2.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg text-xs md:text-sm font-semibold text-[#0F172A] transition-colors cursor-pointer"
              >
                Add All to List
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
