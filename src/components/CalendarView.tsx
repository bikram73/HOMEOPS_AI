import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Search,
  ArrowRight,
  Bot,
  Smartphone,
  User as UserIcon,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Receipt,
  ShoppingCart,
  Package,
  CheckSquare,
  History,
  X,
  CalendarDays,
  Zap,
  Check,
  RotateCcw,
  DollarSign,
  Layers,
  ExternalLink,
  Home,
} from 'lucide-react';
import {
  ActivityEvent,
  ActivityType,
  ActivitySource,
  PageTab,
  TaskItem,
  BillItem,
  InventoryItem,
  ShoppingItem,
  MaintenanceItem,
} from '../types';
import {
  getAllActivities,
  recordActivityEvent,
  getLocalDateString,
  formatLocalTime,
} from '../utils/activityStore';

interface CalendarViewProps {
  tasks?: TaskItem[];
  bills?: BillItem[];
  inventory?: InventoryItem[];
  shoppingItems?: ShoppingItem[];
  maintenance?: MaintenanceItem[];
  setActiveTab?: (tab: PageTab) => void;
  onAskAiAboutDate?: (dateStr: string) => void;
  onAddTask?: (task: Omit<TaskItem, 'id'>) => void;
  onToggleTask?: (id: string) => void;
  onAddBill?: (bill: Omit<BillItem, 'id'>) => void;
  onPayBill?: (id: string) => void;
  onAddShoppingItem?: (name: string, category?: string, date?: string) => void;
  onToggleShoppingItem?: (id: string) => void;
  onAddInventoryItem?: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdateAvailability?: (id: string, delta: number) => void;
  onAddMaintenance?: (item: Omit<MaintenanceItem, 'id'>) => void;
  onCompleteMaintenance?: (id: string) => void;
}

