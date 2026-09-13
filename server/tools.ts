import { stateManager } from './state';
import { Task, InventoryItem, ShoppingItem, Bill, MaintenanceTask } from './types';

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
  actionType?: string;
}

export const tools = {
  // Tasks
  createTask: (args: {
    title: string;
    category?: Task['category'];
    priority?: Task['priority'];
    dueDate?: string;
    amount?: string;
    provider?: string;
  }): ToolResult => {
    if (!args.title) return { success: false, message: 'Task title is required' };
    const task = stateManager.addTask(
      args.title,
      args.category || 'general',
      args.priority || 'medium',
      args.dueDate || 'Today',
      args.amount,
      args.provider
    );
    return {
      success: true,
      message: `Created task: "${task.title}" (Priority: ${task.priority}, Category: ${task.category}, Due: ${task.dueDate})`,
      data: task,
      actionType: 'task_created',
    };
  },

  listTasks: (args?: { filter?: 'pending' | 'completed' | 'all' | 'today' | 'urgent'; category?: string }): ToolResult => {
    let tasks = stateManager.getState().tasks;
    if (args?.filter === 'pending') tasks = tasks.filter((t) => !t.completed);
    if (args?.filter === 'completed') tasks = tasks.filter((t) => t.completed);
    if (args?.filter === 'today') tasks = tasks.filter((t) => !t.completed && (t.dueDate?.toLowerCase().includes('today') || t.dueDate?.toLowerCase().includes('due today')));
    if (args?.filter === 'urgent') tasks = tasks.filter((t) => !t.completed && (t.priority === 'high' || t.dueDate?.toLowerCase().includes('today')));
    if (args?.category) tasks = tasks.filter((t) => t.category.toLowerCase() === args.category?.toLowerCase());
    return {
      success: true,
      message: `Found ${tasks.length} tasks`,
      data: tasks,
      actionType: 'tasks_listed',
    };
  },

  updateTask: (args: { idOrTitle: string; title?: string; priority?: Task['priority']; dueDate?: string; category?: Task['category'] }): ToolResult => {
    const task = stateManager.updateTask(args.idOrTitle, args);
    if (!task) return { success: false, message: `Could not find task matching "${args.idOrTitle}"` };
    return {
      success: true,
      message: `Updated task "${task.title}"`,
      data: task,
      actionType: 'task_updated',
    };
  },

  completeTask: (args: { idOrTitle: string }): ToolResult => {
    const task = stateManager.completeTask(args.idOrTitle, true);
    if (!task) return { success: false, message: `Could not find task matching "${args.idOrTitle}"` };
    return {
      success: true,
      message: `Marked task "${task.title}" as complete!`,
      data: task,
      actionType: 'task_completed',
    };
  },

  deleteTask: (args: { idOrTitle: string }): ToolResult => {
    const ok = stateManager.deleteTask(args.idOrTitle);
    if (!ok) return { success: false, message: `Could not find task matching "${args.idOrTitle}" to remove.` };
    return {
      success: true,
      message: `Removed task "${args.idOrTitle}".`,
      actionType: 'task_deleted',
    };
  },

  // Inventory
  addInventoryItem: (args: {
    name: string;
    quantity?: number;
    unit?: string;
    status?: InventoryItem['status'];
    category?: string;
    currentQuantity?: number;
    thresholdQuantity?: number;
  }): ToolResult => {
    const item = stateManager.addInventoryItem(
      args.name,
      args.quantity ?? 100,
      args.unit ?? 'units',
      args.status ?? 'good',
      args.category ?? 'General',
      'user',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      args.currentQuantity,
      args.thresholdQuantity
    );
    const qtyStr = item.currentQuantity !== undefined ? `${item.currentQuantity} ${item.unit || ''}`.trim() : `${item.quantity}%`;
    return {
      success: true,
      message: `Added ${item.name} to your inventory: ${qtyStr}.`,
      data: item,
      actionType: 'inventory_added',
    };
  },

  updateInventory: (args: {
    nameOrId: string;
    quantity?: number;
    status?: InventoryItem['status'];
    currentQuantity?: number;
    unit?: string;
    thresholdQuantity?: number;
  }): ToolResult => {
    const resolved = stateManager.resolveInventoryItem(args.nameOrId);
    if (resolved.ambiguous.length > 0) {
      const names = resolved.ambiguous.map((i) => i.name).join(', ');
      return {
        success: false,
        message: `I found multiple matching items: ${names}. Which one would you like to update?`,
        data: resolved.ambiguous,
        actionType: 'inventory_ambiguous',
      };
    }

    const existing = resolved.match;
    const prevQty = existing
      ? (existing.currentQuantity !== undefined ? `${existing.currentQuantity} ${existing.unit || ''}`.trim() : `${existing.quantity}%`)
      : null;

    const item = stateManager.updateInventory(
      args.nameOrId,
      args.quantity,
      args.status,
      'user',
      args.currentQuantity,
      args.unit,
      args.thresholdQuantity
    );

    if (!item) {
      // If item doesn't exist, register it into inventory
      const created = stateManager.addInventoryItem(
        args.nameOrId,
        args.quantity ?? (args.status === 'critical' ? 15 : args.status === 'low' ? 30 : 80),
        args.unit || 'units',
        args.status ?? 'good',
        'General',
        'user',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        args.currentQuantity,
        args.thresholdQuantity
      );
      const qtyStr = created.currentQuantity !== undefined ? `${created.currentQuantity} ${created.unit || ''}`.trim() : `${created.quantity}%`;
      const lowStockMsg = (created.status === 'low' || created.status === 'critical')
        ? ` ${created.name} is now low in stock and has been added to your shopping list.`
        : '';
      return {
        success: true,
        message: `Added ${created.name} to your inventory: ${qtyStr}.${lowStockMsg}`,
        data: created,
        actionType: 'inventory_added',
      };
    }

    const newQty = item.currentQuantity !== undefined ? `${item.currentQuantity} ${item.unit || ''}`.trim() : `${item.quantity}%`;
    const lowStockMsg = (item.status === 'low' || item.status === 'critical')
      ? ` ${item.name} is now low in stock and has been added to your shopping list.`
      : '';

    return {
      success: true,
      message: `Updated ${item.name} from ${prevQty || 'previous quantity'} to ${newQty}.${lowStockMsg}`,
      data: item,
      actionType: 'inventory_updated',
    };
  },

  checkInventoryItem: (args: { nameOrId: string }): ToolResult => {
    const resolved = stateManager.resolveInventoryItem(args.nameOrId);
    if (resolved.ambiguous.length > 0) {
      const names = resolved.ambiguous.map((i) => i.name).join(', ');
      return {
        success: false,
        message: `I found multiple matching items: ${names}. Which one would you like to check?`,
        data: resolved.ambiguous,
        actionType: 'inventory_ambiguous',
      };
    }
    if (!resolved.match) {
      return {
        success: false,
        message: `I don't have ${args.nameOrId} recorded in your current household inventory.`,
        actionType: 'inventory_not_found',
      };
    }
    const item = resolved.match;
    const qtyStr = item.currentQuantity !== undefined ? `${item.currentQuantity} ${item.unit || ''}`.trim() : `${item.quantity}%`;
    return {
      success: true,
      message: `${item.name} is currently ${item.status.toUpperCase()}. You have ${qtyStr} remaining.`,
      data: item,
      actionType: 'inventory_checked',
    };
  },

  listInventory: (): ToolResult => {
    const items = stateManager.getState().inventory;
    return {
      success: true,
      message: `Found ${items.length} inventory items`,
      data: items,
      actionType: 'inventory_listed',
    };
  },

  reduceInventoryItem: (args: {
    nameOrId: string;
    amount: number;
    unit?: string;
  }): ToolResult => {
    const res = stateManager.reduceInventory(args.nameOrId, args.amount, args.unit, 'user');
    if (res.ambiguous && res.ambiguous.length > 0) {
      const names = res.ambiguous.map((i) => i.name).join(', ');
      return {
        success: false,
        message: `I found multiple matching items: ${names}. Which one would you like to deduct from?`,
        data: res.ambiguous,
        actionType: 'inventory_ambiguous',
      };
    }
    if (!res.item) {
      return {
        success: false,
        message: `Could not find "${args.nameOrId}" in your inventory to reduce.`,
        actionType: 'inventory_not_found',
      };
    }

    const item = res.item;
    const qtyStr = item.currentQuantity !== undefined ? `${item.currentQuantity} ${item.unit || ''}`.trim() : `${item.quantity}%`;
    const lowMsg = (item.status === 'low' || item.status === 'critical')
      ? ` ⚠️ ${item.name} is now ${item.status.toUpperCase()} (${qtyStr}) and was queued to your shopping list.`
      : '';

    return {
      success: true,
      message: `Removed ${res.deducted} ${res.unit} of ${item.name}. Remaining inventory: ${qtyStr}.${lowMsg}`,
      data: item,
      actionType: 'inventory_reduced',
    };
  },

  getOutOfStockItems: (): ToolResult => {
    const items = stateManager.getState().inventory.filter(
      (i) => i.status === 'critical' || i.quantity === 0 || (i.currentQuantity !== undefined && i.currentQuantity <= 0)
    );
    return {
      success: true,
      message: `Found ${items.length} out-of-stock or critically depleted household items.`,
      data: items,
      actionType: 'out_of_stock_retrieved',
    };
  },

  getRestockRecommendations: (): ToolResult => {
    const state = stateManager.getState();
    const lowItems = state.inventory.filter(
      (i) => i.status === 'low' || i.status === 'critical' || (i.currentQuantity !== undefined && i.thresholdQuantity !== undefined && i.currentQuantity <= i.thresholdQuantity)
    );
    const unboughtShopping = state.shopping.filter((s) => !s.completed);
    return {
      success: true,
      message: `Found ${lowItems.length} inventory items requiring restock and ${unboughtShopping.length} pending shopping items.`,
      data: {
        inventoryNeedingRestock: lowItems,
        pendingShoppingList: unboughtShopping,
      },
      actionType: 'restock_recommendations_retrieved',
    };
  },

  getLowStockItems: (): ToolResult => {
    const items = stateManager.getState().inventory.filter((i) => i.status === 'low' || i.status === 'critical');
    return {
      success: true,
      message: `Found ${items.length} items with low or critical stock levels`,
      data: items,
      actionType: 'low_stock_retrieved',
    };
  },

  // Shopping
  addShoppingItem: (args: { name: string; quantity?: string; category?: string }): ToolResult => {
    const item = stateManager.addShoppingItem(args.name, args.quantity || '1 item', args.category);
    return {
      success: true,
      message: `Added "${item.name}" (${item.quantity}) to the shopping list.`,
      data: item,
      actionType: 'shopping_added',
    };
  },

  removeShoppingItem: (args: { idOrName: string }): ToolResult => {
    const ok = stateManager.removeShoppingItem(args.idOrName);
    if (!ok) return { success: false, message: `Could not find item "${args.idOrName}" on shopping list.` };
    return {
      success: true,
      message: `Removed "${args.idOrName}" from shopping list.`,
      actionType: 'shopping_removed',
    };
  },

  completeShoppingItem: (args: { idOrName: string }): ToolResult => {
    const item = stateManager.completeShoppingItem(args.idOrName, true);
    if (!item) return { success: false, message: `Could not find item "${args.idOrName}" on shopping list.` };
    return {
      success: true,
      message: `Purchased "${item.name}". Marked completed on shopping list.`,
      data: item,
      actionType: 'shopping_completed',
    };
  },

  listShoppingItems: (): ToolResult => {
    const items = stateManager.getState().shopping;
    return {
      success: true,
      message: `Shopping list contains ${items.length} items (${items.filter((i) => !i.completed).length} pending)`,
      data: items,
      actionType: 'shopping_listed',
    };
  },

  // Bills
  addBill: (args: { name: string; amount?: number; dueDate: string }): ToolResult => {
    const bill = stateManager.addBill(args.name, args.amount ?? 0, args.dueDate);
    return {
      success: true,
      message: `Recorded bill: ${bill.name} (${bill.amount ? `$${bill.amount}` : 'Amount TBD'}) due ${bill.dueDate}`,
      data: bill,
      actionType: 'bill_added',
    };
  },

  markBillPaid: (args: { idOrName?: string; billName?: string; name?: string; paid?: boolean }): ToolResult => {
    const target = (args.idOrName || args.billName || args.name || '').trim();
    if (!target) {
      return { success: false, message: 'Please specify which bill you would like to mark as paid.' };
    }
    const bill = stateManager.markBillPaid(target, args.paid !== false);
    if (!bill) return { success: false, message: `Could not find bill matching "${target}"` };
    return {
      success: true,
      message: `Marked "${bill.name}" as PAID ($${bill.amount}).`,
      data: bill,
      actionType: 'bill_paid',
    };
  },

  listBills: (args?: { filter?: 'all' | 'unpaid' | 'paid' | 'overdue' | 'this_week' | 'upcoming' }): ToolResult => {
    let bills = stateManager.getState().bills;
    if (args?.filter === 'unpaid' || args?.filter === 'upcoming') {
      bills = bills.filter((b) => !b.paid);
    } else if (args?.filter === 'paid') {
      bills = bills.filter((b) => b.paid);
    } else if (args?.filter === 'overdue') {
      bills = bills.filter((b) => !b.paid && (b.dueCategory === 'Overdue' || b.dueDate.toLowerCase().includes('overdue')));
    } else if (args?.filter === 'this_week') {
      bills = bills.filter((b) => !b.paid && (b.dueCategory === 'Due Tomorrow' || b.dueDate.toLowerCase().includes('friday') || b.dueDate.toLowerCase().includes('tomorrow') || b.dueDate.toLowerCase().includes('today') || b.dueDate.toLowerCase().includes('this week')));
    }
    return {
      success: true,
      message: `Found ${bills.length} bills (${bills.filter((b) => !b.paid).length} unpaid)`,
      data: bills,
      actionType: 'bills_listed',
    };
  },

  // Maintenance
  addMaintenanceTask: (args: { title: string; category?: string; dueDate?: string; provider?: string }): ToolResult => {
    const maint = stateManager.addMaintenanceTask(args.title, args.category, args.dueDate, args.provider);
    return {
      success: true,
      message: `Scheduled maintenance: "${maint.title}" (${maint.category}) due ${maint.dueDate}`,
      data: maint,
      actionType: 'maintenance_added',
    };
  },

  completeMaintenanceTask: (args: { idOrTitle: string }): ToolResult => {
    const item = stateManager.completeMaintenanceTask(args.idOrTitle, 'completed');
    if (!item) return { success: false, message: `Could not find maintenance task "${args.idOrTitle}"` };
    return {
      success: true,
      message: `Marked maintenance task "${item.title}" as completed.`,
      data: item,
      actionType: 'maintenance_completed',
    };
  },

  listMaintenanceTasks: (args?: { filter?: 'all' | 'pending' | 'overdue' | 'upcoming' | 'completed' }): ToolResult => {
    let maintenance = stateManager.getState().maintenance;
    if (args?.filter === 'pending') {
      maintenance = maintenance.filter((m) => m.status === 'pending');
    } else if (args?.filter === 'overdue') {
      maintenance = maintenance.filter((m) => m.status === 'overdue');
    } else if (args?.filter === 'completed') {
      maintenance = maintenance.filter((m) => m.status === 'completed');
    } else if (args?.filter === 'upcoming') {
      maintenance = maintenance.filter((m) => m.status !== 'completed');
    }
    return {
      success: true,
      message: `Found ${maintenance.length} maintenance records`,
      data: maintenance,
      actionType: 'maintenance_listed',
    };
  },

  // High-Level Household Intelligence Tools
  getHomeBriefing: (): ToolResult => {
    const state = stateManager.getState();
    const urgentTasks = state.tasks.filter((t) => !t.completed && t.priority === 'high');
    const unpaidBills = state.bills.filter((b) => !b.paid);
    const lowInventory = state.inventory.filter((i) => i.status === 'critical' || i.status === 'low');
    const pendingShopping = state.shopping.filter((s) => !s.completed);
    const overdueMaint = state.maintenance.filter((m) => m.status === 'overdue' || m.status === 'pending');

    const briefing = {
      greeting: '☀️ Good morning! Here is your daily household operations briefing:',
      urgentCount: urgentTasks.length + unpaidBills.filter((b) => b.dueCategory === 'Due Tomorrow').length,
      urgentItems: [
        ...unpaidBills
          .filter((b) => b.dueCategory === 'Due Tomorrow')
          .map((b) => `⚡ ${b.name} ($${b.amount}) due tomorrow`),
        ...urgentTasks.map((t) => `🔴 ${t.title} (${t.dueDate})`),
      ],
      pendingTasks: state.tasks.filter((t) => !t.completed).map((t) => `• ${t.title}`),
      shoppingItems: pendingShopping.map((s) => `• ${s.name} (${s.quantity || '1 item'})`),
      maintenanceAlerts: overdueMaint.map((m) => `• ${m.title} [${m.status.toUpperCase()}]`),
      lowInventoryAlerts: lowInventory.map((i) => `• ${i.name} at ${i.quantity}% (${i.status})`),
      recommendedFirstAction: unpaidBills.some((b) => b.dueCategory === 'Due Tomorrow')
        ? 'Pay the electricity bill today to avoid impending late fees.'
        : lowInventory.length > 0
        ? `Restock ${lowInventory[0].name} before total depletion.`
        : 'Review and clear pending daily chores.',
    };

    return {
      success: true,
      message: 'Generated comprehensive daily home briefing.',
      data: briefing,
      actionType: 'home_briefing',
    };
  },

  prioritizeHouseholdTasks: (): ToolResult => {
    const state = stateManager.getState();
    const priorities: { rank: number; title: string; category: string; reason: string; badge: string; color: string }[] = [];

    // 1. Due Tomorrow Bills
    const urgentBill = state.bills.find((b) => !b.paid && b.dueCategory === 'Due Tomorrow');
    if (urgentBill) {
      priorities.push({
        rank: priorities.length + 1,
        title: `Pay ${urgentBill.name}`,
        category: 'Bills & Utilities',
        reason: 'Due tomorrow. Late fees will apply if missed.',
        badge: 'Due Tomorrow',
        color: 'error',
      });
    }

    // 2. Critical Inventory items needing immediate restock
    const critItem = state.inventory.find((i) => i.status === 'critical');
    if (critItem) {
      priorities.push({
        rank: priorities.length + 1,
        title: `Restock ${critItem.name}`,
        category: 'Inventory & Shopping',
        reason: `Inventory critically low at ${critItem.quantity}%. ${critItem.estimatedRemaining || 'Runs out soon.'}`,
        badge: 'Critical Stock',
        color: 'secondary',
      });
    }

    // 3. Overdue Maintenance
    const overdueMaint = state.maintenance.find((m) => m.status === 'overdue');
    if (overdueMaint) {
      priorities.push({
        rank: priorities.length + 1,
        title: overdueMaint.title,
        category: 'Maintenance',
        reason: 'Maintenance is overdue. Prevents equipment damage and air/water quality drop.',
        badge: 'Overdue',
        color: 'warning',
      });
    }

    // 4. Remaining pending high-priority tasks
    state.tasks
      .filter((t) => !t.completed && t.priority === 'high')
      .forEach((t) => {
        if (!priorities.some((p) => p.title.toLowerCase().includes(t.title.toLowerCase()))) {
          priorities.push({
            rank: priorities.length + 1,
            title: t.title,
            category: t.category,
            reason: t.aiInsight || `Scheduled for ${t.dueDate || 'today'}.`,
            badge: 'High Priority',
            color: 'primary',
          });
        }
      });

    // 5. General cleaning/chores
    state.tasks
      .filter((t) => !t.completed && t.priority !== 'high')
      .slice(0, 2)
      .forEach((t) => {
        priorities.push({
          rank: priorities.length + 1,
          title: t.title,
          category: t.category,
          reason: 'Daily routine upkeep.',
          badge: 'Routine',
          color: 'neutral',
        });
      });

    return {
      success: true,
      message: 'Generated prioritized household action ranking with reasoning.',
      data: priorities,
      actionType: 'task_prioritization',
    };
  },

  whatShouldIDoNow: (): ToolResult => {
    const state = stateManager.getState();
    const urgentBill = state.bills.find((b) => !b.paid && b.dueCategory === 'Due Tomorrow');
    const critItem = state.inventory.find((i) => i.status === 'critical');
    const overdueMaint = state.maintenance.find((m) => m.status === 'overdue');
    const pendingHighTask = state.tasks.find((t) => !t.completed && t.priority === 'high');

    let primaryRecommendation = '';
    let estimatedTime = '15–30 minutes';
    let secondaryAction = '';

    if (urgentBill) {
      primaryRecommendation = `Pay the ${urgentBill.name} ($${urgentBill.amount}). It is due tomorrow and takes less than 3 minutes to settle online.`;
      secondaryAction = critItem
        ? `After that, add ${critItem.name} to your store grocery list since it is currently at critical capacity (${critItem.quantity}%).`
        : `Check off the "${pendingHighTask?.title || 'pending household tasks'}" from your daily task list.`;
    } else if (critItem) {
      primaryRecommendation = `Replenish ${critItem.name}. It is at ${critItem.quantity}% capacity and projected to deplete in ${critItem.estimatedRemaining || '24 hours'}.`;
      secondaryAction = `Review the remaining ${state.shopping.filter((s) => !s.completed).length} items on your shopping list for a consolidated trip.`;
    } else if (overdueMaint) {
      primaryRecommendation = `Take care of ${overdueMaint.title}. This maintenance task is overdue and requires scheduling.`;
      secondaryAction = 'Review your daily chore queue.';
    } else if (pendingHighTask) {
      primaryRecommendation = `Focus on completing: "${pendingHighTask.title}". It is flagged as high priority for today.`;
      secondaryAction = 'Check off remaining pantry inventory checks.';
    } else {
      primaryRecommendation = 'All critical deadlines and high-urgency household tasks are currently up to date! You can take a 20-minute breather or tackle general tidy-up chores.';
      secondaryAction = 'Perform a quick 2-minute inventory sweep of kitchen and cleaning supplies.';
    }

    stateManager.incrementPlanCount();

    return {
      success: true,
      message: 'Analyzed household state and determined optimal immediate action.',
      data: {
        primaryRecommendation,
        estimatedTime,
        secondaryAction,
        urgentBill: urgentBill?.name,
        criticalStock: critItem?.name,
        overdueMaintenance: overdueMaint?.title,
      },
      actionType: 'what_to_do_now',
    };
  },

  generateWeeklyPlan: (): ToolResult => {
    stateManager.incrementPlanCount();
    const state = stateManager.getState();
    const unpaidBills = state.bills.filter((b) => !b.paid);
    const lowStock = state.inventory.filter((i) => i.status !== 'good');
    const pendingMaint = state.maintenance.filter((m) => m.status !== 'completed');

    const weeklyPlan = [
      {
        day: 'Monday',
        focus: 'Financial & Urgent Deadlines',
        tasks: [
          unpaidBills.length > 0 ? `Pay ${unpaidBills[0].name} ($${unpaidBills[0].amount})` : 'Review utility consumption trends',
          'Morning household 10-minute briefing',
        ],
      },
      {
        day: 'Tuesday',
        focus: 'Shopping & Consumables Restock',
        tasks: [
          lowStock.length > 0 ? `Restock ${lowStock.map((i) => i.name).join(', ')}` : 'Consolidated grocery store run',
          'Check refrigerator expiration dates',
        ],
      },
      {
        day: 'Wednesday',
        focus: 'Kitchen & Appliance Sanitation',
        tasks: ['Clean sink, countertops, and microwave interior', 'Wipe down kitchen appliance exteriors'],
      },
      {
        day: 'Thursday',
        focus: 'Appliance & Filter Maintenance',
        tasks: [
          pendingMaint.length > 0 ? pendingMaint[0].title : 'Inspect water filter & softener salt level',
          'Check under-sink plumbing for minor leaks',
        ],
      },
      {
        day: 'Friday',
        focus: 'HVAC & Climate Inspection',
        tasks: ['AC filter check & thermostat program review', 'Dust ceiling fans and vents'],
      },
      {
        day: 'Saturday',
        focus: 'Deep Cleaning & Laundry Orchestration',
        tasks: ['Deep vacuum living room & bedrooms', 'Linen and towel wash cycle'],
      },
      {
        day: 'Sunday',
        focus: 'Inventory Audit & Next Week Planning',
        tasks: ['Weekly pantry & toiletries inventory review', 'Sync household calendar with HomeOps AI'],
      },
    ];

    return {
      success: true,
      message: 'Generated comprehensive Monday–Sunday household operating plan.',
      data: weeklyPlan,
      actionType: 'weekly_plan_generated',
    };
  },

  // --- Activity Calendar & Change History Tools ---
  getActivityForDate: (args: { date?: string }): ToolResult => {
    let targetDate = '';
    const raw = (args.date || 'today').toLowerCase().trim();

    const today = new Date();
    const formatYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (raw === 'today') {
      targetDate = formatYMD(today);
    } else if (raw === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      targetDate = formatYMD(y);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      targetDate = raw;
    } else {
      targetDate = formatYMD(today);
    }

    const events = stateManager.getActivitiesByDate(targetDate);

    if (events.length === 0) {
      return {
        success: true,
        message: `No changes or actions were recorded on ${targetDate}.`,
        data: { date: targetDate, count: 0, events: [] },
        actionType: 'activity_by_date_queried',
      };
    }

    return {
      success: true,
      message: `Found ${events.length} household actions and changes on ${targetDate}.`,
      data: {
        date: targetDate,
        count: events.length,
        events: events.map((e) => ({
          time: e.time,
          title: e.title,
          description: e.description,
          type: e.type,
          source: e.source,
          entity: e.entityName,
          before: e.before,
          after: e.after,
          diff: e.diff,
        })),
      },
      actionType: 'activity_by_date_queried',
    };
  },

  getRecentChanges: (args?: { limit?: number; category?: string }): ToolResult => {
    const limit = args?.limit || 10;
    let events = stateManager.getState().activityEvents || [];

    if (args?.category) {
      const cat = args.category.toLowerCase().trim();
      events = events.filter((e) => e.type.toLowerCase() === cat || e.entityType?.toLowerCase() === cat);
    }

    const sliced = events.slice(0, limit);

    return {
      success: true,
      message: `Retrieved ${sliced.length} recent household activity events.`,
      data: sliced,
      actionType: 'recent_changes_retrieved',
    };
  },

  getChangeHistoryForEntity: (args: { entityName: string }): ToolResult => {
    if (!args.entityName) {
      return { success: false, message: 'Entity name or search term is required' };
    }
    const target = args.entityName.toLowerCase().trim();
    const events = (stateManager.getState().activityEvents || []).filter((e) => {
      if (e.entityName && e.entityName.toLowerCase().includes(target)) return true;
      if (e.title.toLowerCase().includes(target)) return true;
      if (e.description && e.description.toLowerCase().includes(target)) return true;
      if (e.entityId && e.entityId.toLowerCase() === target) return true;
      return false;
    });

    if (events.length === 0) {
      return {
        success: true,
        message: `No recorded changes found for "${args.entityName}".`,
        data: { entityName: args.entityName, events: [] },
        actionType: 'entity_history_queried',
      };
    }

    return {
      success: true,
      message: `Found ${events.length} recorded change events for "${args.entityName}". Most recent was on ${events[0].date} at ${events[0].time || ''}.`,
      data: {
        entityName: args.entityName,
        mostRecent: events[0],
        allEvents: events,
      },
      actionType: 'entity_history_queried',
    };
  },

  getUpcomingSchedule: (args?: { daysAhead?: number }): ToolResult => {
    const days = args?.daysAhead || 14;
    const upcoming = stateManager.getUpcomingEvents(days);

    return {
      success: true,
      message: `Found ${upcoming.length} upcoming scheduled household events (bills, maintenance, tasks).`,
      data: upcoming,
      actionType: 'upcoming_schedule_queried',
    };
  },
};
