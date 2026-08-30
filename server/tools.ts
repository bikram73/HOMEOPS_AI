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

  listTasks: (args?: { filter?: 'pending' | 'completed' | 'all'; category?: string }): ToolResult => {
    let tasks = stateManager.getState().tasks;
    if (args?.filter === 'pending') tasks = tasks.filter((t) => !t.completed);
    if (args?.filter === 'completed') tasks = tasks.filter((t) => t.completed);
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
  }): ToolResult => {
    const item = stateManager.addInventoryItem(
      args.name,
      args.quantity ?? 100,
      args.unit ?? 'units',
      args.status ?? 'good',
      args.category ?? 'General'
    );
    return {
      success: true,
      message: `Added/Updated inventory item: ${item.name} (${item.quantity}% - ${item.status})`,
      data: item,
      actionType: 'inventory_added',
    };
  },

  updateInventory: (args: {
    nameOrId: string;
    quantity?: number;
    status?: InventoryItem['status'];
  }): ToolResult => {
    const item = stateManager.updateInventory(args.nameOrId, args.quantity, args.status);
    if (!item) {
      // If item doesn't exist, create it with the given status
      const created = stateManager.addInventoryItem(
        args.nameOrId,
        args.quantity ?? (args.status === 'critical' ? 15 : args.status === 'low' ? 30 : 80),
        'unit',
        args.status ?? 'low'
      );
      if (args.status === 'low' || args.status === 'critical') {
        stateManager.addShoppingItem(created.name, '1 unit', 'General');
      }
      return {
        success: true,
        message: `Registered ${created.name} into inventory with status: ${created.status}. Automatically queued to shopping list.`,
        data: created,
        actionType: 'inventory_updated',
      };
    }
    return {
      success: true,
      message: `Updated inventory: ${item.name} is now at ${item.quantity}% (${item.status}). ${
        item.status !== 'good' ? 'Added to shopping list for restock.' : ''
      }`,
      data: item,
      actionType: 'inventory_updated',
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

  markBillPaid: (args: { idOrName: string }): ToolResult => {
    const bill = stateManager.markBillPaid(args.idOrName, true);
    if (!bill) return { success: false, message: `Could not find bill matching "${args.idOrName}"` };
    return {
      success: true,
      message: `Marked "${bill.name}" as PAID ($${bill.amount}).`,
      data: bill,
      actionType: 'bill_paid',
    };
  },

  listBills: (): ToolResult => {
    const bills = stateManager.getState().bills;
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

  listMaintenanceTasks: (): ToolResult => {
    const maintenance = stateManager.getState().maintenance;
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
};
