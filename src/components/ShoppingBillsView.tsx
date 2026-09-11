import React, { useState } from 'react';
import { ShoppingItem, BillItem } from '../types';

interface ShoppingBillsViewProps {
  shoppingItems: ShoppingItem[];
  bills: BillItem[];
  onToggleShoppingItem: (id: string) => void;
  onDeleteShoppingItem: (id: string) => void;
  onAddShoppingItem: (name: string, category: string) => void;
  onPayBill: (billId: string) => void;
  onAddBill?: (bill: Omit<BillItem, 'id'>) => void;
  onDeleteBill?: (id: string) => void;
}

export const ShoppingBillsView: React.FC<ShoppingBillsViewProps> = ({
  shoppingItems,
  bills,
  onToggleShoppingItem,
  onDeleteShoppingItem,
  onAddShoppingItem,
  onPayBill,
  onAddBill,
  onDeleteBill,
}) => {
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [showNewBillModal, setShowNewBillModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Pantry');
  const [oliveOilAdded, setOliveOilAdded] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unbought' | 'bought'>('all');
  const [payingBillId, setPayingBillId] = useState<string | null>(null);

  // New Bill Form States
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  const [billCategory, setBillCategory] = useState<'Due Tomorrow' | 'Due Soon' | 'Upcoming'>('Due Soon');
  const [billIcon, setBillIcon] = useState('receipt_long');
  const [billAutoPay, setBillAutoPay] = useState(false);

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

  const handleCreateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billName.trim() || !billAmount.trim()) return;
    if (onAddBill) {
      onAddBill({
        name: billName.trim(),
        amount: billAmount.startsWith('$') || billAmount.startsWith('₹') ? billAmount : `$${billAmount}`,
        dueDate: billDueDate.trim() || 'Upcoming',
        dueCategory: billCategory,
        isAutoPay: billAutoPay,
        icon: billIcon || 'receipt_long',
        paidThisMonth: false,
      });
    }
    setBillName('');
    setBillAmount('');
    setBillDueDate('');
    setShowNewBillModal(false);
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
                Bills &amp; Payments
              </h3>
              {onAddBill && (
                <button
                  id="btn-open-add-bill"
                  type="button"
                  onClick={() => setShowNewBillModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add Bill
                </button>
              )}
            </div>

            <div className="space-y-4">
              {bills.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-gray-200 rounded-xl">
                  <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">receipt_long</span>
                  <p className="text-sm font-semibold text-[#0F172A]">No Bills Recorded</p>
                  <p className="text-xs text-gray-500 mt-1 mb-3">Add utilities, rent, subscriptions, or property dues.</p>
                  {onAddBill && (
                    <button
                      onClick={() => setShowNewBillModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F766E] text-white text-xs font-semibold hover:bg-[#115E59] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Add First Bill
                    </button>
                  )}
                </div>
              ) : (
                bills.map((bill) => {
                  const isDueSoon = bill.dueCategory === 'Due Tomorrow' || bill.dueCategory === 'Due Soon';
                  const isPaid = bill.paidThisMonth || bill.dueCategory === 'Paid';
                  const isPaying = payingBillId === bill.id;

                  return (
                    <div
                      key={bill.id}
                      id={`bill-card-${bill.id}`}
                      className={`p-4 border rounded-xl relative overflow-hidden transition-all ${
                        isPaid
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : isDueSoon
                          ? 'border-[#ffdad6] bg-[#ffdad6]/15'
                          : 'border-[#e2e8f0] bg-[#f8fafc]'
                      }`}
                    >
                      <div
                        className={`absolute top-0 left-0 w-1.5 h-full ${
                          isPaid ? 'bg-emerald-500' : isDueSoon ? 'bg-[#ba1a1a]' : 'bg-[#131b2e]/60'
                        }`}
                      ></div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-[#e0e3e5] text-[#0F172A]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">{bill.icon || 'receipt_long'}</span>
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isPaid ? 'text-gray-600 line-through' : 'text-[#0F172A]'}`}>
                              {bill.name}
                            </p>
                            <p
                              className={`text-xs font-semibold ${
                                isPaid ? 'text-emerald-700' : isDueSoon ? 'text-[#ba1a1a]' : 'text-gray-500'
                              }`}
                            >
                              {isPaid ? 'Paid' : bill.dueDate} {bill.isAutoPay ? '• Auto-pay' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-base md:text-lg font-bold text-[#0F172A]">{bill.amount}</p>
                          {onDeleteBill && (
                            <button
                              id={`btn-delete-bill-${bill.id}`}
                              type="button"
                              onClick={() => onDeleteBill(bill.id)}
                              className="text-gray-300 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                              title={`Delete ${bill.name}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {!isPaid && (
                        <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200/50">
                          <button
                            id={`btn-pay-${bill.id}`}
                            disabled={isPaying}
                            onClick={() => handlePayNow(bill)}
                            className="flex-1 bg-[#0f172a] hover:bg-[#1e293b] text-white py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            {isPaying ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Processing...
                              </>
                            ) : (
                              'Mark Paid'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#115E59] cursor-pointer"
                >
                  Add to List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Bill Modal */}
      {showNewBillModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0F172A]">Add Household Bill</h3>
              <button
                onClick={() => setShowNewBillModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateBillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bill Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity, Water, Internet, Rent"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $120 or ₹1,850"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Due Schedule
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Due Tomorrow, 15th of month"
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Urgency Category</label>
                  <select
                    value={billCategory}
                    onChange={(e) => setBillCategory(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="Due Soon">Due Soon</option>
                    <option value="Due Tomorrow">Due Tomorrow</option>
                    <option value="Upcoming">Upcoming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Icon</label>
                  <select
                    value={billIcon}
                    onChange={(e) => setBillIcon(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="bolt">Electricity (bolt)</option>
                    <option value="wifi">Internet (wifi)</option>
                    <option value="water_drop">Water (water_drop)</option>
                    <option value="home">Rent / Mortgage (home)</option>
                    <option value="tv">Streaming (tv)</option>
                    <option value="security">Insurance (security)</option>
                    <option value="receipt_long">General Bill</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="checkbox-bill-autopay"
                  checked={billAutoPay}
                  onChange={(e) => setBillAutoPay(e.target.checked)}
                  className="rounded text-[#0F766E] focus:ring-[#0F766E]"
                />
                <label htmlFor="checkbox-bill-autopay" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Auto-pay enabled for this bill
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBillModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold hover:bg-[#115E59] cursor-pointer"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
