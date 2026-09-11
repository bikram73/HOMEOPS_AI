import React, { useState } from 'react';
import { MaintenanceItem } from '../types';

interface MaintenanceViewProps {
  maintenance: MaintenanceItem[];
  onAddMaintenance: (item: Omit<MaintenanceItem, 'id'>) => void;
  onDeleteMaintenance: (id: string) => void;
  onCompleteMaintenance: (id: string) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenance,
  onAddMaintenance,
  onDeleteMaintenance,
  onCompleteMaintenance,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [system, setSystem] = useState('');
  const [interval, setInterval] = useState('Every 90 days');
  const [nextDueDate, setNextDueDate] = useState('');
  const [status, setStatus] = useState<'Due Soon' | 'Optimal' | 'Overdue'>('Due Soon');
  const [icon, setIcon] = useState('build');

  // Stats calculation
  const overdueCount = maintenance.filter((m) => m.status === 'Overdue').length;
  const dueSoonCount = maintenance.filter((m) => m.status === 'Due Soon').length;
  const optimalCount = maintenance.filter((m) => m.status === 'Optimal').length;
  const healthPercent =
    maintenance.length > 0
      ? Math.round(((optimalCount + dueSoonCount * 0.5) / maintenance.length) * 100)
      : 100;

  const handleComplete = (item: MaintenanceItem) => {
    onCompleteMaintenance(item.id);
    setToast(`Marked "${item.title}" as serviced & optimal!`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddMaintenance({
      title: title.trim(),
      system: system.trim() || 'General Household System',
      interval,
      lastDone: 'Not yet recorded',
      nextDue: nextDueDate.trim() || 'Upcoming',
      status,
      icon,
    });

    setTitle('');
    setSystem('');
    setNextDueDate('');
    setShowAddModal(false);
    setToast(`Added maintenance schedule for "${title.trim()}"`);
    setTimeout(() => setToast(null), 3000);
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
          id="btn-schedule-service"
          onClick={() => setShowAddModal(true)}
          className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Schedule Service
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{healthPercent}%</p>
            <p className="text-xs text-gray-500 font-medium">Home Health Index</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">priority_high</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{overdueCount} Overdue</p>
            <p className="text-xs text-gray-500 font-medium">{dueSoonCount} Due Soon</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] text-gray-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">build</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{maintenance.length}</p>
            <p className="text-xs text-gray-500 font-medium">Active Maintenance Tasks</p>
          </div>
        </div>
      </div>

      {/* Maintenance List */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden divide-y divide-[#e2e8f0]">
        {maintenance.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-gray-300 text-5xl mb-3">build</span>
            <h3 className="text-lg font-bold text-[#0F172A] mb-1">No Maintenance Schedules</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">
              Schedule HVAC filter changes, water heater checks, detector tests, or routine equipment service.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-[#0F766E] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#115E59] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Schedule First Service
            </button>
          </div>
        ) : (
          maintenance.map((item) => (
            <div
              key={item.id}
              id={`maintenance-item-${item.id}`}
              className="p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors group"
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
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    <span>Interval: {item.interval}</span>
                    <span>•</span>
                    <span>Last: {item.lastDone}</span>
                    <span>•</span>
                    <span className="font-semibold text-gray-800">Next: {item.nextDue}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  id={`btn-complete-maint-${item.id}`}
                  onClick={() => handleComplete(item)}
                  className="px-3 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                  title="Mark serviced & optimal"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Complete
                </button>
                <button
                  id={`btn-delete-maint-${item.id}`}
                  onClick={() => onDeleteMaintenance(item.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title={`Delete ${item.title}`}
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Maintenance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0F172A]">Schedule Maintenance Task</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clean Dryer Vent, Sump Pump Inspection"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  System / Location Specs
                </label>
                <input
                  type="text"
                  placeholder="e.g. Laundry Room • Rigid ducting"
                  value={system}
                  onChange={(e) => setSystem(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Frequency</label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Every 90 days">Every 90 days</option>
                    <option value="Bi-annual">Bi-annual</option>
                    <option value="Annual">Annual</option>
                    <option value="As Needed">As Needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Next Due Date</label>
                  <input
                    type="text"
                    placeholder="e.g. In 30 days, Mar 15"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="Due Soon">Due Soon</option>
                    <option value="Optimal">Optimal</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Icon</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="build">Tool (build)</option>
                    <option value="air">HVAC / Filter (air)</option>
                    <option value="water_heater">Water Heater (water_heater)</option>
                    <option value="detector_smoke">Smoke Alarm (detector_smoke)</option>
                    <option value="kitchen">Appliances (kitchen)</option>
                    <option value="plumbing">Plumbing (plumbing)</option>
                    <option value="yard">Yard / Exterior (yard)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#115E59] cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
