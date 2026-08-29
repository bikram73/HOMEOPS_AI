import React, { useState } from 'react';
import { InventoryItem } from '../types';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  onAddToShoppingList: (name: string, category: string) => void;
  onUpdateAvailability: (id: string, delta: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onAddInventoryItem,
  onAddToShoppingList,
  onUpdateAvailability,
}) => {
  const [selectedId, setSelectedId] = useState<string>(inventory[1]?.id || inventory[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pantry');
  const [location, setLocation] = useState('');
  const [subLocation, setSubLocation] = useState('');
  const [availability, setAvailability] = useState(50);
  const [badge, setBadge] = useState<'Staple' | 'Low' | 'Normal'>('Normal');

  const selectedItem = inventory.find((i) => i.id === selectedId) || inventory[0];

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddInventoryItem({
      name: name.trim(),
      category,
      location: location.trim() || `${category} • Main Shelf`,
      subLocation: subLocation.trim() || 'Standard Pack',
      availability,
      badge: availability <= 30 ? 'Low' : badge,
      icon: category === 'Cleaning' ? 'local_laundry_service' : category === 'Fridge' ? 'liquor' : 'inventory_2',
      currentLevelDetail: `${availability}%`,
      estimatedRemaining: 'Estimated 2 weeks remaining.',
      lastRestocked: 'Recent',
      avgUsage: 'Regular consumption',
    });

    setName('');
    setLocation('');
    setSubLocation('');
    setShowAddModal(false);
  };

  const handleAddSelectedToShopping = (item: InventoryItem) => {
    onAddToShoppingList(item.name, item.category);
    setToastMsg(`Added "${item.name}" to Shopping List`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-[1440px] mx-auto w-full overflow-y-auto animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-18 right-8 z-50 bg-[#0F766E] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
            Household Inventory
          </h2>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Track availability and manage restocks.
          </p>
        </div>
        <button
          id="btn-add-item-modal"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all self-start md:self-auto shadow-sm active:scale-98"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Item
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Inventory Cards Grid (Left 8-9 cols) */}
        <div className="md:col-span-8 lg:col-span-8 xl:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {inventory.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const isLow = item.availability <= 30;

            return (
              <div
                key={item.id}
                id={`inventory-card-${item.id}`}
                onClick={() => setSelectedId(item.id)}
                className={`bg-white rounded-xl p-5 md:p-6 shadow-sm transition-all duration-200 relative cursor-pointer flex flex-col h-full group ${
                  isSelected
                    ? 'border-2 border-[#0F766E] shadow-md ring-2 ring-[#0F766E]/10'
                    : isLow
                    ? 'border border-[#ffdad6] hover:border-red-400'
                    : 'border border-[#e2e8f0] hover:border-gray-400'
                }`}
              >
                {/* Card Top Row */}
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isLow
                        ? 'bg-[#ffdad6]/40 text-[#ba1a1a] group-hover:bg-[#ffdad6]/70'
                        : 'bg-[#f1f5f9] text-gray-600 group-hover:text-[#0F172A]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                  </div>

                  {item.badge === 'Staple' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#e2e8f0] text-[#0F172A] text-[10px] font-bold uppercase tracking-wider">
                      Staple
                    </span>
                  )}
                  {isLow && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#ffdad6] text-[#93000a] text-[10px] font-bold uppercase tracking-wider gap-1">
                      <span className="material-symbols-outlined text-[12px]">warning</span> Low
                    </span>
                  )}
                </div>

                {/* Card Title & Location */}
                <h3 className="text-base md:text-lg font-bold text-[#0F172A] mb-1 group-hover:text-[#0F766E] transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 mb-6">{item.location}</p>

                {/* Availability Bar & Level Controls */}
                <div className="mt-auto pt-2">
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-gray-500">Availability</span>
                    <span className={isLow ? 'text-[#ba1a1a]' : 'text-gray-800'}>
                      {item.availability}%
                    </span>
                  </div>
                  <div className="w-full bg-[#e2e8f0] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isLow
                          ? 'bg-[#ba1a1a]'
                          : item.availability >= 70
                          ? 'bg-[#006a63]'
                          : 'bg-[#0284c7]'
                      }`}
                      style={{ width: `${item.availability}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Sidebar Area (Detail Panel & Insights) */}
        <div className="md:col-span-4 lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
          {/* AI Inventory Insight Panel */}
          <div className="bg-[#F0FDFA] border-l-3 border-[#006a63] rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-[#006a63]">
              <span className="material-symbols-outlined fill-1 text-[20px]">auto_awesome</span>
              <span className="text-xs font-bold tracking-wider uppercase">Inventory Insight</span>
            </div>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
              You frequently run low on{' '}
              <strong className="text-[#0F172A] font-semibold">Laundry Detergent</strong> near the
              end of the month. Consider setting up an automated subscription or buying in bulk.
            </p>
            <button
              onClick={() => alert('Viewing Predictive Usage Analytics for household supplies.')}
              className="mt-4 text-[#006a63] text-xs font-bold hover:underline inline-flex items-center gap-1"
            >
              Review Analytics{' '}
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          {/* Inventory Detail Panel for Selected Item */}
          {selectedItem && (
            <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm flex flex-col sticky top-20 overflow-hidden">
              <div className="p-5 md:p-6 border-b border-[#e2e8f0]">
                <div className="flex items-start justify-between mb-2">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      selectedItem.availability <= 30
                        ? 'bg-[#ffdad6]/50 text-[#ba1a1a]'
                        : 'bg-[#f1f5f9] text-gray-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {selectedItem.icon}
                    </span>
                  </div>
                  <button
                    onClick={() => alert(`Options for ${selectedItem.name}`)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A]">{selectedItem.name}</h3>
                <p className="text-xs text-gray-500">
                  {selectedItem.subLocation || selectedItem.unit || 'Household Item'}
                </p>
              </div>

              <div className="p-5 md:p-6 flex-1 space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-gray-500">Current Level</span>
                    <span
                      className={
                        selectedItem.availability <= 30
                          ? 'text-[#ba1a1a] font-bold'
                          : 'text-[#0F172A]'
                      }
                    >
                      {selectedItem.currentLevelDetail || `${selectedItem.availability}%`}
                    </span>
                  </div>
                  <div className="w-full bg-[#e2e8f0] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        selectedItem.availability <= 30 ? 'bg-[#ba1a1a]' : 'bg-[#006a63]'
                      }`}
                      style={{ width: `${selectedItem.availability}%` }}
                    ></div>
                  </div>
                  {selectedItem.estimatedRemaining && (
                    <p className="text-xs text-gray-500 mt-2">{selectedItem.estimatedRemaining}</p>
                  )}
                  {/* Quick adjust buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onUpdateAvailability(selectedItem.id, -10)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded text-gray-700"
                    >
                      -10% (Used)
                    </button>
                    <button
                      onClick={() => onUpdateAvailability(selectedItem.id, 25)}
                      className="px-2.5 py-1 bg-[#CCFBF1] hover:bg-[#99efe5] text-xs font-bold rounded text-[#006f67]"
                    >
                      +25% (Restocked)
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-xs md:text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Location</span>
                    <span className="font-medium text-[#0F172A]">{selectedItem.location}</span>
                  </div>
                  {selectedItem.lastRestocked && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500">Last Restocked</span>
                      <span className="font-medium text-[#0F172A]">
                        {selectedItem.lastRestocked}
                      </span>
                    </div>
                  )}
                  {selectedItem.avgUsage && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500">Avg. Usage</span>
                      <span className="font-medium text-[#0F172A]">{selectedItem.avgUsage}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 bg-gray-50/70 border-t border-[#e2e8f0]">
                <button
                  id="btn-add-item-to-shopping"
                  onClick={() => handleAddSelectedToShopping(selectedItem)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white border border-[#e2e8f0] text-[#0F172A] px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                  Add to Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0F172A]">Add Household Item</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Olive Oil, Dish Soap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="Pantry">Pantry</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Fridge">Fridge</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Initial Availability %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={availability}
                    onChange={(e) => setAvailability(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Location (Room / Shelf)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pantry • Shelf 2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#115E59]"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
