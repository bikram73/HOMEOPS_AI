import React, { useState } from 'react';
import { InventoryItem, ShoppingItem } from '../types';

const PRESET_EXISTING_STAPLES: Omit<InventoryItem, 'id'>[] = [
  {
    name: 'Laundry Detergent',
    category: 'Cleaning',
    location: 'Laundry Room',
    subLocation: 'Tide Liquid 92 oz',
    availability: 25,
    badge: 'Low',
    icon: 'local_laundry_service',
    unit: '92 oz bottle',
    currentLevelDetail: '25% (Low)',
    estimatedRemaining: '4 washes remaining',
    lastRestocked: 'Oct 12',
    avgUsage: '1 bottle / 6 wks',
  },
  {
    name: 'Jasmine Rice',
    category: 'Pantry',
    location: 'Pantry • Shelf 2',
    subLocation: 'Long Grain 5kg',
    availability: 70,
    badge: 'Staple',
    icon: 'rice_bowl',
    unit: '5kg bag',
    currentLevelDetail: '70% (Adequate)',
    estimatedRemaining: '3 weeks remaining',
    lastRestocked: 'Nov 02',
    avgUsage: '1 bag / month',
  },
  {
    name: 'Olive Oil',
    category: 'Pantry',
    location: 'Pantry • Shelf 1',
    subLocation: 'Extra Virgin 1L',
    availability: 60,
    badge: 'Normal',
    icon: 'oil_barrel',
    unit: '1L Bottle',
    currentLevelDetail: '60% (Moderate)',
    estimatedRemaining: '2.5 weeks remaining',
    lastRestocked: 'Oct 20',
    avgUsage: '1 bottle / 5 wks',
  },
  {
    name: 'Organic Whole Milk',
    category: 'Fridge',
    location: 'Kitchen Refrigerator',
    subLocation: 'Top Shelf',
    availability: 25,
    badge: 'Low',
    icon: 'liquor',
    unit: '1 Gallon',
    currentLevelDetail: '25% (Low)',
    estimatedRemaining: '1 day remaining',
    lastRestocked: 'Oct 28',
    avgUsage: '2 gallons / wk',
  },
  {
    name: 'Mint Toothpaste',
    category: 'Personal Care',
    location: 'Master Bathroom',
    subLocation: 'Colgate Fresh Mint',
    availability: 30,
    badge: 'Low',
    icon: 'health_and_beauty',
    unit: '6 oz tube',
    currentLevelDetail: '30% (Low)',
    estimatedRemaining: '5 days remaining',
    lastRestocked: 'Sep 25',
    avgUsage: '1 tube / month',
  },
  {
    name: 'Ground Arabica Coffee',
    category: 'Pantry',
    location: 'Kitchen Counter',
    subLocation: 'Dark Roast 500g',
    availability: 80,
    badge: 'Staple',
    icon: 'coffee',
    unit: '500g canister',
    currentLevelDetail: '80% (High)',
    estimatedRemaining: '3 weeks remaining',
    lastRestocked: 'Nov 05',
    avgUsage: '1 can / month',
  },
  {
    name: 'Paper Towels',
    category: 'Cleaning',
    location: 'Kitchen Cabinet',
    subLocation: '2-Ply 6 Rolls',
    availability: 40,
    badge: 'Normal',
    icon: 'roll_sheet',
    unit: '6 rolls',
    currentLevelDetail: '40% (2 rolls)',
    estimatedRemaining: '1 week remaining',
    lastRestocked: 'Oct 15',
    avgUsage: '1 pk / 3 wks',
  },
  {
    name: 'Dishwasher Pods',
    category: 'Cleaning',
    location: 'Under Sink',
    subLocation: 'Citrus Scent 42 ct',
    availability: 15,
    badge: 'Low',
    icon: 'soap',
    unit: '42 count tub',
    currentLevelDetail: '15% (Low)',
    estimatedRemaining: '3 pods remaining',
    lastRestocked: 'Sep 18',
    avgUsage: '1 tub / 6 wks',
  },
  {
    name: 'Free-Range Eggs',
    category: 'Fridge',
    location: 'Kitchen Refrigerator',
    subLocation: 'Egg Tray',
    availability: 50,
    badge: 'Staple',
    icon: 'egg',
    unit: '12 count carton',
    currentLevelDetail: '50% (6 eggs)',
    estimatedRemaining: '4 days remaining',
    lastRestocked: 'Nov 01',
    avgUsage: '1 dozen / wk',
  },
  {
    name: 'Trash Bags',
    category: 'Cleaning',
    location: 'Utility Closet',
    subLocation: '13 Gallon 45 ct',
    availability: 35,
    badge: 'Normal',
    icon: 'delete',
    unit: '45 bags box',
    currentLevelDetail: '35% (15 bags)',
    estimatedRemaining: '2 weeks remaining',
    lastRestocked: 'Oct 01',
    avgUsage: '1 box / 2 mos',
  },
];

