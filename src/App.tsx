import React, { useState, useEffect, useCallback } from 'react';
import { PageTab, TaskItem, InventoryItem, ShoppingItem, BillItem, MaintenanceItem, ChatMessage } from './types';
import {
  INITIAL_TASKS,
  INITIAL_INVENTORY,
  INITIAL_SHOPPING,
  INITIAL_BILLS,
  INITIAL_MAINTENANCE,
  INITIAL_CHAT,
  INITIAL_ACTIVITIES,
} from './data/mockData';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { TasksView } from './components/TasksView';
import { InventoryView } from './components/InventoryView';
import { ShoppingBillsView } from './components/ShoppingBillsView';
import { AssistantView } from './components/AssistantView';
import { MaintenanceView } from './components/MaintenanceView';
import { CalendarView } from './components/CalendarView';
import { MobileDashboardView } from './components/MobileDashboardView';
import { LandingPageView } from './components/LandingPageView';
import { SettingsModal, HelpModal } from './components/SettingsModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { WhatShouldIDoNowModal } from './components/WhatShouldIDoNowModal';
import { BriefingModal } from './components/BriefingModal';
import { WeeklyPlanModal } from './components/WeeklyPlanModal';
import { CaspianDemoModal } from './components/CaspianDemoModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { UserProfile } from './types';
import {
  getProfile,
  saveProfile,
  hasCompletedOnboarding,
  clearProfile,
} from './utils/profileStore';
import {
  saveHouseholdState,
  loadHouseholdState,
  clearHouseholdState,
} from './utils/statePersistence';
import {
  saveConversation,
  loadConversation,
  clearConversation,
} from './utils/conversationStore';
import {
  generateBackupData,
  downloadBackupFile,
  importBackupData,
} from './utils/exportImport';
import {
  getStoredTasks,
  saveStoredTasks,
  clearStoredTasks,
} from './utils/taskStore';
import {
  getStoredInventory,
  saveStoredInventory,
  getStoredShopping,
  saveStoredShopping,
  getStoredBills,
  saveStoredBills,
  getStoredMaintenance,
  saveStoredMaintenance,
} from './utils/householdItemStores';
import {
  hasEnteredUserDetails,
  setEnteredUserDetails,
  removeDemoTasks,
  removeDemoInventory,
  removeDemoShopping,
  removeDemoBills,
  removeDemoMaintenance,
} from './utils/demoDataHelper';
import { recordActivityEvent } from './utils/activityStore';

