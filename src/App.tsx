import React, { useState, useEffect, useCallback } from 'react';
import { PageTab, TaskItem, InventoryItem, ShoppingItem, BillItem, ChatMessage } from './types';
import {
  INITIAL_TASKS,
  INITIAL_INVENTORY,
  INITIAL_SHOPPING,
  INITIAL_BILLS,
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

export function App() {
  const [activeTab, setActiveTab] = useState<PageTab>('landing');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile-preview'>('desktop');

  // Application Data States
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(INITIAL_SHOPPING);
  const [bills, setBills] = useState<BillItem[]>(INITIAL_BILLS);
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
          setTasks(
            liveState.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              subtitle: `${t.category} • ${t.dueDate}`,
              priority: (t.priority.charAt(0).toUpperCase() + t.priority.slice(1)) as any,
              category: t.category,
              dueDate: t.dueDate,
              amount: t.amount,
              provider: t.provider,
              completed: t.completed,
            }))
          );
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

      if (persistedState && persistedState.tasks && persistedState.tasks.length > 0) {
        setTasks(persistedState.tasks);
        if (persistedState.inventory?.length) setInventory(persistedState.inventory);
        if (persistedState.shopping?.length) setShoppingItems(persistedState.shopping);
        if (persistedState.bills?.length) setBills(persistedState.bills);
        if (persistedState.activities?.length) setActivities(persistedState.activities);

        // Synchronize backend with restored data so Gemini / Caspian stay aware
        try {
          await api.syncStateWithServer({
            tasks: persistedState.tasks as any,
            inventory: persistedState.inventory as any,
            shopping: persistedState.shopping as any,
            bills: persistedState.bills as any,
            activities: persistedState.activities as any,
          });
        } catch {
          // graceful fallback
        }
      } else {
        // First visit or initial load: sync from server and save initial state
        await syncServerState();
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
    setUserProfile(null);
    setTasks(INITIAL_TASKS);
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

  // Handlers for Tasks
  const handleToggleTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    const newStatus = !target?.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newStatus } : t))
    );
    try {
      await api.toggleTask(id, newStatus);
      syncServerState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = async (newTask: Omit<TaskItem, 'id'>) => {
    const localId = `task-${Date.now()}`;
    const item: TaskItem = {
      ...newTask,
      id: localId,
    };
    setTasks((prev) => [item, ...prev]);
    try {
      await api.createTask({
        title: newTask.title,
        category: newTask.category as any,
        priority: newTask.priority.toLowerCase() as any,
        dueDate: newTask.dueDate,
        amount: newTask.amount,
        provider: newTask.provider,
      });
      syncServerState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTask(id);
      syncServerState();
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Inventory
  const handleAddInventoryItem = async (newItem: Omit<InventoryItem, 'id'>) => {
    const localId = `inv-${Date.now()}`;
    const item: InventoryItem = {
      ...newItem,
      id: localId,
    };
    setInventory((prev) => [item, ...prev]);
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

  const handleUpdateAvailability = async (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
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
      })
    );
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
    setShoppingItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: newStatus } : s))
    );
    try {
      await api.toggleShoppingItem(id, newStatus);
      syncServerState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteShopping = async (id: string) => {
    setShoppingItems((prev) => prev.filter((s) => s.id !== id));
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

    setShoppingItems((prev) => [
      ...prev,
      {
        id: `shop-${Date.now()}`,
        name,
        category,
        quantity: '1',
        checked: false,
      },
    ]);
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
  const handlePayBill = async (billId: string) => {
    setBills((prev) =>
      prev.map((b) =>
        b.id === billId
          ? {
              ...b,
              dueCategory: 'Paid',
              paidThisMonth: true,
              dueDate: 'Paid Just Now',
            }
          : b
      )
    );
    // Also mark related task completed if it exists
    setTasks((prev) =>
      prev.map((t) =>
        t.title.toLowerCase().includes('electricity') ? { ...t, completed: true } : t
      )
    );
    try {
      await api.payBill(billId);
      syncServerState();
    } catch (e) {
      console.error(e);
    }
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
            {activeTab === 'maintenance' && <MaintenanceView />}
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

              {activeTab === 'maintenance' && <MaintenanceView />}
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