interface InventoryViewProps {
  inventory: InventoryItem[];
  shoppingItems?: ShoppingItem[];
  onAddInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  onDeleteInventoryItem: (id: string) => void;
  onAddToShoppingList: (name: string, category: string, date?: string, quantity?: string) => void;
  onUpdateAvailability: (id: string, delta: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  shoppingItems = [],
  onAddInventoryItem,
  onDeleteInventoryItem,
  onAddToShoppingList,
  onUpdateAvailability,
}) => {
  const [selectedId, setSelectedId] = useState<string>(inventory[1]?.id || inventory[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Filter and View States
  const [filterMode, setFilterMode] = useState<'all' | 'category' | 'location' | 'status'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showStaplesShelf, setShowStaplesShelf] = useState<boolean>(true);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pantry');
  const [location, setLocation] = useState('');
  const [subLocation, setSubLocation] = useState('');
  const [unit, setUnit] = useState('');
  const [estimatedRemaining, setEstimatedRemaining] = useState('');
  const [availability, setAvailability] = useState(50);
  const [badge, setBadge] = useState<'Staple' | 'Low' | 'Normal'>('Normal');

  const selectedItem = inventory.find((i) => i.id === selectedId) || inventory[0];
  const isJustAdded = selectedItem ? justAddedId === selectedItem.id : false;
  const existingShoppingItem = selectedItem
    ? shoppingItems.find(
        (s) => s.name.toLowerCase() === selectedItem.name.toLowerCase() && !s.checked
      )
    : undefined;

  const remainingStaples = PRESET_EXISTING_STAPLES.filter(
    (preset) => !inventory.some((i) => i.name.toLowerCase() === preset.name.toLowerCase())
  );

  const handleAddAllRemainingStaples = () => {
    if (remainingStaples.length === 0) return;
    remainingStaples.forEach((preset) => {
      onAddInventoryItem(preset);
    });
    setToastMsg(`Added all ${remainingStaples.length} household staples to inventory`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleApplyPreset = (preset: Omit<InventoryItem, 'id'>) => {
    setName(preset.name);
    setCategory(preset.category);
    setLocation(preset.location);
    setSubLocation(preset.subLocation || '');
    setUnit(preset.unit || '');
    setAvailability(preset.availability);
    setBadge(preset.badge || 'Normal');
    setEstimatedRemaining(preset.estimatedRemaining || '');
  };

  const handleAddPresetStaple = (preset: Omit<InventoryItem, 'id'>) => {
    const existing = inventory.find(
      (i) => i.name.toLowerCase() === preset.name.toLowerCase()
    );
    if (existing) {
      setSelectedId(existing.id);
      setToastMsg(`"${preset.name}" is already in inventory (highlighted)`);
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    onAddInventoryItem(preset);
    setToastMsg(`Added "${preset.name}" to inventory`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddInventoryItem({
      name: name.trim(),
      category,
      location: location.trim() || `${category} • Main Shelf`,
      subLocation: subLocation.trim() || 'Standard Pack',
      unit: unit.trim() || '1 item',
      availability,
      badge: availability <= 30 ? 'Low' : badge,
      icon:
        category === 'Cleaning'
          ? 'local_laundry_service'
          : category === 'Fridge'
          ? 'liquor'
          : category === 'Personal Care'
          ? 'health_and_beauty'
          : 'inventory_2',
      currentLevelDetail: `${availability}%`,
      estimatedRemaining: estimatedRemaining.trim() || 'Estimated 2 weeks remaining.',
      lastRestocked: 'Recent',
      avgUsage: 'Regular consumption',
    });

    setName('');
    setLocation('');
    setSubLocation('');
    setUnit('');
    setEstimatedRemaining('');
    setShowAddModal(false);
  };

  const handleAddSelectedToShopping = (item: InventoryItem) => {
    if (!item) return;
    const existing = shoppingItems.find(
      (s) => s.name.toLowerCase() === item.name.toLowerCase()
    );
    const refillCategory = `${item.category} • Refill (${item.unit || item.subLocation || '1 pk'})`;
    
    onAddToShoppingList(item.name, refillCategory, undefined, item.unit || '1');
    setJustAddedId(item.id);
    
    if (existing) {
      setToastMsg(`Updated "${item.name}" quantity in Shopping List (+1)`);
    } else {
      setToastMsg(`Added "${item.name}" to Shopping List`);
    }
    
    setTimeout(() => {
      setToastMsg(null);
      setJustAddedId(null);
    }, 3000);
  };

  // Derive unique locations for location filter
  const uniqueLocations: string[] = [
    'All',
    ...Array.from(
      new Set<string>(
        inventory
          .map((item) => item.location.split('•')[0].trim())
          .filter(Boolean)
      )
    ),
  ];

  const categoryOptions = ['All', 'Pantry', 'Fridge', 'Cleaning', 'Personal Care', 'General'];
  const statusOptions = ['All', 'Low (<30%)', 'Adequate (30-70%)', 'High (>70%)', 'Staples'];

  const filteredInventory = inventory.filter((item) => {
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.subLocation && item.subLocation.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    if (filterMode === 'category') {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    } else if (filterMode === 'location') {
      if (
        selectedLocation !== 'All' &&
        !item.location.toLowerCase().includes(selectedLocation.toLowerCase())
      ) {
        return false;
      }
    } else if (filterMode === 'status') {
      if (selectedStatus === 'Low (<30%)' && item.availability > 30) return false;
      if (selectedStatus === 'Adequate (30-70%)' && (item.availability <= 30 || item.availability > 70)) return false;
      if (selectedStatus === 'High (>70%)' && item.availability <= 70) return false;
      if (selectedStatus === 'Staples' && item.badge !== 'Staple') return false;
    }

    return true;
  });

  const resetFilters = () => {
    setFilterMode('all');
    setSelectedCategory('All');
    setSelectedLocation('All');
    setSelectedStatus('All');
    setSearchFilter('');
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-[1440px] mx-auto w-full overflow-y-auto animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F766E] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border border-teal-500/40">
          <span className="material-symbols-outlined text-[20px] text-teal-200">check_circle</span>
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight">
            Household Inventory
          </h2>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Track availability, manage par levels, and quick-add household staples.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            id="btn-toggle-staples-shelf"
            type="button"
            onClick={() => setShowStaplesShelf(!showStaplesShelf)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
              showStaplesShelf
                ? 'bg-teal-50 text-[#0F766E] border-teal-200 hover:bg-teal-100'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {showStaplesShelf ? 'expand_less' : 'expand_more'}
            </span>
            <span>{showStaplesShelf ? 'Hide Staples Shelf' : 'Existing Staples'}</span>
            {remainingStaples.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-[#0F766E] text-white">
                {remainingStaples.length}
              </span>
            )}
          </button>
          <button
            id="btn-add-item-modal"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Custom Item
          </button>
        </div>
      </div>

      {/* Quick Add Existing Household Staples Shelf */}
      {showStaplesShelf && (
        <div
          id="quick-add-staples-section"
          className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-8 shadow-xs transition-all duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[22px]">inventory</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#0F172A]">
                    Common Household Essentials
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-700">
                    {PRESET_EXISTING_STAPLES.length - remainingStaples.length} / {PRESET_EXISTING_STAPLES.length} Added
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Add individual staples directly to your inventory with one click.
                </p>
              </div>
            </div>

            {remainingStaples.length > 0 && (
              <button
                id="btn-add-all-remaining-staples"
                type="button"
                onClick={handleAddAllRemainingStaples}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#0F766E] bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px]">library_add</span>
                <span>Add All Remaining ({remainingStaples.length})</span>
              </button>
            )}
          </div>

          {/* Existing Staples List / Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {PRESET_EXISTING_STAPLES.map((preset) => {
              const existingItem = inventory.find(
                (i) => i.name.toLowerCase() === preset.name.toLowerCase()
              );
              const isAdded = !!existingItem;

              return (
                <div
                  key={preset.name}
                  id={`preset-staple-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    isAdded
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-white border-[#e2e8f0] hover:border-teal-400 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <span className="material-symbols-outlined text-[20px] text-gray-600 p-1.5 rounded-lg bg-gray-100 shrink-0">
                      {preset.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#0F172A] truncate" title={preset.name}>
                        {preset.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 truncate" title={preset.subLocation}>
                        {preset.unit || preset.subLocation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      {preset.category}
                    </span>
                    {isAdded ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (existingItem) {
                            setSelectedId(existingItem.id);
                            setToastMsg(`Viewing "${existingItem.name}" in inventory`);
                            setTimeout(() => setToastMsg(null), 2500);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        title="Already in inventory (click to view)"
                      >
                        <span className="material-symbols-outlined text-[13px]">check</span>
                        <span>In Stock</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddPresetStaple(preset)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors shadow-2xs cursor-pointer"
                        title={`Add ${preset.name} to inventory`}
                      >
                        <span className="material-symbols-outlined text-[13px]">add</span>
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and View Tabs Interface */}
      <div
        id="inventory-filter-bar"
        className="bg-white border border-[#e2e8f0] rounded-2xl p-4 mb-6 shadow-xs flex flex-col gap-3.5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-xl w-fit overflow-x-auto max-w-full">
            <button
              id="filter-tab-all"
              type="button"
              onClick={() => {
                setFilterMode('all');
                setSelectedCategory('All');
                setSelectedLocation('All');
                setSelectedStatus('All');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-gray-600 hover:text-[#0F172A]'
              }`}
            >
              All Items ({inventory.length})
            </button>
            <button
              id="filter-tab-category"
              type="button"
              onClick={() => setFilterMode('category')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterMode === 'category'
                  ? 'bg-white text-[#0F766E] shadow-xs'
                  : 'text-gray-600 hover:text-[#0F172A]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">category</span>
              <span>Category</span>
            </button>
            <button
              id="filter-tab-location"
              type="button"
              onClick={() => setFilterMode('location')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterMode === 'location'
                  ? 'bg-white text-[#0F766E] shadow-xs'
                  : 'text-gray-600 hover:text-[#0F172A]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">room</span>
              <span>Location</span>
            </button>
            <button
              id="filter-tab-status"
              type="button"
              onClick={() => setFilterMode('status')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterMode === 'status'
                  ? 'bg-white text-[#0F766E] shadow-xs'
                  : 'text-gray-600 hover:text-[#0F172A]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Status</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
              search
            </span>
            <input
              id="inventory-search-input"
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search items, tags..."
              className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg py-1.5 pl-9 pr-7 text-xs text-[#0F172A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:bg-white"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sub-Filters based on Active Tab */}
        {filterMode === 'category' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Category:
            </span>
            {categoryOptions.map((cat) => {
              const count =
                cat === 'All'
                  ? inventory.length
                  : inventory.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#0F766E] text-white font-bold shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {filterMode === 'location' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Room / Zone:
            </span>
            {uniqueLocations.map((loc) => {
              const count =
                loc === 'All'
                  ? inventory.length
                  : inventory.filter((i) => i.location.toLowerCase().includes(loc.toLowerCase())).length;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSelectedLocation(loc)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    selectedLocation === loc
                      ? 'bg-[#0F766E] text-white font-bold shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {loc} ({count})
                </button>
              );
            })}
          </div>
        )}

        {filterMode === 'status' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Status Level:
            </span>
            {statusOptions.map((st) => {
              const count =
                st === 'All'
                  ? inventory.length
                  : st === 'Low (<30%)'
                  ? inventory.filter((i) => i.availability <= 30).length
                  : st === 'Adequate (30-70%)'
                  ? inventory.filter((i) => i.availability > 30 && i.availability <= 70).length
                  : st === 'High (>70%)'
                  ? inventory.filter((i) => i.availability > 70).length
                  : inventory.filter((i) => i.badge === 'Staple').length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    selectedStatus === st
                      ? 'bg-[#0F766E] text-white font-bold shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Filter Results Summary Bar if filters active */}
        {(filterMode !== 'all' || searchFilter || selectedCategory !== 'All' || selectedLocation !== 'All' || selectedStatus !== 'All') && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>
              Showing <strong className="text-[#0F172A]">{filteredInventory.length}</strong> of {inventory.length} items
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[#0F766E] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Inventory Cards Grid (Left 8-9 cols) */}
        <div className="md:col-span-8 lg:col-span-8 xl:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInventory.length === 0 ? (
            <div className="col-span-full bg-white border border-[#e2e8f0] rounded-xl p-12 text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-gray-300 text-5xl mb-3">inventory_2</span>
              <h3 className="text-lg font-bold text-[#0F172A] mb-1">
                {inventory.length === 0 ? 'No Inventory Items' : 'No Items Match Filter'}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mb-4">
                {inventory.length === 0
                  ? 'Your inventory is currently empty. Add your household staples or supplies to start tracking.'
                  : 'Try adjusting your category, location, or status filter to see other inventory items.'}
              </p>
              {inventory.length > 0 ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 bg-[#0F766E] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#115E59]"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Reset Filters
                </button>
              ) : (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 bg-[#0F766E] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#115E59]"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add First Item
                </button>
              )}
            </div>
          ) : (
            filteredInventory.map((item) => {
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

                    <div className="flex items-center gap-1.5">
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
                      <button
                        id={`btn-delete-inv-${item.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteInventoryItem(item.id);
                        }}
                        className="opacity-60 hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title={`Delete ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
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
            })
          )}
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
              onClick={() => {
                setToastMsg('Predictive Usage Analytics is synchronized with household history.');
                setTimeout(() => setToastMsg(null), 3500);
              }}
              className="mt-4 text-[#006a63] text-xs font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
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
                    onClick={() => {
                      setToastMsg(`Managing settings for ${selectedItem.name}`);
                      setTimeout(() => setToastMsg(null), 3000);
                    }}
                    className="text-gray-400 hover:text-gray-700 cursor-pointer"
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

              <div className="p-5 bg-gray-50/70 border-t border-[#e2e8f0] flex flex-col sm:flex-row gap-2.5">
                <button
                  id="btn-add-item-to-shopping"
                  type="button"
                  onClick={() => handleAddSelectedToShopping(selectedItem)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-98 ${
                    isJustAdded
                      ? 'bg-emerald-600 text-white border border-emerald-700 shadow-sm'
                      : existingShoppingItem
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white border border-[#e2e8f0] text-[#0F172A] hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isJustAdded
                      ? 'check_circle'
                      : existingShoppingItem
                      ? 'playlist_add_check'
                      : 'add_shopping_cart'}
                  </span>
                  <span>
                    {isJustAdded
                      ? 'Added to Shopping!'
                      : existingShoppingItem
                      ? `On List (${existingShoppingItem.quantity}) • Add More`
                      : 'Add to Shopping'}
                  </span>
                </button>
                <button
                  id="btn-delete-selected-item"
                  type="button"
                  onClick={() => onDeleteInventoryItem(selectedItem.id)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors cursor-pointer"
                  title="Delete inventory item"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  <span>Delete</span>
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
            {/* Quick Pick Existing Staples in Modal */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Quick-Pick From Common Essentials:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-gray-50 rounded-lg border border-gray-100">
                {PRESET_EXISTING_STAPLES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700 hover:border-teal-500 hover:text-[#0F766E] transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px] text-gray-400">
                      {preset.icon}
                    </span>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
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