// Helper to determine if a date string/keyword matches target YYYY-MM-DD
export const isDateMatch = (
  dateField: string | undefined,
  targetDateStr: string,
  todayStr: string,
  tomorrowStr: string
): boolean => {
  if (!dateField) return false;
  const str = dateField.trim().toLowerCase();

  // 1. Direct match (YYYY-MM-DD)
  if (str === targetDateStr) return true;

  // 2. Relative strings
  if (targetDateStr === todayStr && (str.includes('today') || str.includes('due today'))) return true;
  if (targetDateStr === tomorrowStr && (str.includes('tomorrow') || str.includes('due tomorrow'))) return true;

  // 3. Month & day matching e.g. "Sep 11", "September 11", "11th"
  const targetDate = new Date(targetDateStr + 'T00:00:00');
  if (!isNaN(targetDate.getTime())) {
    const dayNum = targetDate.getDate();
    const monthShort = targetDate.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
    const monthLong = targetDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();

    if (
      str.includes(`${monthShort} ${dayNum}`) ||
      str.includes(`${monthLong} ${dayNum}`) ||
      str.includes(`${monthShort} ${String(dayNum).padStart(2, '0')}`) ||
      str.includes(`${dayNum} ${monthShort}`)
    ) {
      return true;
    }

    const ordinal =
      dayNum === 1 || dayNum === 21 || dayNum === 31
        ? `${dayNum}st`
        : dayNum === 2 || dayNum === 22
        ? `${dayNum}nd`
        : dayNum === 3 || dayNum === 23
        ? `${dayNum}rd`
        : `${dayNum}th`;

    if (str.includes(ordinal) || str.includes(`due: ${ordinal}`) || str.includes(`${dayNum}th of`)) {
      return true;
    }
  }

  return false;
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks = [],
  bills = [],
  inventory = [],
  shoppingItems = [],
  maintenance = [],
  setActiveTab,
  onAskAiAboutDate,
  onAddTask,
  onToggleTask,
  onAddBill,
  onPayBill,
  onAddShoppingItem,
  onToggleShoppingItem,
  onAddInventoryItem,
  onUpdateAvailability,
  onAddMaintenance,
  onCompleteMaintenance,
}) => {
  const todayStr = getLocalDateString(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  // Calendar date states
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() =>
    getLocalDateString(new Date())
  );

  // Computed relative states for selected date
  const isTodaySelected = selectedDateStr === todayStr;
  const isPastDate = selectedDateStr < todayStr;
  const isUpcomingDate = selectedDateStr > todayStr;
  const canAddOnSelected = selectedDateStr >= todayStr;

  // Activities data
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTabSection, setActiveTabSection] = useState<
    'all' | 'tasks' | 'bills' | 'maintenance' | 'inventory' | 'shopping' | 'audit'
  >('all');

  // Unified Add Item Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addModalTab, setAddModalTab] = useState<
    'task' | 'bill' | 'maintenance' | 'shopping' | 'inventory' | 'log'
  >('task');
  const [addModalDate, setAddModalDate] = useState<string>(selectedDateStr);
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // Form states inside Add Modal
  // Task
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskCategory, setTaskCategory] = useState<string>('Household');
  const [taskPriority, setTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [taskAmount, setTaskAmount] = useState<string>('');

  // Bill
  const [billName, setBillName] = useState<string>('');
  const [billAmount, setBillAmount] = useState<string>('');
  const [billProvider, setBillProvider] = useState<string>('');
  const [billAutoPay, setBillAutoPay] = useState<boolean>(false);

  // Maintenance
  const [maintTitle, setMaintTitle] = useState<string>('');
  const [maintSystem, setMaintSystem] = useState<string>('HVAC');
  const [maintInterval, setMaintInterval] = useState<string>('Every 3 months');

  // Shopping
  const [shoppingName, setShoppingName] = useState<string>('');
  const [shoppingCategory, setShoppingCategory] = useState<string>('Groceries');
  const [shoppingQuantity, setShoppingQuantity] = useState<string>('1 item');

  // Inventory
  const [invName, setInvName] = useState<string>('');
  const [invCategory, setInvCategory] = useState<string>('Pantry');
  const [invLocation, setInvLocation] = useState<string>('Kitchen');
  const [invAvailability, setInvAvailability] = useState<number>(100);

  // Activity Log
  const [logType, setLogType] = useState<ActivityType>('task');
  const [logTitle, setLogTitle] = useState<string>('');
  const [logDescription, setLogDescription] = useState<string>('');
  const [logEntityName, setLogEntityName] = useState<string>('');
  const [logBefore, setLogBefore] = useState<string>('');
  const [logAfter, setLogAfter] = useState<string>('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load activities on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getAllActivities();
        setActivities(data);
      } catch (err) {
        console.error('Failed to load activities:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Show toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getLocalDateString(today));
  };

  // Map activities by date string for fast lookup
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    activities.forEach((act) => {
      const existing = map.get(act.date) || [];
      existing.push(act);
      map.set(act.date, existing);
    });
    return map;
  }, [activities]);

  // Comprehensive entity collector for any target date
  const getItemsForDate = (targetDateStr: string) => {
    // 1. Tasks
    const dayTasks = tasks.filter((t) => {
      if (t.date === targetDateStr) return true;
      if (isDateMatch(t.dueDate, targetDateStr, todayStr, tomorrowStr)) return true;
      return activities.some(
        (a) =>
          a.date === targetDateStr &&
          a.type === 'task' &&
          (a.entityId === t.id || a.entityName?.toLowerCase() === t.title.toLowerCase())
      );
    });

    // 2. Bills
    const dayBills = bills.filter((b) => {
      if (b.date === targetDateStr) return true;
      if (isDateMatch(b.dueDate, targetDateStr, todayStr, tomorrowStr)) return true;
      if (targetDateStr === todayStr && (b.dueCategory === 'Due Soon' || b.paidThisMonth)) return true;
      if (targetDateStr === tomorrowStr && b.dueCategory === 'Due Tomorrow') return true;
      return activities.some(
        (a) =>
          a.date === targetDateStr &&
          a.type === 'bill' &&
          (a.entityId === b.id || a.entityName?.toLowerCase() === b.name.toLowerCase())
      );
    });

    // 3. Maintenance
    const dayMaintenance = maintenance.filter((m) => {
      if (m.date === targetDateStr) return true;
      if (isDateMatch(m.nextDue, targetDateStr, todayStr, tomorrowStr)) return true;
      if (isDateMatch(m.lastDone, targetDateStr, todayStr, tomorrowStr)) return true;
      if (
        targetDateStr === todayStr &&
        (m.status === 'Due Soon' || m.status === 'Overdue' || m.lastDone === 'Today')
      )
        return true;
      if (targetDateStr === tomorrowStr && m.nextDue?.toLowerCase().includes('tomorrow'))
        return true;
      return activities.some(
        (a) =>
          a.date === targetDateStr &&
          a.type === 'maintenance' &&
          (a.entityId === m.id || a.entityName?.toLowerCase() === m.title.toLowerCase())
      );
    });

    // 4. Inventory
    const dayInventory = inventory.filter((item) => {
      if (item.date === targetDateStr) return true;
      if (isDateMatch(item.lastRestocked, targetDateStr, todayStr, tomorrowStr)) return true;
      const hasAct = activities.some(
        (a) =>
          a.date === targetDateStr &&
          a.type === 'inventory' &&
          (a.entityId === item.id || a.entityName?.toLowerCase() === item.name.toLowerCase())
      );
      if (hasAct) return true;
      if (
        targetDateStr === todayStr &&
        (item.badge === 'Low' ||
          item.availability <= 35 ||
          item.lastRestocked?.toLowerCase().includes('today'))
      ) {
        return true;
      }
      return false;
    });

    // 5. Shopping
    const dayShopping = shoppingItems.filter((item) => {
      if (item.date === targetDateStr) return true;
      if (isDateMatch(item.dueDate, targetDateStr, todayStr, tomorrowStr)) return true;
      const hasAct = activities.some(
        (a) =>
          a.date === targetDateStr &&
          a.type === 'shopping' &&
          (a.entityId === item.id || a.entityName?.toLowerCase() === item.name.toLowerCase())
      );
      if (hasAct) return true;
      if (targetDateStr === todayStr && !item.checked) return true;
      return false;
    });

    // 6. Activities
    const dayActivities = activitiesByDate.get(targetDateStr) || [];

    const totalCount =
      dayTasks.length +
      dayBills.length +
      dayMaintenance.length +
      dayInventory.length +
      dayShopping.length +
      dayActivities.filter(
        (a) => !['task', 'bill', 'maintenance', 'inventory', 'shopping'].includes(a.type)
      ).length;

    return {
      tasks: dayTasks,
      bills: dayBills,
      maintenance: dayMaintenance,
      inventory: dayInventory,
      shopping: dayShopping,
      activities: dayActivities,
      totalCount,
      hasTask: dayTasks.length > 0,
      hasBill: dayBills.length > 0,
      hasMaintenance: dayMaintenance.length > 0,
      hasInventory: dayInventory.length > 0,
      hasShopping: dayShopping.length > 0,
      hasAiOrTelegram: dayActivities.some((e) => e.source === 'ai' || e.source === 'telegram'),
    };
  };

  // Precompute day data map for current month
  const monthDaysData = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getItemsForDate>>();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      map.set(dateStr, getItemsForDate(dateStr));
    }
    return map;
  }, [
    year,
    month,
    daysInMonth,
    tasks,
    bills,
    maintenance,
    inventory,
    shoppingItems,
    activities,
    todayStr,
    tomorrowStr,
  ]);

  // Selected date's full household details
  const selectedDayItems = useMemo(() => {
    return getItemsForDate(selectedDateStr);
  }, [
    selectedDateStr,
    tasks,
    bills,
    maintenance,
    inventory,
    shoppingItems,
    activities,
    todayStr,
    tomorrowStr,
  ]);

  // Formatted selected date for headers
  const formattedSelectedDate = useMemo(() => {
    try {
      const d = new Date(selectedDateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  // Open Add modal with specific category preset
  const openAddModal = (
    tab: 'task' | 'bill' | 'maintenance' | 'shopping' | 'inventory' | 'log'
  ) => {
    setAddModalTab(tab);
    setAddModalDate(canAddOnSelected ? selectedDateStr : todayStr);
    setAddModalError(null);
    setIsAddModalOpen(true);
  };

  // Submit Handler for Unified Add Modal
  const handleSaveAddModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddModalError(null);

    const finalDate = addModalDate || selectedDateStr;
    if (finalDate < todayStr) {
      setAddModalError(
        'Items can only be scheduled or logged for today or upcoming days. Past dates are read-only.'
      );
      return;
    }

    let displayDueDate = finalDate;
    if (finalDate === todayStr) {
      displayDueDate = 'Today';
    } else if (finalDate === tomorrowStr) {
      displayDueDate = 'Tomorrow';
    }

    try {
      if (addModalTab === 'task') {
        if (!taskTitle.trim()) {
          setAddModalError('Please enter a task title');
          return;
        }
        if (onAddTask) {
          onAddTask({
            title: taskTitle.trim(),
            subtitle: `${displayDueDate} • ${taskCategory}`,
            priority: taskPriority,
            category: taskCategory,
            dueDate: finalDate,
            date: finalDate,
            amount: taskAmount ? (taskAmount.startsWith('₹') || taskAmount.startsWith('$') ? taskAmount : `₹${taskAmount}`) : undefined,
            completed: false,
          });
        }
        const act = await recordActivityEvent({
          type: 'task',
          action: 'task_scheduled_on_calendar',
          title: `Scheduled task: ${taskTitle.trim()}`,
          description: `Due on ${displayDueDate} (${taskPriority} priority, ${taskCategory})`,
          entityName: taskTitle.trim(),
          date: finalDate,
          source: 'user',
        });
        setActivities((prev) => [act, ...prev]);
        setTaskTitle('');
        setTaskAmount('');
        showToast(`Task scheduled for ${displayDueDate}!`);
      } else if (addModalTab === 'bill') {
        if (!billName.trim() || !billAmount.trim()) {
          setAddModalError('Please enter bill name and amount');
          return;
        }
        const amtStr = billAmount.startsWith('₹') || billAmount.startsWith('$') ? billAmount : `₹${billAmount}`;
        if (onAddBill) {
          onAddBill({
            name: billName.trim(),
            amount: amtStr,
            dueDate: finalDate,
            date: finalDate,
            dueCategory: finalDate === tomorrowStr ? 'Due Tomorrow' : 'Due Soon',
            isAutoPay: billAutoPay,
            icon: 'receipt',
          });
        }
        const act = await recordActivityEvent({
          type: 'bill',
          action: 'bill_scheduled_on_calendar',
          title: `Scheduled bill: ${billName.trim()} (${amtStr})`,
          description: `Due date set to ${displayDueDate}`,
          entityName: billName.trim(),
          date: finalDate,
          source: 'user',
        });
        setActivities((prev) => [act, ...prev]);
        setBillName('');
        setBillAmount('');
        setBillProvider('');
        showToast(`Bill scheduled for ${displayDueDate}!`);
      } else if (addModalTab === 'maintenance') {
        if (!maintTitle.trim()) {
          setAddModalError('Please enter maintenance service title');
          return;
        }
        if (onAddMaintenance) {
          onAddMaintenance({
            title: maintTitle.trim(),
            system: maintSystem,
            interval: maintInterval,
            lastDone: 'Not yet completed',
            nextDue: finalDate,
            date: finalDate,
            status: 'Due Soon',
            icon: 'build',
          });
        }
        const act = await recordActivityEvent({
          type: 'maintenance',
          action: 'maintenance_scheduled_on_calendar',
          title: `Scheduled service: ${maintTitle.trim()}`,
          description: `System: ${maintSystem} • Interval: ${maintInterval}`,
          entityName: maintTitle.trim(),
          date: finalDate,
          source: 'user',
        });
        setActivities((prev) => [act, ...prev]);
        setMaintTitle('');
        showToast(`Maintenance scheduled for ${displayDueDate}!`);
      } else if (addModalTab === 'shopping') {
        if (!shoppingName.trim()) {
          setAddModalError('Please enter item name');
          return;
        }
        if (onAddShoppingItem) {
          onAddShoppingItem(shoppingName.trim(), shoppingCategory, finalDate);
        }
        const act = await recordActivityEvent({
          type: 'shopping',
          action: 'shopping_item_added',
          title: `Added to shopping list: ${shoppingName.trim()}`,
          description: `Quantity: ${shoppingQuantity} • Category: ${shoppingCategory}`,
          entityName: shoppingName.trim(),
          date: finalDate,
          source: 'user',
        });
        setActivities((prev) => [act, ...prev]);
        setShoppingName('');
        showToast(`Item added to shopping list for ${displayDueDate}!`);
      } else if (addModalTab === 'inventory') {
        if (!invName.trim()) {
          setAddModalError('Please enter inventory item name');
          return;
        }
        if (onAddInventoryItem) {
          onAddInventoryItem({
            name: invName.trim(),
            category: invCategory,
            location: invLocation,
            availability: invAvailability,
            badge: invAvailability <= 30 ? 'Low' : 'Normal',
            icon: 'inventory_2',
            unit: 'units',
            lastRestocked: displayDueDate,
            date: finalDate,
          });
        }
        const act = await recordActivityEvent({
          type: 'inventory',
          action: 'inventory_item_added',
          title: `Added inventory item: ${invName.trim()}`,
          description: `Location: ${invLocation} • Initial stock: ${invAvailability}%`,
          entityName: invName.trim(),
          date: finalDate,
          source: 'user',
        });
        setActivities((prev) => [act, ...prev]);
        setInvName('');
        showToast(`Inventory item added for ${displayDueDate}!`);
      } else if (addModalTab === 'log') {
        if (!logTitle.trim()) {
          setAddModalError('Please enter an action title');
          return;
        }
        const act = await recordActivityEvent({
          type: logType,
          action: `manual_${logType}_recorded`,
          title: logTitle.trim(),
          description: logDescription.trim() || undefined,
          entityName: logEntityName.trim() || undefined,
          before: logBefore.trim() || undefined,
          after: logAfter.trim() || undefined,
          diff:
            logBefore && logAfter
              ? { before: logBefore, after: logAfter, field: 'manual_change' }
              : undefined,
          date: finalDate,
          source: 'user',
        });
        setActivities((prev) => [act, ...prev]);
        setLogTitle('');
        setLogDescription('');
        setLogEntityName('');
        setLogBefore('');
        setLogAfter('');
        showToast('Activity successfully logged into history!');
      }

      setIsAddModalOpen(false);
      setAddModalError(null);
    } catch (err) {
      console.error('Failed to add item:', err);
      setAddModalError('Failed to save item. Please try again.');
    }
  };

  // Helper for source details
  const getSourceDetails = (source?: ActivitySource) => {
    switch (source) {
      case 'ai':
        return {
          label: 'HomeOps AI',
          icon: <Bot className="w-3.5 h-3.5 text-purple-600" />,
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'telegram':
        return {
          label: 'Telegram Bot',
          icon: <Smartphone className="w-3.5 h-3.5 text-sky-600" />,
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'automation':
        return {
          label: 'Automation',
          icon: <Zap className="w-3.5 h-3.5 text-amber-600" />,
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'system':
        return {
          label: 'System Sync',
          icon: <History className="w-3.5 h-3.5 text-slate-600" />,
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        };
      default:
        return {
          label: 'User',
          icon: <UserIcon className="w-3.5 h-3.5 text-emerald-600" />,
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
    }
  };

  // Filter items on selected date based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return selectedDayItems.tasks;
    const q = searchQuery.toLowerCase().trim();
    return selectedDayItems.tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.subtitle?.toLowerCase().includes(q)
    );
  }, [selectedDayItems.tasks, searchQuery]);

  const filteredBills = useMemo(() => {
    if (!searchQuery.trim()) return selectedDayItems.bills;
    const q = searchQuery.toLowerCase().trim();
    return selectedDayItems.bills.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.amount.toLowerCase().includes(q) ||
        b.dueDate.toLowerCase().includes(q)
    );
  }, [selectedDayItems.bills, searchQuery]);

  const filteredMaintenance = useMemo(() => {
    if (!searchQuery.trim()) return selectedDayItems.maintenance;
    const q = searchQuery.toLowerCase().trim();
    return selectedDayItems.maintenance.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.system.toLowerCase().includes(q) ||
        m.interval.toLowerCase().includes(q)
    );
  }, [selectedDayItems.maintenance, searchQuery]);

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return selectedDayItems.inventory;
    const q = searchQuery.toLowerCase().trim();
    return selectedDayItems.inventory.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
    );
  }, [selectedDayItems.inventory, searchQuery]);

  const filteredShopping = useMemo(() => {
    if (!searchQuery.trim()) return selectedDayItems.shopping;
    const q = searchQuery.toLowerCase().trim();
    return selectedDayItems.shopping.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [selectedDayItems.shopping, searchQuery]);

  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return selectedDayItems.activities;
    const q = searchQuery.toLowerCase().trim();
    return selectedDayItems.activities.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.entityName?.toLowerCase().includes(q)
    );
  }, [selectedDayItems.activities, searchQuery]);

  // Overall counts for summary chips
  const totalMonthActivities = activities.length;
  const automatedCount = activities.filter(
    (a) => a.source === 'ai' || a.source === 'telegram' || a.source === 'automation'
  ).length;
  const userCount = activities.filter((a) => a.source === 'user').length;

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1400px] mx-auto w-full overflow-y-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0F766E] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Quick Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Household Calendar & Schedule
            </h1>
            <span className="bg-teal-50 text-[#0F766E] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              Unified Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track and schedule tasks, bills, maintenance, inventory, and shopping across every date.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Ask AI Button */}
          <button
            id="btn-ask-ai-calendar"
            onClick={() => {
              if (onAskAiAboutDate) {
                onAskAiAboutDate(selectedDateStr);
              } else if (setActiveTab) {
                setActiveTab('assistant');
              }
            }}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title="Ask AI what changed on this date"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Ask AI: What Happened?</span>
          </button>

          {/* Quick Add for Selected Date */}
          <button
            id="btn-schedule-calendar-item"
            onClick={() => openAddModal('task')}
            className="bg-[#0F766E] hover:bg-[#115E59] active:scale-98 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            title={canAddOnSelected ? `Add item for ${selectedDateStr}` : 'Add item for today'}
          >
            <Plus className="w-4 h-4" />
            <span>{canAddOnSelected ? 'Add Item for Date' : 'Add Item (Today)'}</span>
          </button>

          {/* Log Action Button */}
          <button
            id="btn-log-household-activity"
            onClick={() => openAddModal('log')}
            className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 active:scale-98 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
            title={canAddOnSelected ? `Log activity for ${selectedDateStr}` : 'Log activity for today'}
          >
            <CalendarIcon className="w-4 h-4 text-[#0F766E]" />
            <span>Log Action</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Stat Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0F172A]">{totalMonthActivities}</div>
            <div className="text-xs text-gray-500 font-medium">Recorded Events</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0F172A]">{automatedCount}</div>
            <div className="text-xs text-gray-500 font-medium">AI & Automations</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0F172A]">{userCount}</div>
            <div className="text-xs text-gray-500 font-medium">User Actions</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0F172A]">
              {selectedDayItems.totalCount}
            </div>
            <div className="text-xs text-gray-500 font-medium">Items on Selected Date</div>
          </div>
        </div>
      </div>

      {/* Main Calendar Layout (Month Grid on Left, Day Details & Management on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendar Grid (7 cols) - Focused Element */}
        <div
          id="calendar-grid-container"
          className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between"
        >
          <div>
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                  {monthNames[month]} {year}
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Monthly Grid
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="btn-calendar-prev-month"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  id="btn-calendar-today"
                  onClick={handleTodayClick}
                  className="px-2.5 py-1 text-xs font-semibold text-[#0F766E] hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  id="btn-calendar-next-month"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-gray-400 mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Day Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Previous Month trailing days */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
                const dayNum = daysInPrevMonth - firstDayOfMonth + idx + 1;
                return (
                  <div
                    key={`prev-${idx}`}
                    className="h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl text-gray-300 bg-gray-50/50 flex flex-col justify-between text-xs select-none"
                  >
                    <span>{dayNum}</span>
                  </div>
                );
              })}

              {/* Current Month days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                  dayNum
                ).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === todayStr;

                const dayData = monthDaysData.get(dateStr) || getItemsForDate(dateStr);
                const eventCount = dayData.totalCount;

                return (
                  <div
                    key={`day-${dayNum}`}
                    id={`calendar-cell-${dateStr}`}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none relative group ${
                      isSelected
                        ? 'border-[#0F766E] bg-[#F0FDFA] ring-2 ring-[#0F766E]/20 shadow-xs'
                        : isToday
                        ? 'border-emerald-300 bg-emerald-50/40 hover:border-[#0F766E]'
                        : eventCount > 0
                        ? 'border-gray-200 bg-white hover:border-[#0F766E]/50 hover:bg-gray-50/80 shadow-2xs'
                        : 'border-transparent bg-gray-50/40 hover:bg-gray-100/70 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-bold flex items-center justify-center w-6 h-6 rounded-full ${
                          isSelected
                            ? 'bg-[#0F766E] text-white'
                            : isToday
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-800'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {/* Event Count Pill */}
                      {eventCount > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-[#0F766E] text-white'
                              : 'bg-teal-100 text-[#0F766E]'
                          }`}
                        >
                          {eventCount}
                        </span>
                      )}
                    </div>

                    {/* Color-Coded Entity Indicator Dots */}
                    {eventCount > 0 ? (
                      <div className="flex items-center gap-1 mt-auto pt-1 flex-wrap">
                        {dayData.hasTask && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                            title={`${dayData.tasks.length} Task(s)`}
                          />
                        )}
                        {dayData.hasBill && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-rose-500"
                            title={`${dayData.bills.length} Bill(s)`}
                          />
                        )}
                        {dayData.hasMaintenance && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                            title={`${dayData.maintenance.length} Maintenance service(s)`}
                          />
                        )}
                        {dayData.hasInventory && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-teal-500"
                            title={`${dayData.inventory.length} Inventory item(s)`}
                          />
                        )}
                        {dayData.hasShopping && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-500"
                            title={`${dayData.shopping.length} Shopping item(s)`}
                          />
                        )}
                        {dayData.hasAiOrTelegram && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-purple-500"
                            title="AI / Bot activity"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-normal">quiet</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Indicators:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Tasks
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Bills
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Maintenance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500" /> Inventory
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Shopping
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> AI / Automation
            </span>
          </div>
        </div>

        {/* Right Column: Selected Date Details & Household Reflection (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col h-full">
          {/* Day Header */}
          <div className="pb-4 border-b border-gray-200/80">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                    {formattedSelectedDate}
                  </h3>
                  {isTodaySelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Today • Active
                    </span>
                  )}
                  {isUpcomingDate && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      Upcoming Date
                    </span>
                  )}
                  {isPastDate && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                      <History className="w-3 h-3 text-amber-700" />
                      Past Date • Read-Only
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedDayItems.totalCount}{' '}
                  {selectedDayItems.totalCount === 1 ? 'item / event' : 'items & events'} reflected on this date
                </p>
              </div>

              {/* Action Buttons for Selected Date */}
              {canAddOnSelected && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => openAddModal('task')}
                    className="bg-[#0F766E] hover:bg-[#115E59] active:scale-98 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                    title="Add item for this date"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openAddModal('task')}
                      className="text-[11px] px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-medium border border-emerald-200 transition-colors cursor-pointer"
                      title="Add Task for this date"
                    >
                      + Task
                    </button>
                    <button
                      onClick={() => openAddModal('bill')}
                      className="text-[11px] px-2 py-1 rounded-md bg-rose-50 text-rose-800 hover:bg-rose-100 font-medium border border-rose-200 transition-colors cursor-pointer"
                      title="Add Bill for this date"
                    >
                      + Bill
                    </button>
                    <button
                      onClick={() => openAddModal('maintenance')}
                      className="text-[11px] px-2 py-1 rounded-md bg-indigo-50 text-indigo-800 hover:bg-indigo-100 font-medium border border-indigo-200 transition-colors cursor-pointer"
                      title="Add Service for this date"
                    >
                      + Service
                    </button>
                    <button
                      onClick={() => openAddModal('inventory')}
                      className="text-[11px] px-2 py-1 rounded-md bg-teal-50 text-teal-800 hover:bg-teal-100 font-medium border border-teal-200 transition-colors cursor-pointer"
                      title="Add Inventory for this date"
                    >
                      + Stock
                    </button>
                    <button
                      onClick={() => openAddModal('shopping')}
                      className="text-[11px] px-2 py-1 rounded-md bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium border border-amber-200 transition-colors cursor-pointer"
                      title="Add Shopping Item for this date"
                    >
                      + Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Read-Only Notice if Past Date */}
            {isPastDate && (
              <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">Historical Record:</span> Viewing past history. Actions and items can only be scheduled for <strong>today or upcoming dates</strong>.
                </div>
              </div>
            )}

            {/* Filter Search Bar */}
            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter items on this date (tasks, bills, inventory)..."
                className="w-full pl-8 pr-7 py-1.5 bg-[#F8FAFC] border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#0F766E] focus:outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter Chips for this Date */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-2.5 scrollbar-hide text-[11px]">
              {[
                { id: 'all', label: `Home Overview (${selectedDayItems.totalCount})` },
                { id: 'tasks', label: `Tasks (${selectedDayItems.tasks.length})` },
                { id: 'bills', label: `Bills (${selectedDayItems.bills.length})` },
                { id: 'maintenance', label: `Maintenance (${selectedDayItems.maintenance.length})` },
                { id: 'inventory', label: `Inventory (${selectedDayItems.inventory.length})` },
                { id: 'shopping', label: `Shopping (${selectedDayItems.shopping.length})` },
                { id: 'audit', label: `Audit Log (${selectedDayItems.activities.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabSection(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeTabSection === tab.id
                      ? 'bg-[#0F766E] text-white font-semibold shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Content Feed for Selected Date */}
          <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-4 max-h-[520px]">
            {/* HOME & HOUSEHOLD OVERVIEW SNAPSHOT ON SELECTED DATE */}
            {activeTabSection === 'all' && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50/70 to-emerald-50/60 border border-teal-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-[#0F766E]" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Home Reflection Snapshot
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-[#0F766E] bg-white/80 px-2 py-0.5 rounded-full border border-teal-200">
                    {selectedDayItems.totalCount} active items & events
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    onClick={() => setActiveTabSection('tasks')}
                    className="p-2 rounded-lg bg-white/90 border border-emerald-200 hover:border-emerald-500 hover:shadow-2xs transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium mb-1">
                      <span>Tasks</span>
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {selectedDayItems.tasks.length}
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTabSection('bills')}
                    className="p-2 rounded-lg bg-white/90 border border-rose-200 hover:border-rose-500 hover:shadow-2xs transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium mb-1">
                      <span>Bills</span>
                      <Receipt className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {selectedDayItems.bills.length}
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTabSection('maintenance')}
                    className="p-2 rounded-lg bg-white/90 border border-indigo-200 hover:border-indigo-500 hover:shadow-2xs transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium mb-1">
                      <span>Service</span>
                      <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {selectedDayItems.maintenance.length}
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTabSection('inventory')}
                    className="p-2 rounded-lg bg-white/90 border border-teal-200 hover:border-teal-500 hover:shadow-2xs transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium mb-1">
                      <span>Inventory</span>
                      <Package className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {selectedDayItems.inventory.length}
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTabSection('shopping')}
                    className="p-2 rounded-lg bg-white/90 border border-amber-200 hover:border-amber-500 hover:shadow-2xs transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium mb-1">
                      <span>Shopping</span>
                      <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {selectedDayItems.shopping.length}
                    </div>
                  </button>
                </div>
              </div>
            )}
            {/* 1. TASKS SECTION */}
            {(activeTabSection === 'all' || activeTabSection === 'tasks') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Tasks ({filteredTasks.length})
                  </h4>
                  {canAddOnSelected && (
                    <button
                      onClick={() => openAddModal('task')}
                      className="text-[11px] font-bold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Task
                    </button>
                  )}
                </div>

                {filteredTasks.length > 0 ? (
                  <div className="space-y-2">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          task.completed
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : 'bg-white border-emerald-200/80 shadow-2xs hover:border-[#0F766E]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {onToggleTask && (
                            <button
                              onClick={() => onToggleTask(task.id)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                task.completed
                                  ? 'bg-[#0F766E] border-[#0F766E] text-white'
                                  : 'border-gray-300 hover:border-[#0F766E]'
                              }`}
                            >
                              {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <div className="min-w-0">
                            <div
                              className={`text-xs font-bold truncate ${
                                task.completed ? 'line-through text-gray-400' : 'text-gray-800'
                              }`}
                            >
                              {task.title}
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-2">
                              <span>{task.category}</span>
                              {task.amount && (
                                <span className="font-semibold text-rose-600">{task.amount}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            task.priority === 'High'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : task.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  activeTabSection === 'tasks' && (
                    <div className="p-3.5 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                      <p className="text-xs text-gray-500">No tasks scheduled for this date</p>
                      {canAddOnSelected && (
                        <button
                          onClick={() => openAddModal('task')}
                          className="mt-1.5 text-xs text-[#0F766E] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Schedule a Task
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {/* 2. BILLS SECTION */}
            {(activeTabSection === 'all' || activeTabSection === 'bills') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-rose-600" />
                    Bills & Payments ({filteredBills.length})
                  </h4>
                  {canAddOnSelected && (
                    <button
                      onClick={() => openAddModal('bill')}
                      className="text-[11px] font-bold text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Bill
                    </button>
                  )}
                </div>

                {filteredBills.length > 0 ? (
                  <div className="space-y-2">
                    {filteredBills.map((bill) => (
                      <div
                        key={bill.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          bill.status === 'Paid' || bill.paidThisMonth
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : 'bg-white border-rose-200 shadow-2xs'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <span>{bill.name}</span>
                            {bill.isAutoPay && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-teal-50 text-[#0F766E] rounded-md font-semibold border border-teal-200">
                                AutoPay
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {bill.provider ? `${bill.provider} • ` : ''}Due: {bill.dueDate}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-xs text-rose-700">{bill.amount}</span>
                          {bill.status === 'Paid' || bill.paidThisMonth ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Paid
                            </span>
                          ) : onPayBill ? (
                            <button
                              onClick={() => onPayBill(bill.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md transition-colors cursor-pointer shadow-2xs"
                            >
                              Pay Now
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  activeTabSection === 'bills' && (
                    <div className="p-3.5 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                      <p className="text-xs text-gray-500">No bills due on this date</p>
                      {canAddOnSelected && (
                        <button
                          onClick={() => openAddModal('bill')}
                          className="mt-1.5 text-xs text-rose-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Bill for Date
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {/* 3. MAINTENANCE SECTION */}
            {(activeTabSection === 'all' || activeTabSection === 'maintenance') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                    Home Maintenance ({filteredMaintenance.length})
                  </h4>
                  {canAddOnSelected && (
                    <button
                      onClick={() => openAddModal('maintenance')}
                      className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Schedule Service
                    </button>
                  )}
                </div>

                {filteredMaintenance.length > 0 ? (
                  <div className="space-y-2">
                    {filteredMaintenance.map((maint) => (
                      <div
                        key={maint.id}
                        className="p-3 rounded-xl border border-indigo-200/80 bg-white shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-800">{maint.title}</div>
                          <div className="text-[10px] text-gray-500">
                            {maint.system} • {maint.interval} • Next: {maint.nextDue}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              maint.status === 'Optimal'
                                ? 'bg-emerald-100 text-emerald-800'
                                : maint.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {maint.status}
                          </span>
                          {maint.status !== 'Optimal' && onCompleteMaintenance && (
                            <button
                              onClick={() => onCompleteMaintenance(maint.id)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-md transition-colors cursor-pointer shadow-2xs"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  activeTabSection === 'maintenance' && (
                    <div className="p-3.5 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                      <p className="text-xs text-gray-500">No maintenance scheduled for this date</p>
                      {canAddOnSelected && (
                        <button
                          onClick={() => openAddModal('maintenance')}
                          className="mt-1.5 text-xs text-indigo-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Schedule Maintenance
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {/* 4. INVENTORY SECTION */}
            {(activeTabSection === 'all' || activeTabSection === 'inventory') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-teal-600" />
                    Inventory Updates ({filteredInventory.length})
                  </h4>
                  {canAddOnSelected && (
                    <button
                      onClick={() => openAddModal('inventory')}
                      className="text-[11px] font-bold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  )}
                </div>

                {filteredInventory.length > 0 ? (
                  <div className="space-y-2">
                    {filteredInventory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-teal-200/80 bg-white shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-800">{item.name}</span>
                            {item.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                  item.badge === 'Low'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {item.location} • Stock: {item.availability}%
                          </div>
                          <div className="w-full bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                item.availability <= 30
                                  ? 'bg-rose-500'
                                  : item.availability <= 60
                                  ? 'bg-amber-500'
                                  : 'bg-teal-500'
                              }`}
                              style={{ width: `${item.availability}%` }}
                            />
                          </div>
                        </div>

                        {onAddShoppingItem && (
                          <button
                            onClick={() => onAddShoppingItem(item.name, item.category)}
                            className="text-[10px] px-2 py-1 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 rounded-md font-semibold cursor-pointer shrink-0"
                            title="Add to Shopping List"
                          >
                            + Shopping
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  activeTabSection === 'inventory' && (
                    <div className="p-3.5 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                      <p className="text-xs text-gray-500">No inventory updates on this date</p>
                      {canAddOnSelected && (
                        <button
                          onClick={() => openAddModal('inventory')}
                          className="mt-1.5 text-xs text-[#0F766E] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Inventory Item
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {/* 5. SHOPPING SECTION */}
            {(activeTabSection === 'all' || activeTabSection === 'shopping') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
                    Shopping List ({filteredShopping.length})
                  </h4>
                  {canAddOnSelected && (
                    <button
                      onClick={() => openAddModal('shopping')}
                      className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  )}
                </div>

                {filteredShopping.length > 0 ? (
                  <div className="space-y-2">
                    {filteredShopping.map((shop) => (
                      <div
                        key={shop.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          shop.checked
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : 'bg-white border-amber-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {onToggleShoppingItem && (
                            <button
                              onClick={() => onToggleShoppingItem(shop.id)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                shop.checked
                                  ? 'bg-[#0F766E] border-[#0F766E] text-white'
                                  : 'border-gray-300 hover:border-[#0F766E]'
                              }`}
                            >
                              {shop.checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <div className="min-w-0">
                            <span
                              className={`text-xs font-bold ${
                                shop.checked ? 'line-through text-gray-400' : 'text-gray-800'
                              }`}
                            >
                              {shop.name}
                            </span>
                            <div className="text-[10px] text-gray-400">
                              {shop.quantity} • {shop.category}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  activeTabSection === 'shopping' && (
                    <div className="p-3.5 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                      <p className="text-xs text-gray-500">No shopping items needed on this date</p>
                      {canAddOnSelected && (
                        <button
                          onClick={() => openAddModal('shopping')}
                          className="mt-1.5 text-xs text-amber-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Shopping Item
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {/* 6. AUDIT LOG & ACTIVITIES SECTION */}
            {(activeTabSection === 'all' || activeTabSection === 'audit') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-purple-600" />
                    Audit Trail & Events ({filteredActivities.length})
                  </h4>
                  {canAddOnSelected && (
                    <button
                      onClick={() => openAddModal('log')}
                      className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Log Event
                    </button>
                  )}
                </div>

                {filteredActivities.length > 0 ? (
                  <div className="space-y-2.5">
                    {filteredActivities.map((event) => {
                      const src = getSourceDetails(event.source);
                      return (
                        <div
                          key={event.id}
                          className="p-3 rounded-xl border border-gray-200 bg-[#FAFBFD] hover:bg-white hover:border-[#0F766E]/40 hover:shadow-xs transition-all space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-[#0F172A]">{event.title}</span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3" /> {event.time || 'Logged'}
                            </span>
                          </div>

                          {event.description && (
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {event.description}
                            </p>
                          )}

                          {/* Before / After Diff */}
                          {(event.before !== undefined || event.after !== undefined) && (
                            <div className="p-1.5 rounded-lg bg-white border border-gray-200 text-xs flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">
                                Change:
                              </span>
                              {event.before !== undefined && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px]">
                                  {String(event.before)}
                                </span>
                              )}
                              <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                              {event.after !== undefined && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px]">
                                  {String(event.after)}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full border font-semibold ${src.badgeClass}`}
                            >
                              {src.icon}
                              <span>{src.label}</span>
                            </span>

                            {event.entityName && (
                              <span className="text-gray-400">
                                Entity: <strong className="text-gray-600">{event.entityName}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  activeTabSection === 'audit' && (
                    <div className="p-3.5 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                      <p className="text-xs text-gray-500">No audit events recorded for this date</p>
                      {canAddOnSelected && (
                        <button
                          onClick={() => openAddModal('log')}
                          className="mt-1.5 text-xs text-purple-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Log an Action
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Completely Empty State if No Items At All on this Date */}
            {selectedDayItems.totalCount === 0 && (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                <CalendarDays className="w-9 h-9 text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-700">
                  No household items or events on this date
                </p>
                {isPastDate ? (
                  <p className="text-[11px] text-amber-700 mt-1 max-w-xs bg-amber-50 p-2 rounded-lg border border-amber-200">
                    This past date has no recorded history.
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                      Schedule tasks, bills, maintenance, shopping, or inventory for this date.
                    </p>
                    <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                      <button
                        onClick={() => openAddModal('task')}
                        className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Task
                      </button>
                      <button
                        onClick={() => openAddModal('bill')}
                        className="px-3 py-1.5 bg-white hover:bg-gray-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Add Bill
                      </button>
                      <button
                        onClick={() => openAddModal('maintenance')}
                        className="px-3 py-1.5 bg-white hover:bg-gray-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" /> Maintenance
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UNIFIED ADD ITEM MODAL (Tasks, Bills, Maintenance, Shopping, Inventory, Log) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#0F766E]" />
                <div>
                  <h3 className="font-bold text-[#0F172A] text-base">Add to Household</h3>
                  <p className="text-[11px] text-gray-500">Scheduled for {formattedSelectedDate}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Switcher Tabs */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mt-4 p-1 bg-gray-100 rounded-xl text-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAddModalTab('task');
                  setAddModalError(null);
                }}
                className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer ${
                  addModalTab === 'task'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Task
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddModalTab('bill');
                  setAddModalError(null);
                }}
                className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer ${
                  addModalTab === 'bill'
                    ? 'bg-white text-rose-700 shadow-2xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bill
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddModalTab('maintenance');
                  setAddModalError(null);
                }}
                className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer ${
                  addModalTab === 'maintenance'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Maint
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddModalTab('shopping');
                  setAddModalError(null);
                }}
                className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer ${
                  addModalTab === 'shopping'
                    ? 'bg-white text-amber-700 shadow-2xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Shopping
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddModalTab('inventory');
                  setAddModalError(null);
                }}
                className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer ${
                  addModalTab === 'inventory'
                    ? 'bg-white text-teal-700 shadow-2xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Inventory
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddModalTab('log');
                  setAddModalError(null);
                }}
                className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer ${
                  addModalTab === 'log'
                    ? 'bg-white text-purple-700 shadow-2xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Log
              </button>
            </div>

            {/* Error Message */}
            {addModalError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addModalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveAddModal} className="space-y-3.5 mt-4 text-xs">
              {/* Common Date Input */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Scheduled Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={addModalDate}
                  min={todayStr}
                  onChange={(e) => setAddModalDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                />
              </div>

              {/* 1. TASK TAB */}
              {addModalTab === 'task' && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Task Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. Inspect water filter, Change hallway bulb"
                      required
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Category</label>
                      <select
                        value={taskCategory}
                        onChange={(e) => setTaskCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      >
                        <option value="Household">Household</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="HVAC">HVAC</option>
                        <option value="Pest Control">Pest Control</option>
                        <option value="Finance">Finance</option>
                        <option value="Safety">Safety</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Priority</label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Estimated Cost (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                        $
                      </span>
                      <input
                        type="number"
                        value={taskAmount}
                        onChange={(e) => setTaskAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-7 pr-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 2. BILL TAB */}
              {addModalTab === 'bill' && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Bill Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={billName}
                      onChange={(e) => setBillName(e.target.value)}
                      placeholder="e.g. Electricity, High-Speed Internet, Water Utility"
                      required
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Amount ($) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        placeholder="e.g. $85.00"
                        required
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Provider</label>
                      <input
                        type="text"
                        value={billProvider}
                        onChange={(e) => setBillProvider(e.target.value)}
                        placeholder="e.g. City Power Co."
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="bill-autopay-check"
                      checked={billAutoPay}
                      onChange={(e) => setBillAutoPay(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                    />
                    <label htmlFor="bill-autopay-check" className="font-semibold text-gray-700 cursor-pointer">
                      Enable AutoPay Reminder
                    </label>
                  </div>
                </>
              )}

              {/* 3. MAINTENANCE TAB */}
              {addModalTab === 'maintenance' && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Maintenance Service <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={maintTitle}
                      onChange={(e) => setMaintTitle(e.target.value)}
                      placeholder="e.g. Replace AC Air Filter, Water Heater Flush"
                      required
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">System</label>
                      <select
                        value={maintSystem}
                        onChange={(e) => setMaintSystem(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      >
                        <option value="HVAC">HVAC</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Appliances">Appliances</option>
                        <option value="Roof & Exterior">Roof & Exterior</option>
                        <option value="Safety & Detectors">Safety & Detectors</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Interval</label>
                      <select
                        value={maintInterval}
                        onChange={(e) => setMaintInterval(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Every 3 months">Every 3 months</option>
                        <option value="Every 6 months">Every 6 months</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* 4. SHOPPING TAB */}
              {addModalTab === 'shopping' && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Item Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shoppingName}
                      onChange={(e) => setShoppingName(e.target.value)}
                      placeholder="e.g. Basmati Rice, Whole Milk, HEPA Filters"
                      required
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Category</label>
                      <select
                        value={shoppingCategory}
                        onChange={(e) => setShoppingCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      >
                        <option value="Groceries">Groceries</option>
                        <option value="Household">Household</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Cleaning">Cleaning</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Quantity</label>
                      <input
                        type="text"
                        value={shoppingQuantity}
                        onChange={(e) => setShoppingQuantity(e.target.value)}
                        placeholder="e.g. 2 bags, 1 gallon"
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 5. INVENTORY TAB */}
              {addModalTab === 'inventory' && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Inventory Item Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={invName}
                      onChange={(e) => setInvName(e.target.value)}
                      placeholder="e.g. Olive Oil, Laundry Detergent"
                      required
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Category</label>
                      <select
                        value={invCategory}
                        onChange={(e) => setInvCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      >
                        <option value="Pantry">Pantry</option>
                        <option value="Fridge">Fridge</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Household">Household</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={invLocation}
                        onChange={(e) => setInvLocation(e.target.value)}
                        placeholder="e.g. Pantry Shelf 2"
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-gray-700">Initial Stock Level</label>
                      <span className="font-bold text-[#0F766E]">{invAvailability}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={invAvailability}
                      onChange={(e) => setInvAvailability(Number(e.target.value))}
                      className="w-full accent-[#0F766E] cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* 6. LOG ACTION TAB */}
              {addModalTab === 'log' && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Action Type
                    </label>
                    <select
                      value={logType}
                      onChange={(e) => setLogType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                    >
                      <option value="task">Task Completion</option>
                      <option value="inventory">Inventory Stock Change</option>
                      <option value="shopping">Shopping Action</option>
                      <option value="bill">Bill Payment</option>
                      <option value="maintenance">Maintenance Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Action Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={logTitle}
                      onChange={(e) => setLogTitle(e.target.value)}
                      placeholder="e.g. Replaced AC filter, Cleaned refrigerator"
                      required
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Entity Name</label>
                    <input
                      type="text"
                      value={logEntityName}
                      onChange={(e) => setLogEntityName(e.target.value)}
                      placeholder="e.g. Living Room AC, Basmati Rice"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Before</label>
                      <input
                        type="text"
                        value={logBefore}
                        onChange={(e) => setLogBefore(e.target.value)}
                        placeholder="e.g. 20%, Pending"
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">After</label>
                      <input
                        type="text"
                        value={logAfter}
                        onChange={(e) => setLogAfter(e.target.value)}
                        placeholder="e.g. 100%, Completed"
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Modal Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0F766E] hover:bg-[#115E59] active:scale-98 text-white font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save to Calendar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
