import React from 'react';
import { PageTab, TaskItem, ActivityItem } from '../types';
import { LOGO_URL } from '../data/mockData';
import { getTimeGreeting } from '../utils/timeGreeting';

interface MobileDashboardViewProps {
  tasks: TaskItem[];
  activities: ActivityItem[];
  setActiveTab: (tab: PageTab) => void;
  pendingTasksCount: number;
}

export const MobileDashboardView: React.FC<MobileDashboardViewProps> = ({
  tasks,
  activities,
  setActiveTab,
  pendingTasksCount,
}) => {
  const timeInfo = getTimeGreeting();

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col pb-24 animate-in fade-in duration-200">
      {/* Mobile Top App Bar */}
      <header className="flex justify-between items-center w-full px-4 py-4 bg-[#f7f9fb] sticky top-0 z-40 border-b border-[#e2e8f0]/40">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_URL} alt="HomeOps Logo" className="w-8 h-8 rounded-lg object-contain bg-white shadow-xs p-1" />
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">HomeOps AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('No new notifications')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 flex flex-col gap-6">
        {/* Welcome & Quick Stats */}
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                <span>{timeInfo.greeting},</span>
                <span className="text-base" role="img" aria-label={timeInfo.label}>{timeInfo.emoji}</span>
              </p>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Demo Home</h2>
            </div>
            <div className="bg-[#99efe5] text-[#006f67] px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <span className="material-symbols-outlined text-[16px] fill-1">thermostat</span>
              72°F
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div
              onClick={() => setActiveTab('tasks')}
              className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col gap-1 cursor-pointer active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[#7c839b] mb-1 text-[22px]">
                assignment
              </span>
              <span className="text-2xl font-bold text-[#0F172A]">{pendingTasksCount || 3}</span>
              <span className="text-xs text-gray-500 font-medium">Pending Tasks</span>
            </div>

            <div
              onClick={() => setActiveTab('shopping')}
              className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col gap-1 cursor-pointer active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[#006a63] mb-1 text-[22px]">
                shopping_cart
              </span>
              <span className="text-2xl font-bold text-[#0F172A]">12</span>
              <span className="text-xs text-gray-500 font-medium">Items Needed</span>
            </div>
          </div>
        </section>

        {/* AI Priority Action */}
        <section>
          <div className="bg-[#F0FDFA] p-5 rounded-xl border-l-3 border-[#006a63] shadow-sm flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="material-symbols-outlined text-[#006a63] fill-1 text-[20px]">
                smart_toy
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#006a63]">
                AI Insight
              </h3>
            </div>
            <div>
              <h4 className="text-base font-bold text-[#0F172A] mb-1">
                High Electricity Bill Alert
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your current usage is trending 15% higher than last month. Consider adjusting the HVAC
                schedule.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('bills')}
              className="bg-[#006a63] hover:bg-[#00504a] text-white text-xs font-semibold py-2 px-4 rounded-lg self-start mt-1.5 shadow-xs transition-colors"
            >
              View Details
            </button>

            {/* Decorative Bolt Watermark */}
            <span className="material-symbols-outlined text-[110px] text-[#006a63]/5 absolute -right-4 -bottom-4 pointer-events-none">
              bolt
            </span>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-[#0F172A]">Recent Activity</h3>
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col divide-y divide-[#e2e8f0]">
            {activities.map((act) => (
              <div key={act.id} className="flex items-center gap-3.5 p-3.5 hover:bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0 text-gray-600">
                  <span className="material-symbols-outlined text-[20px]">{act.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#0F172A]">{act.title}</p>
                  <p className="text-xs text-gray-500 truncate">{act.subtitle}</p>
                </div>
                <span className="text-[11px] text-gray-400 font-medium shrink-0">{act.timeAgo}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2e8f0] flex justify-around items-center h-16 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab('home')}
          className="flex flex-col items-center justify-center w-full h-full text-[#0F172A] font-bold"
        >
          <span className="material-symbols-outlined text-[22px] mb-0.5 fill-1 text-[#006a63]">
            home
          </span>
          <span className="text-[10px] font-bold text-[#006a63]">Home</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-[#0F172A]"
        >
          <span className="material-symbols-outlined text-[22px] mb-0.5">assignment</span>
          <span className="text-[10px] font-medium">Tasks</span>
        </button>
        <button
          onClick={() => setActiveTab('shopping')}
          className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-[#0F172A]"
        >
          <span className="material-symbols-outlined text-[22px] mb-0.5">shopping_cart</span>
          <span className="text-[10px] font-medium">Shopping</span>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-[#006a63]"
        >
          <span className="material-symbols-outlined text-[22px] mb-0.5">calendar_month</span>
          <span className="text-[10px] font-medium">Calendar</span>
        </button>
        <button
          onClick={() => setActiveTab('assistant')}
          className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-[#006a63]"
        >
          <span className="material-symbols-outlined text-[22px] mb-0.5">smart_toy</span>
          <span className="text-[10px] font-medium">Assistant</span>
        </button>
      </nav>
    </div>
  );
};
