import React, { useState } from 'react';
import { PageTab, TaskItem, InventoryItem, ShoppingItem, BillItem, UserProfile } from '../types';
import { HERO_IMAGE_URL } from '../data/mockData';
import { Sparkles, Calendar, Zap, MessageSquare } from 'lucide-react';
import { ReturningUserGreeting } from './ReturningUserGreeting';

interface DashboardViewProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  inventory: InventoryItem[];
  shoppingItems?: ShoppingItem[];
  bills?: BillItem[];
  userProfile?: UserProfile | null;
  setActiveTab: (tab: PageTab) => void;
  onAddAllLowToShopping: () => void;
  onSelectTask: (task: TaskItem) => void;
  onOpenWhatNowModal?: () => void;
  onOpenBriefingModal?: () => void;
  onOpenWeeklyPlanModal?: () => void;
  onOpenCaspianModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  onToggleTask,
  inventory,
  shoppingItems = [],
  bills = [],
  userProfile,
  setActiveTab,
  onAddAllLowToShopping,
  onSelectTask,
  onOpenWhatNowModal,
  onOpenBriefingModal,
  onOpenWeeklyPlanModal,
  onOpenCaspianModal,
}) => {
  const [isAiCardDismissed, setIsAiCardDismissed] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Priority tasks filter
  const priorityTasks = tasks.slice(0, 4);
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const lowInventoryItems = inventory.filter((i) => i.availability <= 30);

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
          <div className="flex items-center gap-2">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight">
              Good morning{userProfile?.name ? `, ${userProfile.name}` : ''} 👋
            </h2>
            <button
              onClick={onOpenBriefingModal}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#99efe5]/60 text-[#006f67] hover:bg-[#99efe5] transition-colors flex items-center gap-1 cursor-pointer"
              title="Open Daily Home Briefing"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Daily Briefing</span>
            </button>
          </div>
          <p className="text-base md:text-lg text-gray-500 mt-1">
            {userProfile?.householdName ? `${userProfile.householdName} • ` : ''}Here's what needs your attention today across the household.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
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

      {/* Returning User Quick Status Overview */}
      <ReturningUserGreeting
        profile={userProfile || null}
        tasks={tasks}
        inventory={inventory}
        shoppingItems={shoppingItems}
        bills={bills}
        onOpenWhatNowModal={onOpenWhatNowModal || (() => {})}
        onOpenBriefingModal={onOpenBriefingModal || (() => {})}
      />

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* Pending Tasks */}
        <div
          id="card-stat-tasks"
          onClick={() => setActiveTab('tasks')}
          className="bg-white p-5 md:p-6 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] flex flex-col gap-2 hover:border-[#0f172a] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#006a63] text-[24px] group-hover:scale-110 transition-transform">
              assignment_late
            </span>
            <span className="bg-[#ffdad6] text-[#93000a] text-xs font-semibold px-2 py-0.5 rounded-full">
              3 High
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{pendingCount}</p>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Pending Tasks</p>
          </div>
        </div>

        {/* Low Stock */}
        <div
          id="card-stat-inventory"
          onClick={() => setActiveTab('inventory')}
          className="bg-white p-5 md:p-6 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] flex flex-col gap-2 hover:border-[#0f172a] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#188ace] text-[24px] group-hover:scale-110 transition-transform">
              inventory_2
            </span>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {lowInventoryItems.length} Warnings
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">
              {lowInventoryItems.length > 0 ? lowInventoryItems.length : 3}
            </p>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Low Stock Items</p>
          </div>
        </div>

        {/* Upcoming Bills */}
        <div
          id="card-stat-bills"
          onClick={() => setActiveTab('bills')}
          className="bg-white p-5 md:p-6 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] flex flex-col gap-2 hover:border-[#0f172a] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#565e74] text-[24px] group-hover:scale-110 transition-transform">
              receipt_long
            </span>
            <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              Due Tomorrow
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">2</p>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Upcoming Bills</p>
          </div>
        </div>

        {/* Maintenance */}
        <div
          id="card-stat-maintenance"
          onClick={() => setActiveTab('maintenance')}
          className="bg-white p-5 md:p-6 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] flex flex-col gap-2 hover:border-[#0f172a] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#006f67] text-[24px] group-hover:scale-110 transition-transform">
              build
            </span>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              HVAC Check
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">1</p>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Maintenance</p>
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
                  Pay electricity bill first. It's due tomorrow and late fees apply. You also have low
                  stock items (detergent, rice) that should be queued to today's shopping list.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    id="btn-ai-action-items"
                    onClick={handleActionItems}
                    className="bg-[#0F766E] hover:bg-[#115E59] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs"
                  >
                    Action Items
                  </button>
                  <button
                    id="btn-ai-dismiss"
                    onClick={() => setIsAiCardDismissed(true)}
                    className="bg-white border border-[#c6c6cd] text-[#191c1e] px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
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
              {priorityTasks.map((task) => (
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
              ))}
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
            <div className="space-y-4">
              {/* Detergent */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#0F172A]">Detergent</span>
                  <span className="text-[#ba1a1a] font-bold">5% (Critical)</span>
                </div>
                <div className="w-full bg-[#e0e3e5] rounded-full h-2 overflow-hidden">
                  <div className="bg-[#ba1a1a] h-2 rounded-full" style={{ width: '5%' }}></div>
                </div>
              </div>

              {/* Rice */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#0F172A]">Rice</span>
                  <span className="text-[#f59e0b] font-bold">15%</span>
                </div>
                <div className="w-full bg-[#e0e3e5] rounded-full h-2 overflow-hidden">
                  <div className="bg-[#f59e0b] h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>

              {/* Toothpaste */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#0F172A]">Toothpaste</span>
                  <span className="text-[#f59e0b] font-bold">20%</span>
                </div>
                <div className="w-full bg-[#e0e3e5] rounded-full h-2 overflow-hidden">
                  <div className="bg-[#f59e0b] h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>

            <button
              id="btn-add-all-to-list"
              onClick={handleAddAllClick}
              className="w-full mt-6 py-2.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg text-xs md:text-sm font-semibold text-[#0F172A] transition-colors"
            >
              Add All to List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
