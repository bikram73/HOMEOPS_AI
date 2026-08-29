import React, { useState } from 'react';
import { PageTab, TaskItem, InventoryItem, ShoppingItem, BillItem, ChatMessage } from './types';
import {
  INITIAL_TASKS,
  INITIAL_INVENTORY,
  INITIAL_SHOPPING,
  INITIAL_BILLS,
  INITIAL_CHAT,
  INITIAL_ACTIVITIES,
} from './data/mockData';
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

export function App() {
  const [activeTab, setActiveTab] = useState<PageTab>('landing');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile-preview'>('desktop');

  // Application Data States
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(INITIAL_SHOPPING);
  const [bills, setBills] = useState<BillItem[]>(INITIAL_BILLS);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [activities] = useState(INITIAL_ACTIVITIES);

  // UI state
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Handlers for Tasks
  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (newTask: Omit<TaskItem, 'id'>) => {
    const item: TaskItem = {
      ...newTask,
      id: `task-${Date.now()}`,
    };
    setTasks((prev) => [item, ...prev]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers for Inventory
  const handleAddInventoryItem = (newItem: Omit<InventoryItem, 'id'>) => {
    const item: InventoryItem = {
      ...newItem,
      id: `inv-${Date.now()}`,
    };
    setInventory((prev) => [item, ...prev]);
  };

  const handleUpdateAvailability = (id: string, delta: number) => {
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
  };

  // Handlers for Shopping
  const handleToggleShopping = (id: string) => {
    setShoppingItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s))
    );
  };

  const handleDeleteShopping = (id: string) => {
    setShoppingItems((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddShoppingItem = (name: string, category: string) => {
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
  };

  const handleAddAllLowToShopping = () => {
    const lowItems = inventory.filter((i) => i.availability <= 30);
    lowItems.forEach((item) => {
      handleAddShoppingItem(item.name, `${item.category} • Refill`);
    });
  };

  // Handlers for Bills
  const handlePayBill = (billId: string) => {
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
  };

  // AI Chat Handler
  const handleSendChatMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg]);

    // Intelligent context response matching HomeOps AI tone
    setTimeout(() => {
      let replyText = "I've reviewed your household telemetry. Everything is running smoothly.";
      const lower = text.toLowerCase();

      if (lower.includes('detergent') || lower.includes('low') || lower.includes('stock')) {
        replyText =
          "I've updated your inventory records and placed refill requests on your Shopping list.";
        handleAddShoppingItem('Laundry Detergent', 'Cleaning • Liquid, 2L');
      } else if (lower.includes('urgent') || lower.includes('today') || lower.includes('what should i do')) {
        replyText =
          "Your top urgent priority is paying the Electricity bill (₹1,850) due tomorrow, followed by completing the pending HVAC check.";
      } else if (lower.includes('bill') || lower.includes('electricity') || lower.includes('pay')) {
        replyText =
          "The City Electricity bill is due tomorrow for ₹1,850. Would you like me to guide you to the Bills panel to pay it now?";
      } else if (lower.includes('shopping') || lower.includes('list') || lower.includes('buy')) {
        replyText = `You currently have ${
          shoppingItems.filter((i) => !i.checked).length
        } items on your shopping list, including Basmati Rice and Toothpaste.`;
      } else if (lower.includes('maintenance') || lower.includes('hvac') || lower.includes('filter')) {
        replyText =
          'Your HVAC filter is due for replacement within the next 3 days. I can schedule a technician or set a reminder.';
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory((prev) => [...prev, assistantMsg]);
    }, 700);
  };

  // Filter tasks or items if search query is active
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col antialiased text-[#191c1e] font-sans selection:bg-[#99efe5] selection:text-[#006f67]">
      {/* Full Dedicated Landing Page Experience */}
      {activeTab === 'landing' ? (
        <LandingPageView onLaunchApp={(tab) => setActiveTab(tab || 'home')} />
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
            />

            {/* View Routers */}
            <main className="flex-1 overflow-y-auto flex flex-col">
              {activeTab === 'home' && (
                <DashboardView
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  inventory={inventory}
                  setActiveTab={setActiveTab}
                  onAddAllLowToShopping={handleAddAllLowToShopping}
                  onSelectTask={(t) => setSelectedTask(t)}
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
                />
              )}

              {activeTab === 'maintenance' && <MaintenanceView />}
            </main>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Help & Guide Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

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