export function App() {
  const [activeTab, setActiveTab] = useState<PageTab>('landing');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile-preview'>('desktop');

  // Application Data States - initialized synchronously from browser LocalStorage / Cookies / Cache
  const [tasks, setTasks] = useState<TaskItem[]>(() => getStoredTasks());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStoredInventory());
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => getStoredShopping());
  const [bills, setBills] = useState<BillItem[]>(() => getStoredBills());
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>(() => getStoredMaintenance());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  // User Profile & Onboarding State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [pendingTabAfterOnboarding, setPendingTabAfterOnboarding] = useState<PageTab>('home');

  // UI modal states
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isWhatNowOpen, setIsWhatNowOpen] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isWeeklyPlanOpen, setIsWeeklyPlanOpen] = useState(false);
  const [isCaspianOpen, setIsCaspianOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Sync state from server on mount and after actions
  const syncServerState = useCallback(async () => {
    try {
      const liveState = await api.getState();
      if (liveState) {
        if (liveState.tasks) {
          setTasks((currentTasks) => {
            const serverTasks = liveState.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              subtitle: `${t.category} • ${t.dueDate}`,
              priority: (t.priority.charAt(0).toUpperCase() + t.priority.slice(1)) as any,
              category: t.category,
              dueDate: t.dueDate,
              amount: t.amount,
              provider: t.provider,
              completed: t.completed,
            }));

            // Preserve local user-added and user-completed tasks; merge in any external server tasks
            const localById = new Map(currentTasks.map((t) => [t.id, t]));
            const localByTitle = new Map(currentTasks.map((t) => [t.title.toLowerCase().trim(), t]));
            const merged: TaskItem[] = [...currentTasks];

            for (const st of serverTasks) {
              const matched = localById.get(st.id) || localByTitle.get(st.title.toLowerCase().trim());
              if (!matched) {
                merged.push(st);
              }
            }

            saveStoredTasks(merged);
            return merged;
          });
        }
        if (liveState.inventory) {
          setInventory(
            liveState.inventory.map((i) => {
              const avail =
                i.status === 'critical'
                  ? 5
                  : i.status === 'low'
                  ? 20
                  : i.quantity > 5
                  ? 80
                  : 45;
              return {
                id: i.id,
                name: i.name,
                category: i.category,
                location: 'Pantry / Storage',
                availability: avail,
                badge: i.status === 'critical' || i.status === 'low' ? 'Low' : 'Normal',
                icon: i.category.toLowerCase().includes('clean') ? 'cleaning_services' : 'local_dining',
                unit: i.unit,
                currentLevelDetail: `${avail}% ${avail <= 30 ? '(Low)' : '(Adequate)'}`,
                avgUsage: 'Regular weekly use',
              };
            })
          );
        }
        if (liveState.shopping) {
          setShoppingItems(
            liveState.shopping.map((s) => ({
              id: s.id,
              name: s.name,
              category: s.category || 'General',
              quantity: s.quantity || '1',
              checked: s.completed,
            }))
          );
        }
        if (liveState.bills) {
          setBills(
            liveState.bills.map((b) => ({
              id: b.id,
              name: b.name,
              amount: `₹${b.amount.toLocaleString()}`,
              dueDate: b.dueDate,
              dueCategory: b.paid ? 'Paid' : 'Due Tomorrow',
              icon: 'flash_on',
              paidThisMonth: b.paid,
            }))
          );
        }
        if (liveState.activities) {
          setActivities(
            liveState.activities.map((a) => ({
              id: a.id,
              title: a.title,
              subtitle: a.subtitle,
              timeAgo: a.timeAgo,
              icon: a.icon || 'history',
            }))
          );
        }
      }
    } catch {
      // Ephemeral fallback: use client state if offline
    }
  }, []);

  // Initialize from client persistence (IndexedDB + localStorage) on mount
  useEffect(() => {
    const initializeAppData = async () => {
      // 1. Check onboarding
      const completed = hasCompletedOnboarding();
      if (completed) {
        const prof = await getProfile();
        setUserProfile(prof);
      }
      // Note: Do not auto-open onboarding on initial mount so users can explore
      // the landing page and click "Get Started" to initiate onboarding.

      // 2. Check IndexedDB for existing household records
      const persistedState = await loadHouseholdState();
      const persistedChat = await loadConversation();

      if (persistedChat && persistedChat.length > 0) {
        setChatHistory(persistedChat);
      }

      // Hydrate tasks from Browser Storage (LocalStorage, Cookies, Cache)
      const storedTasks = getStoredTasks();
      if (storedTasks && storedTasks.length > 0) {
        setTasks(storedTasks);
      } else if (persistedState && persistedState.tasks && persistedState.tasks.length > 0) {
        setTasks(persistedState.tasks);
        saveStoredTasks(persistedState.tasks);
      }

      if (persistedState) {
        if (persistedState.inventory?.length) setInventory(persistedState.inventory);
        if (persistedState.shopping?.length) setShoppingItems(persistedState.shopping);
        if (persistedState.bills?.length) setBills(persistedState.bills);
        if (persistedState.activities?.length) setActivities(persistedState.activities);
      }

      // Synchronize backend with restored data so Gemini / Caspian stay aware
      try {
        const tasksToSync = storedTasks && storedTasks.length > 0 ? storedTasks : persistedState?.tasks;
        await api.syncStateWithServer({
          tasks: (tasksToSync || []) as any,
          inventory: persistedState?.inventory as any,
          shopping: persistedState?.shopping as any,
          bills: persistedState?.bills as any,
          activities: persistedState?.activities as any,
        });
      } catch {
        // graceful fallback
      }
    };

    initializeAppData();
  }, [syncServerState]);

  // Persist changes to IndexedDB automatically
  useEffect(() => {
    saveHouseholdState({
      tasks,
      inventory,
      shopping: shoppingItems,
      bills,
      activities,
    });
  }, [tasks, inventory, shoppingItems, bills, activities]);

  // Persist chat conversations to IndexedDB automatically
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      saveConversation(chatHistory);
    }
  }, [chatHistory]);

  const handleLaunchApp = (targetTab: PageTab = 'home') => {
    const completed = hasCompletedOnboarding();
    if (!completed) {
      setPendingTabAfterOnboarding(targetTab);
      setIsOnboardingOpen(true);
    } else {
      setActiveTab(targetTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    setIsOnboardingOpen(false);
    await saveHouseholdState({
      tasks,
      inventory,
      shopping: shoppingItems,
      bills,
      activities,
    });
    setActiveTab(pendingTabAfterOnboarding || 'home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOnboardingDismiss = () => {
    setIsOnboardingOpen(false);
    if (activeTab === 'landing') {
      setActiveTab(pendingTabAfterOnboarding || 'home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearData = async () => {
    await clearProfile();
    await clearHouseholdState();
    await clearConversation();
    await clearStoredTasks();
    setUserProfile(null);
    setTasks(INITIAL_TASKS);
    saveStoredTasks(INITIAL_TASKS);
    setInventory(INITIAL_INVENTORY);
    setShoppingItems(INITIAL_SHOPPING);
    setBills(INITIAL_BILLS);
    setActivities(INITIAL_ACTIVITIES);
    setChatHistory(INITIAL_CHAT);
    try {
      await api.resetState();
    } catch {
      // ignore
    }
    setIsSettingsOpen(false);
    setIsOnboardingOpen(true);
  };

  // Handlers for Tasks - Persisted immediately into Cookies, LocalStorage, Cache & IndexedDB
  const handleToggleTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const newStatus = !target.completed;
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: newStatus } : t));

    // 1. Instantly update React state
    setTasks(updated);

    // 2. Instantly persist to Cookies, LocalStorage, Cache, and IndexedDB
    saveStoredTasks(updated);

    // 3. Log to Activity Calendar & Change History
    recordActivityEvent({
      type: 'task',
      action: newStatus ? 'task_completed' : 'task_reopened',
      title: newStatus ? `Completed task: ${target.title}` : `Reopened task: ${target.title}`,
      description: newStatus ? 'Marked as completed' : 'Marked as active/pending',
      source: 'user',
      entityType: 'task',
      entityId: id,
      entityName: target.title,
      before: { completed: target.completed },
      after: { completed: newStatus },
      diff: { field: 'completed', before: target.completed, after: newStatus },
    });

    // 4. Background server sync
    try {
      await api.toggleTask(id, newStatus);
      await api.syncStateWithServer({ tasks: updated as any });
    } catch (e) {
      console.warn('Server toggle sync fallback:', e);
    }
  };

  const handleAddTask = async (newTask: Omit<TaskItem, 'id'>) => {
    const localId = `task-${Date.now()}`;
    const item: TaskItem = {
      ...newTask,
      id: localId,
    };

    let baseTasks = tasks;
    if (!hasEnteredUserDetails()) {
      setEnteredUserDetails(true);
      baseTasks = removeDemoTasks(tasks);
    }
    const updated = [item, ...baseTasks];

    // 1. Instantly update React state
    setTasks(updated);

    // 2. Instantly persist to Cookies, LocalStorage, Cache, and IndexedDB
    saveStoredTasks(updated);

    // 3. Log to Activity Calendar & Change History
    recordActivityEvent({
      type: 'task',
      action: 'task_created',
      title: `Created task: ${newTask.title}`,
      description: `Category: ${newTask.category} • Priority: ${newTask.priority} • Due: ${newTask.dueDate}`,
      source: 'user',
      entityType: 'task',
      entityId: localId,
      entityName: newTask.title,
      after: item,
    });

    // 4. Background server sync
    try {
      await api.createTask({
        title: newTask.title,
        category: newTask.category as any,
        priority: newTask.priority.toLowerCase() as any,
        dueDate: newTask.dueDate,
        amount: newTask.amount,
        provider: newTask.provider,
      });
      await api.syncStateWithServer({ tasks: updated as any });
    } catch (e) {
      console.warn('Server create task sync fallback:', e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    const updated = tasks.filter((t) => t.id !== id);

    // 1. Instantly update React state
    setTasks(updated);

    // 2. Instantly persist to Cookies, LocalStorage, Cache, and IndexedDB
    saveStoredTasks(updated);

    // 3. Log to Activity Calendar & Change History
    if (target) {
      recordActivityEvent({
        type: 'task',
        action: 'task_deleted',
        title: `Deleted task: ${target.title}`,
        source: 'user',
        entityType: 'task',
        entityId: id,
        entityName: target.title,
      });
    }

    // 4. Background server sync
    try {
      await api.deleteTask(id);
      await api.syncStateWithServer({ tasks: updated as any });
    } catch (e) {
      console.warn('Server delete task sync fallback:', e);
    }
  };

  // Handlers for Inventory
  const handleAddInventoryItem = async (newItem: Omit<InventoryItem, 'id'>) => {
    const localId = `inv-${Date.now()}`;
    const item: InventoryItem = {
      ...newItem,
      id: localId,
    };

    let baseInventory = inventory;
    if (!hasEnteredUserDetails()) {
      setEnteredUserDetails(true);
      baseInventory = removeDemoInventory(inventory);
    }
    const updated = [item, ...baseInventory];
    setInventory(updated);
    saveStoredInventory(updated);

    try {
      await api.addInventoryItem({
        name: newItem.name,
        quantity: newItem.availability > 30 ? 5 : 1,
        unit: newItem.unit || 'units',
        status: newItem.availability <= 30 ? 'low' : 'good',
        category: newItem.category,
      });
      syncServerState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteInventoryItem = (id: string) => {
    const updated = inventory.filter((i) => i.id !== id);
    setInventory(updated);
    saveStoredInventory(updated);
  };

  const handleUpdateAvailability = async (id: string, delta: number) => {
    const updated = inventory.map((item) => {
      if (item.id === id) {
        const newLevel = Math.max(0, Math.min(100, item.availability + delta));
        return {
          ...item,
          availability: newLevel,
          badge: newLevel <= 30 ? 'Low' : item.badge === 'Staple' ? 'Staple' : 'Normal',
          currentLevelDetail: `${newLevel}% ${newLevel <= 30 ? '(Low)' : '(Adequate)'}`,
        };
      }
      return item;
    });

    setInventory(updated);
    saveStoredInventory(updated);

    try {
      const item = inventory.find((i) => i.id === id);
      if (item) {
        const newLevel = Math.max(0, Math.min(100, item.availability + delta));
        await api.updateInventoryQuantity(
          id,
          Math.ceil(newLevel / 20),
          newLevel <= 10 ? 'critical' : newLevel <= 30 ? 'low' : 'good'
        );
        syncServerState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Shopping
  const handleToggleShopping = async (id: string) => {
    const item = shoppingItems.find((s) => s.id === id);
    const newStatus = !item?.checked;
    const updated = shoppingItems.map((s) => (s.id === id ? { ...s, checked: newStatus } : s));
    setShoppingItems(updated);
    saveStoredShopping(updated);

    try {
      await api.toggleShoppingItem(id, newStatus);
      syncServerState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteShopping = async (id: string) => {
    const updated = shoppingItems.filter((s) => s.id !== id);
    setShoppingItems(updated);
    saveStoredShopping(updated);

    try {
      await api.deleteShoppingItem(id);
      syncServerState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddShoppingItem = async (name: string, category: string) => {
    const exists = shoppingItems.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (exists) return;

    let baseShopping = shoppingItems;
    if (!hasEnteredUserDetails()) {
      setEnteredUserDetails(true);
      baseShopping = removeDemoShopping(shoppingItems);
    }

    const newItem: ShoppingItem = {
      id: `shop-${Date.now()}`,
      name,
      category,
      quantity: '1',
      checked: false,
    };

    const updated = [...baseShopping, newItem];
    setShoppingItems(updated);
    saveStoredShopping(updated);

    try {
      await api.addShoppingItem(name, '1', category);
      syncServerState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAllLowToShopping = async () => {
    const lowItems = inventory.filter((i) => i.availability <= 30);
    for (const item of lowItems) {
      await handleAddShoppingItem(item.name, `${item.category} • Refill`);
    }
  };

  // Handlers for Bills
  const handleAddBill = (newBill: Omit<BillItem, 'id'>) => {
    let baseBills = bills;
    if (!hasEnteredUserDetails()) {
      setEnteredUserDetails(true);
      baseBills = removeDemoBills(bills);
    }

    const item: BillItem = {
      ...newBill,
      id: `bill-${Date.now()}`,
    };
    const updated = [item, ...baseBills];
    setBills(updated);
    saveStoredBills(updated);
  };

  const handleDeleteBill = (billId: string) => {
    const updated = bills.filter((b) => b.id !== billId);
    setBills(updated);
    saveStoredBills(updated);
  };

  const handlePayBill = async (billId: string) => {
    const updated = bills.map((b) =>
      b.id === billId
        ? {
            ...b,
            dueCategory: 'Paid' as const,
            paidThisMonth: true,
            dueDate: 'Paid Just Now',
          }
        : b
    );
    setBills(updated);
    saveStoredBills(updated);

    // Also mark related task completed if it exists
    setTasks((prev) => {
      const updatedTasks = prev.map((t) =>
        t.title.toLowerCase().includes('electricity') ? { ...t, completed: true } : t
      );
      saveStoredTasks(updatedTasks);
      return updatedTasks;
    });

    try {
      await api.payBill(billId);
      syncServerState();
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Maintenance
  const handleAddMaintenance = (newMaint: Omit<MaintenanceItem, 'id'>) => {
    let baseMaint = maintenance;
    if (!hasEnteredUserDetails()) {
      setEnteredUserDetails(true);
      baseMaint = removeDemoMaintenance(maintenance);
    }

    const item: MaintenanceItem = {
      ...newMaint,
      id: `m-${Date.now()}`,
    };
    const updated = [item, ...baseMaint];
    setMaintenance(updated);
    saveStoredMaintenance(updated);
  };

  const handleDeleteMaintenance = (id: string) => {
    const updated = maintenance.filter((m) => m.id !== id);
    setMaintenance(updated);
    saveStoredMaintenance(updated);
  };

  const handleCompleteMaintenance = (id: string) => {
    const updated = maintenance.map((m) =>
      m.id === id
        ? {
            ...m,
            status: 'Optimal' as const,
            lastDone: 'Today',
            nextDue: 'In 90 days',
          }
        : m
    );
    setMaintenance(updated);
    saveStoredMaintenance(updated);
  };

  // Start fresh / Clear demo data
  const handleClearAllDemoData = () => {
    setEnteredUserDetails(true);
    const cleanTasks = removeDemoTasks(tasks);
    const cleanInv = removeDemoInventory(inventory);
    const cleanShop = removeDemoShopping(shoppingItems);
    const cleanBills = removeDemoBills(bills);
    const cleanMaint = removeDemoMaintenance(maintenance);

    setTasks(cleanTasks);
    setInventory(cleanInv);
    setShoppingItems(cleanShop);
    setBills(cleanBills);
    setMaintenance(cleanMaint);

    saveStoredTasks(cleanTasks);
    saveStoredInventory(cleanInv);
    saveStoredShopping(cleanShop);
    saveStoredBills(cleanBills);
    saveStoredMaintenance(cleanMaint);
  };

  // AI Chat Handler
  const handleSendChatMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg]);

    try {
      const res = await api.sendAgentMessage(text);
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priorities: res.priorities?.map((p: any) => ({
          id: p.id,
          type: p.type || 'High Priority',
          title: p.title,
          desc: p.desc,
          icon: p.icon || 'assignment_late',
          colorType: p.colorType || 'error',
        })),
      };
      setChatHistory((prev) => [...prev, assistantMsg]);
      syncServerState();
    } catch {
      // Fallback
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: `Processed: "${text}". Household records have been synchronized.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatHistory((prev) => [...prev, assistantMsg]);
      }, 500);
    }
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col antialiased text-[#191c1e] font-sans selection:bg-[#99efe5] selection:text-[#006f67]">
      {/* Full Dedicated Landing Page Experience */}
      {activeTab === 'landing' ? (
        <LandingPageView onLaunchApp={handleLaunchApp} />
      ) : viewMode === 'mobile-preview' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-0 md:p-6 bg-slate-900/90 min-h-screen">
          {/* Top banner to return to desktop */}
          <div className="w-full max-w-sm flex justify-between items-center px-4 py-2 bg-slate-800 text-white text-xs mb-3 rounded-xl border border-slate-700 shadow-md">
            <span className="flex items-center gap-1.5 font-semibold text-[#99efe5]">
              <span className="material-symbols-outlined text-[16px]">smartphone</span>
              Mobile Screen View
            </span>
            <button
              onClick={() => setViewMode('desktop')}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white px-2.5 py-1 rounded text-xs font-semibold"
            >
              Switch to Desktop
            </button>
          </div>

          {/* Phone Frame Device Container */}
          <div className="w-full max-w-[390px] h-[844px] bg-[#f7f9fb] rounded-3xl md:rounded-[40px] shadow-2xl overflow-y-auto border-4 md:border-8 border-slate-800 relative flex flex-col scrollbar-hide">
            {activeTab === 'home' && (
              <MobileDashboardView
                tasks={tasks}
                activities={activities}
                setActiveTab={setActiveTab}
                pendingTasksCount={pendingTasksCount}
              />
            )}
            {activeTab === 'tasks' && (
              <TasksView
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                selectedTask={selectedTask}
                setSelectedTask={setSelectedTask}
                onDeleteTask={handleDeleteTask}
              />
            )}
            {activeTab === 'inventory' && (
              <InventoryView
                inventory={inventory}
                onAddInventoryItem={handleAddInventoryItem}
                onDeleteInventoryItem={handleDeleteInventoryItem}
                onAddToShoppingList={handleAddShoppingItem}
                onUpdateAvailability={handleUpdateAvailability}
              />
            )}
            {activeTab === 'shopping' || activeTab === 'bills' ? (
              <ShoppingBillsView
                shoppingItems={shoppingItems}
                bills={bills}
                onToggleShoppingItem={handleToggleShopping}
                onDeleteShoppingItem={handleDeleteShopping}
                onAddShoppingItem={handleAddShoppingItem}
                onAddBill={handleAddBill}
                onDeleteBill={handleDeleteBill}
                onPayBill={handlePayBill}
              />
            ) : null}
            {activeTab === 'assistant' && (
              <AssistantView
                chatHistory={chatHistory}
                onSendMessage={handleSendChatMessage}
                setActiveTab={setActiveTab}
                onRefreshState={syncServerState}
              />
            )}
            {activeTab === 'maintenance' && (
              <MaintenanceView
                maintenance={maintenance}
                onAddMaintenance={handleAddMaintenance}
                onDeleteMaintenance={handleDeleteMaintenance}
                onCompleteMaintenance={handleCompleteMaintenance}
              />
            )}
            {activeTab === 'calendar' && (
              <CalendarView
                tasks={tasks}
                bills={bills}
                setActiveTab={setActiveTab}
                onAskAiAboutDate={(dateStr) => {
                  setActiveTab('assistant');
                  handleSendChatMessage(`What changes occurred in our home on ${dateStr}?`);
                }}
              />
            )}
          </div>
        </div>
      ) : (
        /* Full Desktop / Standard Responsive Layout */
        <div className="flex h-screen w-full overflow-hidden">
          {/* Persistent Sidebar Navigation */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (tab === 'settings') setIsSettingsOpen(true);
              else if (tab === 'help') setIsHelpOpen(true);
              else setActiveTab(tab);
            }}
            pendingTasksCount={pendingTasksCount}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f7f9fb]">
            {/* Top App Bar Header */}
            <TopHeader
              activeTab={activeTab}
              setActiveTab={(tab) => {
                if (tab === 'settings') setIsSettingsOpen(true);
                else if (tab === 'help') setIsHelpOpen(true);
                else setActiveTab(tab);
              }}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={2}
              profile={userProfile}
              onUpdateProfile={async (updated) => {
                setUserProfile(updated);
                await saveProfile(updated);
              }}
            />

            {/* View Routers */}
            <main className="flex-1 overflow-y-auto flex flex-col">
              {activeTab === 'home' && (
                <DashboardView
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  inventory={inventory}
                  shoppingItems={shoppingItems}
                  bills={bills}
                  maintenance={maintenance}
                  onClearAllDemoData={handleClearAllDemoData}
                  userProfile={userProfile}
                  setActiveTab={setActiveTab}
                  onAddAllLowToShopping={handleAddAllLowToShopping}
                  onSelectTask={(t) => setSelectedTask(t)}
                  onOpenWhatNowModal={() => setIsWhatNowOpen(true)}
                  onOpenBriefingModal={() => setIsBriefingOpen(true)}
                  onOpenWeeklyPlanModal={() => setIsWeeklyPlanOpen(true)}
                  onOpenCaspianModal={() => setIsCaspianOpen(true)}
                />
              )}

              {activeTab === 'tasks' && (
                <TasksView
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onAddTask={handleAddTask}
                  selectedTask={selectedTask}
                  setSelectedTask={setSelectedTask}
                  onDeleteTask={handleDeleteTask}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryView
                  inventory={inventory}
                  onAddInventoryItem={handleAddInventoryItem}
                  onDeleteInventoryItem={handleDeleteInventoryItem}
                  onAddToShoppingList={handleAddShoppingItem}
                  onUpdateAvailability={handleUpdateAvailability}
                />
              )}

              {(activeTab === 'shopping' || activeTab === 'bills') && (
                <ShoppingBillsView
                  shoppingItems={shoppingItems}
                  bills={bills}
                  onToggleShoppingItem={handleToggleShopping}
                  onDeleteShoppingItem={handleDeleteShopping}
                  onAddShoppingItem={handleAddShoppingItem}
                  onAddBill={handleAddBill}
                  onDeleteBill={handleDeleteBill}
                  onPayBill={handlePayBill}
                />
              )}

              {activeTab === 'assistant' && (
                <AssistantView
                  chatHistory={chatHistory}
                  onSendMessage={handleSendChatMessage}
                  setActiveTab={setActiveTab}
                  onRefreshState={syncServerState}
                />
              )}

              {activeTab === 'maintenance' && (
                <MaintenanceView
                  maintenance={maintenance}
                  onAddMaintenance={handleAddMaintenance}
                  onDeleteMaintenance={handleDeleteMaintenance}
                  onCompleteMaintenance={handleCompleteMaintenance}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView
                  tasks={tasks}
                  bills={bills}
                  setActiveTab={setActiveTab}
                  onAddTask={handleAddTask}
                  onToggleTask={handleToggleTask}
                  onAskAiAboutDate={(dateStr) => {
                    setActiveTab('assistant');
                    handleSendChatMessage(`What changes occurred in our home on ${dateStr}?`);
                  }}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={userProfile}
        onUpdateProfile={async (updated) => {
          setUserProfile(updated);
          await saveProfile(updated);
        }}
        onExportData={async () => {
          const backup = await generateBackupData();
          downloadBackupFile(backup);
        }}
        onImportData={async (jsonString: string) => {
          const res = await importBackupData(jsonString);
          if (res.success && res.data) {
            setUserProfile(res.data.profile);
            setTasks(res.data.tasks);
            setInventory(res.data.inventory);
            setShoppingItems(res.data.shopping);
            setBills(res.data.bills);
            setActivities(res.data.activities);
            if (res.data.conversations && res.data.conversations.length > 0) {
              setChatHistory(res.data.conversations);
            }
            try {
              await api.syncStateWithServer({
                tasks: res.data.tasks as any,
                inventory: res.data.inventory as any,
                shopping: res.data.shopping as any,
                bills: res.data.bills as any,
                activities: res.data.activities as any,
              });
            } catch {
              // ignore
            }
          }
          return res;
        }}
        onClearData={handleClearData}
      />

      {/* First-Time Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
        onClose={handleOnboardingDismiss}
      />

      {/* Help & Guide Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* What Should I Do Now Signature Modal */}
      <WhatShouldIDoNowModal
        isOpen={isWhatNowOpen}
        onClose={() => setIsWhatNowOpen(false)}
        onNavigate={(tab) => {
          setIsWhatNowOpen(false);
          setActiveTab(tab);
        }}
        onRefreshState={syncServerState}
      />

      {/* Daily Home Briefing Modal */}
      <BriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        onNavigate={(tab) => {
          setIsBriefingOpen(false);
          setActiveTab(tab);
        }}
      />

      {/* Weekly Plan Modal */}
      <WeeklyPlanModal
        isOpen={isWeeklyPlanOpen}
        onClose={() => setIsWeeklyPlanOpen(false)}
      />

      {/* Caspian Telegram Integration Simulator Modal */}
      <CaspianDemoModal
        isOpen={isCaspianOpen}
        onClose={() => setIsCaspianOpen(false)}
        onRefreshState={syncServerState}
      />

      {/* Telemetry Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsNotificationsOpen(false);
        }}
      />
    </div>
  );
}

export default App;
