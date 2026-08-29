import React, { useState } from 'react';
import { ShoppingItem, BillItem } from '../types';

interface ShoppingBillsViewProps {
  shoppingItems: ShoppingItem[];
  bills: BillItem[];
  onToggleShoppingItem: (id: string) => void;
  onDeleteShoppingItem: (id: string) => void;
  onAddShoppingItem: (name: string, category: string) => void;
  onPayBill: (billId: string) => void;
}

export const ShoppingBillsView: React.FC<ShoppingBillsViewProps> = ({
  shoppingItems,
  bills,
  onToggleShoppingItem,
  onDeleteShoppingItem,
  onAddShoppingItem,
  onPayBill,
}) => {
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Pantry');
  const [oliveOilAdded, setOliveOilAdded] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unbought' | 'bought'>('all');
  const [payingBillId, setPayingBillId] = useState<string | null>(null);

  const filteredShopping = shoppingItems.filter((item) => {
    if (filterMode === 'unbought') return !item.checked;
    if (filterMode === 'bought') return item.checked;
    return true;
  });

  const unboughtCount = shoppingItems.filter((i) => !i.checked).length;
  const dueSoonBills = bills.filter((b) => b.dueCategory === 'Due Tomorrow' || b.dueCategory === 'Due Soon');
  const paidBills = bills.filter((b) => b.paidThisMonth);

  const handleAddOliveOil = () => {
    onAddShoppingItem('Olive Oil (Extra Virgin)', 'Pantry • 1L');
    setOliveOilAdded(true);
  };

  const handleCreateItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddShoppingItem(newItemName.trim(), `${newItemCategory} • Standard Pack`);
    setNewItemName('');
    setShowNewItemModal(false);
  };

  const handlePayNow = (bill: BillItem) => {
    setPayingBillId(bill.id);
    setTimeout(() => {
      onPayBill(bill.id);
      setPayingBillId(null);
    }, 900);
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-[1440px] mx-auto w-full overflow-y-auto animate-in fade-in duration-200">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight mb-1">
            Shopping &amp; Bills
          </h2>
          <p className="text-sm md:text-base text-gray-500">
            Manage your household procurement and upcoming payments.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            id="btn-filter-shopping"
            onClick={() =>
              setFilterMode((prev) =>
                prev === 'all' ? 'unbought' : prev === 'unbought' ? 'bought' : 'all'
              )
            }
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg text-[#0F172A] text-sm font-semibold hover:bg-gray-50 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            {filterMode === 'all'
              ? 'Filter'
              : filterMode === 'unbought'
              ? 'To Buy'
              : 'Purchased'}
          </button>
          <button
            id="btn-new-shopping-item"
            onClick={() => setShowNewItemModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Shopping List Section (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 border-b border-[#e2e8f0] pb-4">
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F172A] text-[22px]">
                  shopping_basket
                </span>
                Shopping List
              </h3>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-[#dae2fd] text-[#131b2e] rounded-md text-xs font-bold">
                  {unboughtCount} To Buy
                </span>
              </div>
            </div>

            {/* Shopping List Items */}
            <div className="space-y-2.5">
              {filteredShopping.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No items in this shopping view
                </div>
              ) : (
                filteredShopping.map((item) => (
                  <div
                    key={item.id}
                    id={`shopping-row-${item.id}`}
                    className="flex items-center justify-between p-3.5 border border-[#e2e8f0] rounded-lg hover:border-[#0F766E] transition-colors bg-[#f8fafc] group"
                  >
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() => onToggleShoppingItem(item.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          item.checked
                            ? 'bg-[#0F766E] border-[#0F766E] text-white'
                            : 'border-gray-400 group-hover:border-[#0F766E]'
                        }`}
                      >
                        {item.checked && (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        )}
                      </button>
                      <div>
                        <p
                          className={`text-sm font-semibold text-[#0F172A] ${
                            item.checked ? 'line-through text-gray-400' : ''
                          }`}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteShoppingItem(item.id)}
                      className="text-gray-300 hover:text-[#ba1a1a] p-1 rounded transition-colors"
                      title="Remove item"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* AI Suggestion Box */}
            {!oliveOilAdded && (
              <div className="mt-6 p-4 bg-[#F0FDFA] border-l-3 border-[#0D9488] rounded-r-lg flex items-start gap-3.5">
                <span className="material-symbols-outlined text-[#0D9488] text-[22px] shrink-0 mt-0.5">
                  smart_toy
                </span>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">AI Suggestion</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1 leading-relaxed">
                    Based on usual consumption, you might be running low on Olive Oil. Add to list?
                  </p>
                  <button
                    id="btn-add-olive-oil-suggestion"
                    onClick={handleAddOliveOil}
                    className="mt-2.5 text-[#0D9488] text-xs font-bold hover:underline inline-flex items-center gap-1"
                  >
                    + Add Olive Oil
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Bills Section (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bills Summary KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm flex flex-col justify-between h-28">
              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">
                  warning
                </span>
                Due Soon
              </p>
              <div>
                <p className="text-2xl font-bold text-[#0F172A]">{dueSoonBills.length}</p>
                <p className="text-xs text-gray-500 font-medium">₹1,850 Total</p>
              </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm flex flex-col justify-between h-28">
              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006f67] text-[18px]">
                  check_circle
                </span>
                Paid (This Month)
              </p>
              <div>
                <p className="text-2xl font-bold text-[#0F172A]">{paidBills.length}</p>
                <p className="text-xs text-gray-500 font-medium">₹4,200 Total</p>
              </div>
            </div>
          </div>

          {/* Upcoming Bills List */}
          <section className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-[#e2e8f0] pb-4">
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0F172A] text-[22px]">
                  receipt_long
                </span>
                Upcoming Bills
              </h3>
            </div>

            <div className="space-y-4">
              {/* Electricity Bill Card */}
              <div className="p-4 border border-[#ffdad6] bg-[#ffdad6]/10 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ba1a1a]"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#e0e3e5] flex items-center justify-center text-[#0F172A]">
                      <span className="material-symbols-outlined text-[20px]">bolt</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">Electricity</p>
                      <p className="text-xs text-[#ba1a1a] font-semibold">Due Tomorrow</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-[#0F172A]">₹1,850</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    id="btn-pay-electricity-bill"
                    disabled={payingBillId === 'bill-1'}
                    onClick={() =>
                      handlePayNow(
                        bills.find((b) => b.id === 'bill-1') || {
                          id: 'bill-1',
                          name: 'Electricity',
                          amount: '₹1,850',
                          dueDate: 'Due Tomorrow',
                          dueCategory: 'Due Tomorrow',
                          icon: 'bolt',
                        }
                      )
                    }
                    className="flex-1 bg-[#0f172a] hover:bg-[#1e293b] text-white py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {payingBillId === 'bill-1' ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Processing...
                      </>
                    ) : (
                      'Pay Now'
                    )}
                  </button>
                </div>
              </div>

              {/* Internet Bill Card */}
              <div className="p-4 border border-[#e2e8f0] bg-[#f8fafc] rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#131b2e]/60"></div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#e0e3e5] flex items-center justify-center text-[#0F172A]">
                      <span className="material-symbols-outlined text-[20px]">wifi</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">Internet</p>
                      <p className="text-xs text-gray-500">Due in 5 days (Auto-pay)</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-[#0F172A]">₹999</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* New Shopping Item Modal */}
      {showNewItemModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0F172A]">Add Shopping Item</h3>
              <button
                onClick={() => setShowNewItemModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateItemSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dishwasher pods, Fresh Avocados"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                >
                  <option value="Pantry">Pantry</option>
                  <option value="Fridge">Fridge</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Household">Household</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewItemModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#115E59]"
                >
                  Add to List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
