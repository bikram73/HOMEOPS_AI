import React, { useState } from 'react';

interface MaintenanceItem {
  id: string;
  title: string;
  system: string;
  interval: string;
  lastDone: string;
  nextDue: string;
  status: 'Due Soon' | 'Optimal' | 'Overdue';
  icon: string;
}

export const MaintenanceView: React.FC = () => {
  const [items, setItems] = useState<MaintenanceItem[]>([
    {
      id: 'm-1',
      title: 'HVAC Air Filter Replacement',
      system: 'Heating & Cooling • 20x25x4 MERV 11',
      interval: 'Every 90 days',
      lastDone: 'Nov 15, 2023',
      nextDue: 'Feb 15, 2024',
      status: 'Due Soon',
      icon: 'air',
    },
    {
      id: 'm-2',
      title: 'Water Heater Flush & Anode Check',
      system: 'Plumbing • 50 Gal Rheem Tank',
      interval: 'Annual',
      lastDone: 'Jun 10, 2023',
      nextDue: 'Jun 10, 2024',
      status: 'Optimal',
      icon: 'water_heater',
    },
    {
      id: 'm-3',
      title: 'Smoke & CO Detectors Test',
      system: 'Safety & Security • 6 Devices',
      interval: 'Monthly',
      lastDone: 'Dec 01, 2023',
      nextDue: 'Jan 01, 2024',
      status: 'Optimal',
      icon: 'detector_smoke',
    },
    {
      id: 'm-4',
      title: 'Refrigerator Coil Cleaning',
      system: 'Kitchen Appliances • French Door',
      interval: 'Bi-annual',
      lastDone: 'May 04, 2023',
      nextDue: 'Nov 04, 2023',
      status: 'Overdue',
      icon: 'kitchen',
    },
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const handleMarkDone = (id: string, title: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'Optimal',
              lastDone: 'Today',
              nextDue: 'In 90 days',
            }
          : item
      )
    );
    setToast(`Marked "${title}" as completed!`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-[1440px] mx-auto w-full overflow-y-auto animate-in fade-in duration-200">
      {toast && (
        <div className="fixed top-18 right-8 z-50 bg-[#0F766E] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
            Home Maintenance
          </h2>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Preventative upkeep, warranty records, and scheduled servicing.
          </p>
        </div>
        <button
          onClick={() => alert('New Maintenance Item dialog')}
          className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-98"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Schedule Service
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">94%</p>
            <p className="text-xs text-gray-500 font-medium">Home Health Index</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">priority_high</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">1 Overdue</p>
            <p className="text-xs text-gray-500 font-medium">Immediate Attention</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] text-gray-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">calendar_clock</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">Feb 15</p>
            <p className="text-xs text-gray-500 font-medium">Next Scheduled Service</p>
          </div>
        </div>
      </div>

      {/* Maintenance List */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden divide-y divide-[#e2e8f0]">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  item.status === 'Overdue'
                    ? 'bg-[#ffdad6]/60 text-[#ba1a1a]'
                    : item.status === 'Due Soon'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-[#f1f5f9] text-gray-700'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="text-base font-bold text-[#0F172A]">{item.title}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                      item.status === 'Overdue'
                        ? 'bg-[#ffdad6] text-[#ba1a1a]'
                        : item.status === 'Due Soon'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.system}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Frequency: {item.interval}</span>
                  <span>•</span>
                  <span>Last: {item.lastDone}</span>
                  <span>•</span>
                  <span className="font-semibold text-gray-800">Next Due: {item.nextDue}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => handleMarkDone(item.id, item.title)}
                className="px-3.5 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Complete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
