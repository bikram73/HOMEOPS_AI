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
  Tag,
  Zap,
} from 'lucide-react';
import {
  ActivityEvent,
  ActivityType,
  ActivitySource,
  PageTab,
  TaskItem,
  BillItem,
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
  setActiveTab?: (tab: PageTab) => void;
  onAskAiAboutDate?: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks = [],
  bills = [],
  setActiveTab,
  onAskAiAboutDate,
}) => {
  // Calendar date states
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() =>
    getLocalDateString(new Date())
  );

  // Activities data
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'history' | 'upcoming'>('history');

  // Manual Activity Log Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [logType, setLogType] = useState<ActivityType>('task');
  const [logTitle, setLogTitle] = useState<string>('');
  const [logDescription, setLogDescription] = useState<string>('');
  const [logEntityName, setLogEntityName] = useState<string>('');
  const [logBefore, setLogBefore] = useState<string>('');
  const [logAfter, setLogAfter] = useState<string>('');
  const [logDate, setLogDate] = useState<string>(selectedDateStr);

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

  // Map activities by date string for fast calendar lookup
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    activities.forEach((act) => {
      const existing = map.get(act.date) || [];
      existing.push(act);
      map.set(act.date, existing);
    });
    return map;
  }, [activities]);

  // Map upcoming deadlines by date
  const upcomingByDate = useMemo(() => {
    const map = new Map<string, { type: 'bill' | 'task'; title: string; subtitle: string }[]>();
    
    // Check bills
    bills.forEach((b) => {
      if (b.status !== 'Paid' && b.dueDate) {
        // e.g. "Due Sep 15" or raw date
        map.set(b.dueDate, [
          ...(map.get(b.dueDate) || []),
          { type: 'bill', title: b.name, subtitle: `${b.amount} • ${b.provider}` },
        ]);
      }
    });

    // Check tasks
    tasks.forEach((t) => {
      if (!t.completed && t.dueDate) {
        map.set(t.dueDate, [
          ...(map.get(t.dueDate) || []),
          { type: 'task', title: t.title, subtitle: `${t.priority} • ${t.category}` },
        ]);
      }
    });

    return map;
  }, [bills, tasks]);

  // Selected date activities filtered
  const selectedDateActivities = useMemo(() => {
    const dayActivities = activitiesByDate.get(selectedDateStr) || [];

    return dayActivities.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'ai_caspian') {
          if (item.source !== 'ai' && item.source !== 'telegram') return false;
        } else if (item.type !== selectedCategory) {
          return false;
        }
      }

      // Source filter
      if (selectedSource !== 'all' && item.source !== selectedSource) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchEntity = item.entityName?.toLowerCase().includes(q);
        const matchAction = item.action.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchEntity && !matchAction) return false;
      }

      return true;
    });
  }, [activitiesByDate, selectedDateStr, selectedCategory, selectedSource, searchQuery]);

  // Handle submit manual activity log
  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim()) {
      alert('Please enter an action title');
      return;
    }

    try {
      const newEvent = await recordActivityEvent({
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
        date: logDate || selectedDateStr,
        source: 'user',
      });

      setActivities((prev) => [newEvent, ...prev]);
      setIsLogModalOpen(false);
      setLogTitle('');
      setLogDescription('');
      setLogEntityName('');
      setLogBefore('');
      setLogAfter('');
      showToast('Activity successfully logged into history!');
    } catch (err) {
      console.error('Failed to record activity:', err);
      alert('Failed to save activity record');
    }
  };

  // Helper for source icon & badge
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

  // Helper for activity type icon
  const getActivityTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      case 'inventory':
        return <Package className="w-4 h-4 text-teal-600" />;
      case 'shopping':
        return <ShoppingCart className="w-4 h-4 text-amber-600" />;
      case 'bill':
        return <Receipt className="w-4 h-4 text-rose-600" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-indigo-600" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'telegram':
        return <Smartphone className="w-4 h-4 text-sky-600" />;
      default:
        return <History className="w-4 h-4 text-slate-600" />;
    }
  };

  // Format selected date nicely (e.g. "Thursday, September 10, 2026")
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateStr) return '';
    const parts = selectedDateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return selectedDateStr;
  }, [selectedDateStr]);

  const isTodaySelected = selectedDateStr === getLocalDateString(new Date());

  // Overall statistics
  const totalActivitiesCount = activities.length;
  const automatedCount = activities.filter(
    (a) => a.source === 'ai' || a.source === 'automation' || a.source === 'telegram'
  ).length;
  const userCount = activities.filter((a) => a.source === 'user').length;

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-[1440px] mx-auto w-full space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-8 z-50 bg-[#0F766E] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
              <CalendarDays className="w-8 h-8 text-[#0F766E]" />
              <span>Activity Calendar & Change History</span>
            </h2>
            <span className="px-3 py-1 bg-teal-50 text-[#0F766E] border border-teal-200 rounded-full text-xs font-semibold">
              Household Audit
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            See what happened, what changed, and on which date across all tasks, inventory, bills,
            and automations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Ask AI Trigger */}
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
            <span>Ask AI: What Changed?</span>
          </button>

          {/* Log New Activity Button */}
          <button
            id="btn-log-household-activity"
            onClick={() => {
              setLogDate(selectedDateStr);
              setIsLogModalOpen(true);
            }}
            className="bg-[#0F766E] hover:bg-[#115E59] active:scale-98 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Activity</span>
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
            <div className="text-xl font-bold text-[#0F172A]">{totalActivitiesCount}</div>
            <div className="text-xs text-gray-500 font-medium">Total Changes Recorded</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0F172A]">{automatedCount}</div>
            <div className="text-xs text-gray-500 font-medium">Automated / AI Logs</div>
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
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0F172A]">
              {activitiesByDate.get(selectedDateStr)?.length || 0}
            </div>
            <div className="text-xs text-gray-500 font-medium">Selected Date Events</div>
          </div>
        </div>
      </div>

      {/* Main Calendar Layout (Month Grid on Left, Timeline on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendar Grid (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                  {monthNames[month]} {year}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
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
                const isToday = dateStr === getLocalDateString(new Date());
                const dayEvents = activitiesByDate.get(dateStr) || [];
                const eventCount = dayEvents.length;

                // Check types of events on this day for color dots
                const hasTask = dayEvents.some((e) => e.type === 'task');
                const hasInventory = dayEvents.some((e) => e.type === 'inventory');
                const hasBill = dayEvents.some((e) => e.type === 'bill');
                const hasShopping = dayEvents.some((e) => e.type === 'shopping');
                const hasMaintenance = dayEvents.some((e) => e.type === 'maintenance');
                const hasAiOrTelegram = dayEvents.some(
                  (e) => e.source === 'ai' || e.source === 'telegram'
                );

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

                    {/* Color-Coded Activity Dots */}
                    {eventCount > 0 ? (
                      <div className="flex items-center gap-1 mt-auto pt-1 flex-wrap">
                        {hasTask && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Task completed" />}
                        {hasInventory && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" title="Inventory change" />}
                        {hasShopping && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Shopping list" />}
                        {hasBill && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Bill event" />}
                        {hasMaintenance && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Maintenance" />}
                        {hasAiOrTelegram && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="AI / Telegram" />}
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
              <span className="w-2 h-2 rounded-full bg-teal-500" /> Inventory
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Shopping
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Bills
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Maintenance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> AI / Caspian
            </span>
          </div>
        </div>

        {/* Right Column: Day Timeline & Audit Trail (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col h-full">
          {/* Day Header */}
          <div className="pb-4 border-b border-gray-200/80">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                    {formattedSelectedDate}
                  </h3>
                  {isTodaySelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedDateActivities.length}{' '}
                  {selectedDateActivities.length === 1 ? 'change' : 'changes'} recorded for this day
                </p>
              </div>

              {/* View switch button (History vs Upcoming) */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setViewMode('history')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    viewMode === 'history'
                      ? 'bg-white text-[#0F766E] shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Audit History
                </button>
                <button
                  onClick={() => setViewMode('upcoming')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    viewMode === 'upcoming'
                      ? 'bg-white text-[#0F766E] shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Schedule
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="mt-3 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter changes (e.g. rice, bill, filter)..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#0F766E] focus:outline-hidden transition-all"
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

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[11px]">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'task', label: 'Tasks' },
                  { id: 'inventory', label: 'Inventory' },
                  { id: 'shopping', label: 'Shopping' },
                  { id: 'bill', label: 'Bills' },
                  { id: 'maintenance', label: 'Maintenance' },
                  { id: 'ai_caspian', label: 'AI/Bot' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#0F766E] text-white font-semibold'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 max-h-[520px]">
            {viewMode === 'history' ? (
              selectedDateActivities.length > 0 ? (
                selectedDateActivities.map((event) => {
                  const src = getSourceDetails(event.source);
                  const typeIcon = getActivityTypeIcon(event.type);

                  return (
                    <div
                      key={event.id}
                      className="p-3.5 rounded-xl border border-gray-200/90 bg-[#FAFBFD] hover:bg-white hover:border-[#0F766E]/40 hover:shadow-xs transition-all space-y-2 group"
                    >
                      {/* Top row: Type, Title, Time, Source */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-md bg-white border border-gray-200/80 shadow-2xs">
                            {typeIcon}
                          </span>
                          <span className="text-xs font-bold text-[#0F172A] leading-tight">
                            {event.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {event.description && (
                        <p className="text-xs text-gray-600 pl-7 leading-relaxed">
                          {event.description}
                        </p>
                      )}

                      {/* Before / After Diff Visualizer */}
                      {(event.before !== undefined || event.after !== undefined) && (
                        <div className="ml-7 p-2 rounded-lg bg-white border border-gray-200/70 text-xs flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Change:
                          </span>
                          {event.before !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[11px]">
                              {typeof event.before === 'object'
                                ? JSON.stringify(event.before)
                                : String(event.before)}
                            </span>
                          )}
                          <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                          {event.after !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[11px]">
                              {typeof event.after === 'object'
                                ? JSON.stringify(event.after)
                                : String(event.after)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Source & Entity Badge Row */}
                      <div className="flex items-center justify-between pl-7 pt-1 text-[10px]">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-semibold ${src.badgeClass}`}
                        >
                          {src.icon}
                          <span>{src.label}</span>
                        </span>

                        {event.entityName && (
                          <span className="text-gray-400 font-medium">
                            Entity: <strong className="text-gray-600">{event.entityName}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <CalendarDays className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-gray-700">
                    No household changes recorded for this date
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                    Actions you complete in tasks, inventory, shopping, bills, or Telegram will
                    appear here.
                  </p>
                  <button
                    onClick={() => {
                      setLogDate(selectedDateStr);
                      setIsLogModalOpen(true);
                    }}
                    className="mt-3 px-3 py-1.5 bg-white hover:bg-gray-100 text-[#0F766E] border border-[#99efe5] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log a change for this day</span>
                  </button>
                </div>
              )
            ) : (
              /* Upcoming Deadlines / Schedule Tab */
              <div className="space-y-3">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-[#0F766E] font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Household deadlines &amp; upcoming schedules</span>
                </div>

                {bills.filter((b) => b.status !== 'Paid').length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Pending Bills
                    </h4>
                    {bills
                      .filter((b) => b.status !== 'Paid')
                      .map((bill) => (
                        <div
                          key={bill.id}
                          className="p-3 rounded-xl border border-rose-200 bg-rose-50/30 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-gray-800">{bill.name}</div>
                            <div className="text-[11px] text-gray-500">
                              {bill.provider} • Due: {bill.dueDate}
                            </div>
                          </div>
                          <span className="font-bold text-xs text-rose-700">{bill.amount}</span>
                        </div>
                      ))}
                  </div>
                )}

                {tasks.filter((t) => !t.completed).length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Pending Tasks
                    </h4>
                    {tasks
                      .filter((t) => !t.completed)
                      .slice(0, 5)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-semibold text-gray-800">{task.title}</div>
                            <div className="text-[11px] text-gray-400">
                              {task.category} • {task.dueDate}
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {task.priority}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Activity Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#0F766E]" />
                <h3 className="font-bold text-[#0F172A] text-base">Log Household Activity</h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Category / Action Type
                </label>
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value as ActivityType)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                >
                  <option value="task">Task Completion / Update</option>
                  <option value="inventory">Inventory Stock Change</option>
                  <option value="shopping">Shopping List Action</option>
                  <option value="bill">Bill Payment / Due Record</option>
                  <option value="maintenance">Maintenance Service</option>
                  <option value="ai">AI / Automation Change</option>
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
                  placeholder="e.g. Replaced AC filter, Paid Internet bill, Updated rice"
                  required
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Entity Name</label>
                  <input
                    type="text"
                    value={logEntityName}
                    onChange={(e) => setLogEntityName(e.target.value)}
                    placeholder="e.g. Living Room AC, Rice"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description / Notes</label>
                <textarea
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="Additional details about what was completed or changed..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden resize-none"
                />
              </div>

              {/* Before / After */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Before Value</label>
                  <input
                    type="text"
                    value={logBefore}
                    onChange={(e) => setLogBefore(e.target.value)}
                    placeholder="e.g. 70%, Pending, ₹1,200"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">After Value</label>
                  <input
                    type="text"
                    value={logAfter}
                    onChange={(e) => setLogAfter(e.target.value)}
                    placeholder="e.g. 20%, Paid, 0 kg"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0F766E] outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0F766E] hover:bg-[#115E59] active:scale-98 text-white font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Activity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
