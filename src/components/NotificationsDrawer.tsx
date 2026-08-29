import React from 'react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'home' | 'tasks' | 'inventory' | 'shopping' | 'bills') => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col p-6 border-l border-[#e2e8f0] animate-in slide-in-from-right duration-200">
        <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0F172A] text-[22px]">
              notifications
            </span>
            <h3 className="text-lg font-bold text-[#0F172A]">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto">
          {/* Notification 1 */}
          <div
            onClick={() => {
              onNavigateTab('bills');
              onClose();
            }}
            className="p-3.5 rounded-xl border border-[#ffdad6] bg-[#ffdad6]/10 hover:bg-[#ffdad6]/20 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#ba1a1a] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">bolt</span> Bill Alert
              </span>
              <span className="text-[10px] text-gray-400">10m ago</span>
            </div>
            <p className="text-xs font-semibold text-[#0F172A]">
              Electricity Bill due tomorrow (₹1,850)
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Avoid late fee by paying today.</p>
          </div>

          {/* Notification 2 */}
          <div
            onClick={() => {
              onNavigateTab('inventory');
              onClose();
            }}
            className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#006a63] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">inventory_2</span> Low Stock
              </span>
              <span className="text-[10px] text-gray-400">1h ago</span>
            </div>
            <p className="text-xs font-semibold text-[#0F172A]">
              Laundry Detergent is critically low (20%)
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Estimated 4 washes remaining.</p>
          </div>

          {/* Notification 3 */}
          <div
            onClick={() => {
              onNavigateTab('home');
              onClose();
            }}
            className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#188ace] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">package_2</span> Delivery
              </span>
              <span className="text-[10px] text-gray-400">2h ago</span>
            </div>
            <p className="text-xs font-semibold text-[#0F172A]">Amazon package delivered</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Package left on front porch.</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
        >
          Mark all as read
        </button>
      </div>
    </div>
  );
};
