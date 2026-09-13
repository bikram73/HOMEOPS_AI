import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { tools, ToolResult } from './tools';
import { stateManager } from './state';
import { InventoryItem, Bill } from './types';
import { classifyIntent, parseQuantityAndUnit } from './intent-router';

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'createTask',
    description: 'Creates a new household chore or task in the in-memory state. ONLY call when user explicitly asks to create a task, chore, or to-do.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Title or description of the task' },
        category: {
          type: Type.STRING,
          enum: ['cleaning', 'shopping', 'bill', 'maintenance', 'general'],
          description: 'Category of the task',
        },
        priority: {
          type: Type.STRING,
          enum: ['low', 'medium', 'high'],
          description: 'Priority level',
        },
        dueDate: { type: Type.STRING, description: 'Due date string like "Today", "Tomorrow", "Friday"' },
        amount: { type: Type.STRING, description: 'Optional cost or amount' },
        provider: { type: Type.STRING, description: 'Optional service provider name' },
      },
      required: ['title'],
    },
  },
  {
    name: 'completeTask',
    description: 'Marks a household task as completed by its title or ID.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        idOrTitle: { type: Type.STRING, description: 'Task title or ID to complete' },
      },
      required: ['idOrTitle'],
    },
  },
  {
    name: 'deleteTask',
    description: 'Deletes or removes a task from the list.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        idOrTitle: { type: Type.STRING, description: 'Task title or ID to remove' },
      },
      required: ['idOrTitle'],
    },
  },
  {
    name: 'checkInventoryItem',
    description: 'Checks current stock quantity, units, and status of an inventory item without mutating state. Use for "Is X low?", "How much X do I have?", etc.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        nameOrId: { type: Type.STRING, description: 'Name or ID of the inventory item (e.g. "Rice", "Detergent")' },
      },
      required: ['nameOrId'],
    },
  },
  {
    name: 'updateInventory',
    description: 'Updates the stock level, physical quantity, or status of an inventory item. If low/critical, it auto-queues to shopping list.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        nameOrId: { type: Type.STRING, description: 'Name of the item (e.g. "Rice", "Detergent", "Toothpaste", "Milk")' },
        quantity: { type: Type.NUMBER, description: 'Remaining quantity percentage (0 to 100)' },
        currentQuantity: { type: Type.NUMBER, description: 'Physical quantity number (e.g. 0.5, 2, 5)' },
        unit: { type: Type.STRING, description: 'Unit of measure (e.g. "kg", "grams", "liters", "units")' },
        thresholdQuantity: { type: Type.NUMBER, description: 'Low stock threshold amount (e.g. 1)' },
        status: {
          type: Type.STRING,
          enum: ['good', 'low', 'critical'],
          description: 'Status of the item',
        },
      },
      required: ['nameOrId'],
    },
  },
  {
    name: 'addInventoryItem',
    description: 'Adds a new item to household inventory with initial quantity and unit.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Name of the inventory item' },
        quantity: { type: Type.NUMBER, description: 'Percentage quantity (0 to 100)' },
        currentQuantity: { type: Type.NUMBER, description: 'Physical quantity number (e.g. 2, 5)' },
        unit: { type: Type.STRING, description: 'Unit of measure (e.g. "kg", "liters", "units")' },
        thresholdQuantity: { type: Type.NUMBER, description: 'Low stock threshold amount' },
        category: { type: Type.STRING, description: 'Category (e.g. Pantry, Cleaning, Fridge)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'addShoppingItem',
    description: 'Adds an item or grocery product to the household shopping list.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Item name to buy' },
        quantity: { type: Type.STRING, description: 'Quantity or packaging details' },
        category: { type: Type.STRING, description: 'Category (e.g., Cleaning, Pantry, Fridge)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'removeShoppingItem',
    description: 'Removes an item from the shopping list.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        idOrName: { type: Type.STRING, description: 'Item name or ID to remove' },
      },
      required: ['idOrName'],
    },
  },
  {
    name: 'completeShoppingItem',
    description: 'Marks a shopping item as purchased.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        idOrName: { type: Type.STRING, description: 'Item name or ID purchased' },
      },
      required: ['idOrName'],
    },
  },
  {
    name: 'addBill',
    description: 'Records an upcoming utility or service bill.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Bill name (e.g. "Electricity bill", "Internet", "Water")' },
        amount: { type: Type.NUMBER, description: 'Dollar amount' },
        dueDate: { type: Type.STRING, description: 'Due date (e.g. "Friday", "Sep 3", "Tomorrow")' },
      },
      required: ['name', 'dueDate'],
    },
  },
  {
    name: 'markBillPaid',
    description: 'Marks a bill as paid.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        idOrName: { type: Type.STRING, description: 'Bill name or ID' },
      },
      required: ['idOrName'],
    },
  },
  {
    name: 'addMaintenanceTask',
    description: 'Schedules a home maintenance or appliance task (AC service, water filter, plumbing, etc.)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Title of maintenance task' },
        category: { type: Type.STRING, description: 'Appliance or system category' },
        dueDate: { type: Type.STRING, description: 'Due date or schedule window' },
      },
      required: ['title'],
    },
  },
  {
    name: 'getHomeBriefing',
    description: 'Generates a full daily household morning briefing with urgent deadlines, tasks, inventory, and bills.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'prioritizeHouseholdTasks',
    description: 'Evaluates all pending tasks, low inventory, upcoming bills, and overdue maintenance, returning a ranked list with reasons.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'whatShouldIDoNow',
    description: 'Inspects real-time household state and recommends the single best immediate action.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'generateWeeklyPlan',
    description: 'Generates an actionable Monday-to-Sunday household operations schedule based on current state.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'listTasks',
    description: 'Lists current household tasks with optional filter.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filter: { type: Type.STRING, enum: ['pending', 'completed', 'all'] },
      },
    },
  },
  {
    name: 'listInventory',
    description: 'Lists all inventory items with current levels and statuses.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'listShoppingItems',
    description: 'Lists all shopping list items.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'listBills',
    description: 'Lists all household bills and due dates.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'listMaintenanceTasks',
    description: 'Lists home maintenance records.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getActivityForDate',
    description: 'Queries household change history and actions for a specific date (e.g. "today", "yesterday", or "YYYY-MM-DD"). Use this whenever the user asks "What did I change today?", "What happened yesterday?", or asks about actions on a specific date.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description: 'Date to query (e.g. "today", "yesterday", or "YYYY-MM-DD")',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'getRecentChanges',
    description: 'Returns the most recent household activities and change history records across tasks, inventory, bills, shopping, and maintenance.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: { type: Type.NUMBER, description: 'Number of recent activities to retrieve (default 10)' },
        category: { type: Type.STRING, description: 'Optional category filter: task, inventory, shopping, bill, maintenance, ai, automation, telegram' },
      },
    },
  },
  {
    name: 'getChangeHistoryForEntity',
    description: 'Finds the historical audit trail and past changes for a specific item, task, bill, or appliance (e.g., "rice", "electricity", "washing machine"). Answers "When did I update rice?" or "Which day did I pay electricity?".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        entityName: { type: Type.STRING, description: 'Name of the item, task, bill, or appliance to search history for' },
      },
      required: ['entityName'],
    },
  },
  {
    name: 'getUpcomingSchedule',
    description: 'Returns upcoming scheduled household deadlines, including upcoming bills, maintenance cycles, and due tasks.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        daysAhead: { type: Type.NUMBER, description: 'Days ahead to look into future (default 14)' },
      },
    },
  },
];

export interface AgentProcessResult {
  response: string;
  toolsExecuted: { toolName: string; args: any; result: ToolResult }[];
  priorities?: any[];
  briefing?: any;
  weeklyPlan?: any;
  whatNow?: any;
}

// Executes a tool by name with arguments
function executeToolByName(name: string, args: any): ToolResult {
  const handler = (tools as any)[name];
  if (typeof handler === 'function') {
    return handler(args || {});
  }
  return { success: false, message: `Unknown tool: ${name}` };
}

// Heuristic fallback for Natural Language Agent if Gemini API key is absent or offline
function fallbackNlpAgent(userMessage: string): AgentProcessResult {
  const msg = userMessage.toLowerCase().trim();
  const toolsExecuted: { toolName: string; args: any; result: ToolResult }[] = [];

  stateManager.incrementMessageCount();

  const state = stateManager.getState();
  const intentResult = classifyIntent(userMessage, state);

  // 0. Primary Strict Intent Dispatch (PRD Section 3 & 4)
  if (intentResult.intent === 'UNKNOWN') {
    return {
      response: intentResult.clarificationMessage || "I'm not sure whether you want to update inventory, create a task, or check an existing record. Could you clarify?",
      toolsExecuted: [],
    };
  }

  if (intentResult.intent === 'INVENTORY_REDUCE') {
    const entityName = intentResult.entity || 'item';
    const amount = intentResult.quantity || 1;
    const toolRes = tools.reduceInventoryItem({
      nameOrId: entityName,
      amount,
      unit: intentResult.unit,
    });
    toolsExecuted.push({
      toolName: 'reduceInventoryItem',
      args: { nameOrId: entityName, amount, unit: intentResult.unit },
      result: toolRes,
    });
    return { response: toolRes.message, toolsExecuted };
  }

  if (intentResult.intent === 'INVENTORY_OUT_OF_STOCK_QUERY') {
    const toolRes = tools.getOutOfStockItems();
    toolsExecuted.push({ toolName: 'getOutOfStockItems', args: {}, result: toolRes });
    const items = (toolRes.data || []) as InventoryItem[];
    if (items.length === 0) {
      return {
        response: 'Good news! None of your household inventory items are currently out of stock or depleted.',
        toolsExecuted,
      };
    }
    const response = `Here are your **out-of-stock or depleted items**:\n${items.map((i) => `• ⚠️ **${i.name}** - ${i.currentQuantity !== undefined ? `${i.currentQuantity} ${i.unit || ''}`.trim() : `${i.quantity}%`} (${i.status.toUpperCase()})`).join('\n')}\n\nThese items have been queued to your shopping list for replenishment.`;
    return { response, toolsExecuted };
  }

  if (intentResult.intent === 'INVENTORY_RESTOCK_QUERY') {
    const toolRes = tools.getRestockRecommendations();
    toolsExecuted.push({ toolName: 'getRestockRecommendations', args: {}, result: toolRes });
    const lowInv = toolRes.data?.inventoryNeedingRestock || [];
    const pendingShop = toolRes.data?.pendingShoppingList || [];
    if (lowInv.length === 0 && pendingShop.length === 0) {
      return {
        response: 'Your household is fully stocked! There are no inventory items below threshold or pending replenishment.',
        toolsExecuted,
      };
    }
    let response = `Here are the **items you should restock based on your inventory**:\n\n`;
    if (lowInv.length > 0) {
      response += `📦 **Inventory Below Threshold:**\n` + lowInv.map((i: any) => `• **${i.name}** (${i.currentQuantity !== undefined ? `${i.currentQuantity} ${i.unit || ''}`.trim() : `${i.quantity}%`} remaining, alert at ${i.thresholdQuantity || 20}${i.unit || ''}) [${i.status.toUpperCase()}]`).join('\n') + '\n\n';
    }
    if (pendingShop.length > 0) {
      response += `🛒 **Unpurchased Shopping Items:**\n` + pendingShop.map((s: any) => `• **${s.name}** (${s.quantity || '1 unit'})`).join('\n');
    }
    return { response, toolsExecuted };
  }

  if (intentResult.intent === 'SHOPPING_URGENT_QUERY') {
    const recRes = tools.getRestockRecommendations();
    toolsExecuted.push({ toolName: 'getRestockRecommendations', args: {}, result: recRes });
    const criticalItems = (recRes.data?.inventoryNeedingRestock || []).filter((i: any) => i.status === 'critical' || (i.currentQuantity !== undefined && i.currentQuantity <= 0));
    const lowItems = (recRes.data?.inventoryNeedingRestock || []).filter((i: any) => i.status === 'low');
    const pendingShop = recRes.data?.pendingShoppingList || [];

    let response = `Here is what you should **buy urgently**:\n\n`;
    if (criticalItems.length > 0) {
      response += `🚨 **Critically Depleted (Immediate Priority):**\n` + criticalItems.map((i: any) => `• **${i.name}** — ${i.currentQuantity !== undefined ? `${i.currentQuantity} ${i.unit || ''}`.trim() : `${i.quantity}%`} remaining`).join('\n') + '\n\n';
    }
    if (lowItems.length > 0) {
      response += `⚠️ **Running Low:**\n` + lowItems.map((i: any) => `• **${i.name}** (${i.currentQuantity !== undefined ? `${i.currentQuantity} ${i.unit || ''}`.trim() : `${i.quantity}%`})`).join('\n') + '\n\n';
    }
    if (pendingShop.length > 0) {
      response += `🛒 **Current Shopping List:**\n` + pendingShop.map((s: any) => `• ${s.name} (${s.quantity || '1 unit'})`).join('\n');
    }
    if (criticalItems.length === 0 && lowItems.length === 0 && pendingShop.length === 0) {
      response = 'You have no urgent shopping requirements right now. All pantry, fridge, and supply levels are healthy.';
    }
    return { response, toolsExecuted };
  }

  if (intentResult.intent === 'SHOPPING_ADD') {
    const raw = (intentResult.details?.rawItems || intentResult.entity || '').trim();
    const itemsToAdd = raw.split(/\s+and\s+|,/i).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    const addedList: string[] = [];

    for (const itemText of itemsToAdd) {
      const match = itemText.match(/^([0-9.]+\s*(?:kg|grams|g|litres|liters|litre|liter|l|ml|bottles|boxes|units)?)\s+(?:of\s+)?(.+)$/i);
      let name = itemText;
      let qty = '1 unit';
      if (match) {
        qty = match[1].trim();
        name = match[2].trim();
      }
      name = name.charAt(0).toUpperCase() + name.slice(1);
      const res = tools.addShoppingItem({ name, quantity: qty });
      toolsExecuted.push({ toolName: 'addShoppingItem', args: { name, quantity: qty }, result: res });
      addedList.push(`${name} (${qty})`);
    }

    const response = addedList.length === 1
      ? `Added **${addedList[0]}** to your shopping list.`
      : `Added to your shopping list:\n${addedList.map((item) => `✓ **${item}**`).join('\n')}`;
    return { response, toolsExecuted };
  }

  if (intentResult.intent === 'SHOPPING_QUERY') {
    const toolRes = tools.listShoppingItems();
    toolsExecuted.push({ toolName: 'listShoppingItems', args: {}, result: toolRes });
    const items = toolRes.data || [];
    const pending = items.filter((i: any) => !i.completed);
    const completed = items.filter((i: any) => i.completed);

    if (items.length === 0) {
      return { response: 'Your shopping list is currently empty. You can add items anytime!', toolsExecuted };
    }
    let response = `Here is your **shopping list** (${pending.length} pending, ${completed.length} purchased):\n\n`;
    if (pending.length > 0) {
      response += `🛒 **To Buy:**\n` + pending.map((i: any) => `• **${i.name}** (${i.quantity || '1 unit'})`).join('\n') + '\n\n';
    }
    if (completed.length > 0) {
      response += `✓ **Recently Purchased:**\n` + completed.map((i: any) => `• ~${i.name}~`).join('\n');
    }
    return { response, toolsExecuted };
  }

  if (intentResult.intent === 'SHOPPING_REMOVE') {
    const toolRes = tools.removeShoppingItem({ idOrName: intentResult.entity || '' });
    toolsExecuted.push({ toolName: 'removeShoppingItem', args: { idOrName: intentResult.entity || '' }, result: toolRes });
    return { response: toolRes.message, toolsExecuted };
  }

  if (intentResult.intent === 'BILL_ADD') {
    const toolRes = tools.addBill({
      name: intentResult.entity || 'Utility Bill',
      amount: intentResult.quantity ?? 0,
      dueDate: intentResult.targetDate || 'Due Soon',
    });
    toolsExecuted.push({
      toolName: 'addBill',
      args: { name: intentResult.entity, amount: intentResult.quantity, dueDate: intentResult.targetDate },
      result: toolRes,
    });
    return {
      response: `Recorded **${toolRes.data.name}** (${toolRes.data.amount ? `₹${toolRes.data.amount}` : 'Amount TBD'}) due **${toolRes.data.dueDate}** in your bills ledger.`,
      toolsExecuted,
    };
  }

  if (intentResult.intent === 'BILL_PAY') {
    const target = intentResult.entity || 'electricity';
    const toolRes = tools.markBillPaid({ idOrName: target, paid: true });
    toolsExecuted.push({ toolName: 'markBillPaid', args: { idOrName: target, paid: true }, result: toolRes });
    return { response: toolRes.message, toolsExecuted };
  }

  if (intentResult.intent === 'BILL_QUERY') {
    const filter = intentResult.details?.filter || 'upcoming';
    const toolRes = tools.listBills({ filter });
    toolsExecuted.push({ toolName: 'listBills', args: { filter }, result: toolRes });
    const bills = (toolRes.data || []) as any[];
    if (bills.length === 0) {
      return { response: `You have no ${filter === 'overdue' ? 'overdue' : filter === 'this_week' ? 'bills due this week' : 'unpaid bills'} at this time!`, toolsExecuted };
    }
    const filterTitle = filter === 'overdue' ? 'Overdue Bills' : filter === 'this_week' ? 'Bills Due This Week' : 'Upcoming Bills';
    let response = `Here are your **${filterTitle}**:\n\n`;
    bills.forEach((b: any) => {
      const statusIcon = b.paid ? '✅' : b.dueCategory === 'Overdue' ? '🚨' : '💳';
      response += `${statusIcon} **${b.name}** — ₹${b.amount} (Due: ${b.dueDate}) [${b.paid ? 'PAID' : b.dueCategory || 'Upcoming'}]\n`;
    });
    return { response, toolsExecuted };
  }

  if (intentResult.intent === 'MAINTENANCE_ADD') {
    const title = intentResult.details?.title || 'Maintenance Task';
    const cat = intentResult.details?.category || 'Appliance';
    const due = intentResult.details?.dueDate || 'Upcoming';
    const toolRes = tools.addMaintenanceTask({ title, category: cat, dueDate: due });
    toolsExecuted.push({ toolName: 'addMaintenanceTask', args: { title, category: cat, dueDate: due }, result: toolRes });

    const taskRes = tools.createTask({ title, category: 'maintenance', dueDate: due, priority: 'medium' });
    toolsExecuted.push({ toolName: 'createTask', args: { title, category: 'maintenance', dueDate: due }, result: taskRes });

    return {
      response: `Scheduled maintenance: **${title}** (${cat}) due **${due}**. Added to your maintenance schedule and tasks ledger.`,
      toolsExecuted,
    };
  }

  if (intentResult.intent === 'MAINTENANCE_COMPLETE') {
    const toolRes = tools.completeMaintenanceTask({ idOrTitle: intentResult.entity || '' });
    toolsExecuted.push({ toolName: 'completeMaintenanceTask', args: { idOrTitle: intentResult.entity || '' }, result: toolRes });
    return { response: toolRes.message, toolsExecuted };
  }

  if (intentResult.intent === 'MAINTENANCE_QUERY') {
    const filter = intentResult.details?.filter || 'upcoming';
    const toolRes = tools.listMaintenanceTasks({ filter });
    toolsExecuted.push({ toolName: 'listMaintenanceTasks', args: { filter }, result: toolRes });
    const records = (toolRes.data || []) as any[];
    if (records.length === 0) {
      return { response: `You have no ${filter === 'overdue' ? 'overdue' : 'pending'} home maintenance tasks at this time.`, toolsExecuted };
    }
    let response = `Here is your **maintenance schedule**:\n\n`;
    records.forEach((m: any) => {
      const icon = m.status === 'completed' ? '✅' : m.status === 'overdue' ? '🚨' : '🔧';
      response += `${icon} **${m.title}** (${m.category}) — Due: ${m.dueDate} [${m.status.toUpperCase()}]\n`;
    });
    return { response, toolsExecuted };
  }

  if (intentResult.intent === 'TASK_CREATE') {
    const title = intentResult.details?.title || 'Task';
    const cat = intentResult.details?.category || 'general';
    const dueDate = intentResult.details?.dueDate || intentResult.targetDate || 'Today';
    const toolRes = tools.createTask({ title, category: cat, dueDate, priority: 'medium' });
    toolsExecuted.push({ toolName: 'createTask', args: { title, category: cat, dueDate }, result: toolRes });
    return {
      response: `Created task: **${title}** (Category: ${cat}, Due: ${dueDate}).`,
      toolsExecuted,
    };
  }

  if (intentResult.intent === 'TASK_COMPLETE') {
    const toolRes = tools.completeTask({ idOrTitle: intentResult.entity || 'task' });
    toolsExecuted.push({ toolName: 'completeTask', args: { idOrTitle: intentResult.entity || 'task' }, result: toolRes });
    return { response: toolRes.message, toolsExecuted };
  }

  if (intentResult.intent === 'TASK_DELETE') {
    const toolRes = tools.deleteTask({ idOrTitle: intentResult.entity || 'task' });
    toolsExecuted.push({ toolName: 'deleteTask', args: { idOrTitle: intentResult.entity || 'task' }, result: toolRes });
    return { response: toolRes.message, toolsExecuted };
  }

  if (intentResult.intent === 'TASK_QUERY') {
    const filter = intentResult.details?.filter || 'all';
    const toolRes = tools.listTasks({ filter });
    toolsExecuted.push({ toolName: 'listTasks', args: { filter }, result: toolRes });
    const tasks = (toolRes.data || []) as any[];
    if (tasks.length === 0) {
      return { response: `No tasks found matching your filter (${filter}).`, toolsExecuted };
    }
    const filterLabel = filter === 'today' ? 'Tasks Due Today' : filter === 'pending' ? 'Pending Tasks' : 'Tasks';
    let response = `Here are your **${filterLabel}**:\n\n`;
    tasks.forEach((t: any) => {
      const icon = t.completed ? '✅' : t.priority === 'high' ? '🔴' : '📋';
      response += `${icon} **${t.title}** (${t.category}, Due: ${t.dueDate || 'No date'}) [${t.completed ? 'COMPLETED' : t.priority.toUpperCase()}]\n`;
    });
    return { response, toolsExecuted };
  }

  if (intentResult.intent === 'PRIORITY_QUERY') {
    const whatNowResult = tools.whatShouldIDoNow();
    toolsExecuted.push({ toolName: 'whatShouldIDoNow', args: {}, result: whatNowResult });
    const prioResult = tools.prioritizeHouseholdTasks();
    toolsExecuted.push({ toolName: 'prioritizeHouseholdTasks', args: {}, result: prioResult });
    const d = whatNowResult.data;
    const response = `Here is your most urgent priority right now:\n\n👉 **Top Action:** ${d.primaryRecommendation}\n⏱️ **Estimated Time:** ${d.estimatedTime}\n💡 **Next Step:** ${d.secondaryAction}`;
    return { response, toolsExecuted, priorities: prioResult.data, whatNow: d };
  }

  if (intentResult.intent === 'INVENTORY_STATUS_QUERY' || intentResult.intent === 'INVENTORY_QUERY') {
    if (intentResult.entity) {
      const toolRes = tools.checkInventoryItem({ nameOrId: intentResult.entity });
      toolsExecuted.push({ toolName: 'checkInventoryItem', args: { nameOrId: intentResult.entity }, result: toolRes });
      return { response: toolRes.message, toolsExecuted };
    }
    const toolRes = tools.getLowStockItems();
    toolsExecuted.push({ toolName: 'getLowStockItems', args: {}, result: toolRes });
    const low = (toolRes.data || []) as InventoryItem[];
    return {
      response: low.length === 0
        ? 'All household inventory items are currently well-stocked.'
        : `Here are your low-stock items:\n${low.map((i) => `• ${i.name} - ${i.currentQuantity !== undefined ? `${i.currentQuantity} ${i.unit || ''}`.trim() : `${i.quantity}%`} (${i.status.toUpperCase()})`).join('\n')}`,
      toolsExecuted,
    };
  }

  if (intentResult.intent === 'INVENTORY_UPDATE') {
    const entityName = intentResult.entity || 'Rice';
    const toolRes = tools.updateInventory({
      nameOrId: entityName,
      currentQuantity: intentResult.quantity,
      unit: intentResult.unit,
      thresholdQuantity: intentResult.thresholdQuantity,
      status: intentResult.status,
    });
    toolsExecuted.push({
      toolName: 'updateInventory',
      args: {
        nameOrId: entityName,
        currentQuantity: intentResult.quantity,
        unit: intentResult.unit,
        thresholdQuantity: intentResult.thresholdQuantity,
        status: intentResult.status,
      },
      result: toolRes,
    });
    return { response: toolRes.message, toolsExecuted };
  }

  if (intentResult.intent === 'INVENTORY_ADD') {
    const entityName = intentResult.entity || 'Item';
    const toolRes = tools.addInventoryItem({
      name: entityName,
      currentQuantity: intentResult.quantity,
      unit: intentResult.unit || 'units',
      thresholdQuantity: intentResult.thresholdQuantity,
      status: intentResult.status || 'good',
    });
    toolsExecuted.push({
      toolName: 'addInventoryItem',
      args: {
        name: entityName,
        currentQuantity: intentResult.quantity,
        unit: intentResult.unit,
        thresholdQuantity: intentResult.thresholdQuantity,
        status: intentResult.status,
      },
      result: toolRes,
    });
    return { response: toolRes.message, toolsExecuted };
  }

  // 0a. Historical Activity: "What did I change today?", "What did I do today?", "Changes today", "What changed today?"
  if (
    msg.includes('change today') ||
    msg.includes('changed today') ||
    msg.includes('complete today') ||
    msg.includes('completed today') ||
    msg.includes('what did i do today') ||
    msg.includes('what i did today') ||
    msg.includes('activity today') ||
    msg.includes('what happened today') ||
    msg.includes('actions today')
  ) {
    const actResult = tools.getActivityForDate({ date: 'today' });
    toolsExecuted.push({ toolName: 'getActivityForDate', args: { date: 'today' }, result: actResult });
    const events = actResult.data?.events || [];
    if (events.length === 0) {
      return {
        response: `No changes or actions were recorded for **today** (${actResult.data?.date}). You can make changes anytime and HomeOps will automatically log them in your Activity Calendar.`,
        toolsExecuted,
      };
    }
    let response = `Here are the **${events.length} changes and actions recorded today** (${actResult.data?.date}):\n\n`;
    events.forEach((e: any, idx: number) => {
      const sourceTag = e.source === 'automation' ? '🤖 [Automation]' : e.source === 'telegram' ? '📱 [Telegram]' : '👤 [User]';
      response += `${idx + 1}. **${e.time || ''}** — ${sourceTag} **${e.title}**\n   ${e.description || ''}\n`;
      if (e.diff?.before !== undefined && e.diff?.after !== undefined) {
        response += `   *Change:* ${e.diff.before} ➔ ${e.diff.after}\n`;
      }
    });
    return { response, toolsExecuted };
  }

  // 0b. Historical Activity: "What did I change yesterday?", "What did I complete yesterday?"
  if (
    msg.includes('change yesterday') ||
    msg.includes('changed yesterday') ||
    msg.includes('complete yesterday') ||
    msg.includes('completed yesterday') ||
    msg.includes('do yesterday') ||
    msg.includes('activity yesterday') ||
    msg.includes('what happened yesterday')
  ) {
    const actResult = tools.getActivityForDate({ date: 'yesterday' });
    toolsExecuted.push({ toolName: 'getActivityForDate', args: { date: 'yesterday' }, result: actResult });
    const events = actResult.data?.events || [];
    if (events.length === 0) {
      return {
        response: `No changes or actions were recorded for **yesterday** (${actResult.data?.date}).`,
        toolsExecuted,
      };
    }
    let response = `Here is what changed **yesterday** (${actResult.data?.date}):\n\n`;
    events.forEach((e: any, idx: number) => {
      const sourceTag = e.source === 'automation' ? '🤖 [Automation]' : e.source === 'telegram' ? '📱 [Telegram]' : '👤 [User]';
      response += `${idx + 1}. **${e.time || ''}** — ${sourceTag} **${e.title}**\n   ${e.description || ''}\n`;
    });
    return { response, toolsExecuted };
  }

  // 0c. Entity Change History: "When did I update the rice inventory?", "Which day did I pay the electricity bill?", "When was the washing machine maintenance completed?"
  if (
    msg.startsWith('when did') ||
    msg.startsWith('which day did') ||
    msg.startsWith('when was') ||
    msg.includes('when did i update') ||
    msg.includes('when did i change') ||
    msg.includes('when did i buy') ||
    msg.includes('when did i pay') ||
    msg.includes('history of')
  ) {
    // Extract entity name
    let entityCandidate = msg
      .replace(/when did i update the|when did i update|which day did i pay the|which day did i pay|when was the|when was|when did i change the|when did i change|when did i complete the|when did i complete|history of the|history of/gi, '')
      .replace(/inventory|bill|maintenance|task|item|\?/gi, '')
      .trim();

    if (entityCandidate) {
      const histResult = tools.getChangeHistoryForEntity({ entityName: entityCandidate });
      toolsExecuted.push({ toolName: 'getChangeHistoryForEntity', args: { entityName: entityCandidate }, result: histResult });
      const events = histResult.data?.allEvents || [];
      if (events.length === 0) {
        return {
          response: `I searched your household activity logs, but found **no recorded changes or actions** for "${entityCandidate}".`,
          toolsExecuted,
        };
      }
      const mostRecent = events[0];
      let response = `The most recent recorded update for **${entityCandidate}** occurred on **${mostRecent.date}** at **${mostRecent.time || ''}**:\n\n`;
      response += `• **${mostRecent.title}** (${mostRecent.source} source)\n  ${mostRecent.description || ''}\n`;
      if (mostRecent.diff?.before !== undefined && mostRecent.diff?.after !== undefined) {
        response += `  *Previous value:* ${mostRecent.diff.before} ➔ *New value:* ${mostRecent.diff.after}\n`;
      }
      if (events.length > 1) {
        response += `\nThere are **${events.length} total events** for this item in your activity history.`;
      }
      return { response, toolsExecuted };
    }
  }

  // 0d. Automation audit: "What did HomeOps automatically change?", "What automations ran?"
  if (
    msg.includes('automatically change') ||
    msg.includes('automations ran') ||
    msg.includes('automation history') ||
    msg.includes('what did homeops change')
  ) {
    const actResult = tools.getRecentChanges({ limit: 10, category: 'automation' });
    toolsExecuted.push({ toolName: 'getRecentChanges', args: { limit: 10, category: 'automation' }, result: actResult });
    const events = actResult.data || [];
    if (events.length === 0) {
      return {
        response: 'No automated changes have been recorded yet. Automatic actions (such as auto-replenishment shopping triggers) will be logged here.',
        toolsExecuted,
      };
    }
    let response = `Here are the latest **automated changes** executed by HomeOps AI:\n\n`;
    events.forEach((e: any, idx: number) => {
      response += `${idx + 1}. **${e.date} ${e.time || ''}** — 🤖 **${e.title}**\n   ${e.description || ''}\n`;
    });
    return { response, toolsExecuted };
  }

  // 0e. Upcoming schedule: "What is upcoming?", "Upcoming schedule", "Show my calendar"
  if (
    msg.includes('upcoming schedule') ||
    msg.includes('upcoming bills') ||
    msg.includes('upcoming maintenance') ||
    msg.includes('what is scheduled') ||
    msg.includes('what is coming up')
  ) {
    const schedResult = tools.getUpcomingSchedule({ daysAhead: 14 });
    toolsExecuted.push({ toolName: 'getUpcomingSchedule', args: { daysAhead: 14 }, result: schedResult });
    const upcoming = schedResult.data || [];
    if (upcoming.length === 0) {
      return {
        response: 'You have no upcoming bills or maintenance due in the next 14 days! Everything is up to date.',
        toolsExecuted,
      };
    }
    let response = `Here is your **upcoming household schedule (next 14 days)**:\n\n`;
    upcoming.forEach((item: any) => {
      const typeBadge = item.type === 'bill' ? '💳 [Bill]' : item.type === 'maintenance' ? '🔧 [Maintenance]' : '📋 [Task]';
      response += `• **${item.date}** — ${typeBadge} **${item.title}** (${item.subtitle})\n`;
    });
    return { response, toolsExecuted };
  }

  // 1. "What should I do now?" / "What should I do right now?" / "What to do?"
  if (
    msg.includes('what should i do right now') ||
    msg.includes('what should i do now') ||
    msg.includes('what should i do today') ||
    msg.includes("what's urgent") ||
    msg.includes('what is urgent') ||
    msg.includes('what to prioritize') ||
    msg.includes('what should i prioritize') ||
    msg.includes('what do i need to do') ||
    msg.includes('what to do now')
  ) {
    const whatNowResult = tools.whatShouldIDoNow();
    toolsExecuted.push({ toolName: 'whatShouldIDoNow', args: {}, result: whatNowResult });

    const prioResult = tools.prioritizeHouseholdTasks();
    toolsExecuted.push({ toolName: 'prioritizeHouseholdTasks', args: {}, result: prioResult });

    const d = whatNowResult.data;
    const response = `Here is what needs your immediate attention:\n\n👉 **Recommended Action:** ${d.primaryRecommendation}\n⏱️ **Estimated Time:** ${d.estimatedTime}\n💡 **Next Step:** ${d.secondaryAction}`;

    return {
      response,
      toolsExecuted,
      priorities: prioResult.data,
      whatNow: d,
    };
  }

  // 2. "Daily briefing" / "Home briefing" / "Good morning" / "What needs my attention?" / "What am I forgetting?"
  if (
    msg.includes('briefing') ||
    msg.includes('morning') ||
    msg.includes('attention') ||
    msg.includes('forgetting') ||
    msg.includes('what needs attention') ||
    msg.includes('summary')
  ) {
    const briefingResult = tools.getHomeBriefing();
    toolsExecuted.push({ toolName: 'getHomeBriefing', args: {}, result: briefingResult });
    const b = briefingResult.data;

    let response = `${b.greeting}\n\n`;
    if (b.urgentItems.length > 0) {
      response += `🚨 **Urgent Items (${b.urgentCount}):**\n` + b.urgentItems.map((i: string) => `• ${i}`).join('\n') + '\n\n';
    }
    if (b.lowInventoryAlerts.length > 0) {
      response += `📦 **Low Inventory:**\n` + b.lowInventoryAlerts.map((i: string) => `• ${i}`).join('\n') + '\n\n';
    }
    response += `💡 **Recommended First Action:** ${b.recommendedFirstAction}`;

    return {
      response,
      toolsExecuted,
      briefing: b,
    };
  }

  // 3. Weekly Plan: "Plan my week" / "Give me my weekly plan" / "Weekly home plan"
  if (msg.includes('weekly') || msg.includes('plan my week') || msg.includes('plan my household') || msg.includes('week plan')) {
    const weeklyResult = tools.generateWeeklyPlan();
    toolsExecuted.push({ toolName: 'generateWeeklyPlan', args: {}, result: weeklyResult });

    const plan = weeklyResult.data;
    let response = `Here is your optimized **Weekly Household Operating Plan**:\n\n`;
    plan.forEach((dayPlan: any) => {
      response += `📅 **${dayPlan.day.toUpperCase()} (${dayPlan.focus})**\n`;
      dayPlan.tasks.forEach((t: string) => {
        response += `  ✓ ${t}\n`;
      });
      response += '\n';
    });
    response += `Would you like me to adjust any of these scheduled days?`;

    return {
      response,
      toolsExecuted,
      weeklyPlan: plan,
    };
  }

  // 4a. Explicit Add to Inventory: "Add 6 bananas to inventory" / "Add olive oil to stock"
  if (
    msg.includes('add') &&
    (msg.includes('inventory') || msg.includes('stock') || msg.includes('pantry') || msg.includes('fridge')) &&
    !msg.includes('shopping')
  ) {
    const match = msg.match(/add\s+(?:(\d+)\s+)?([a-zA-Z\s]+?)\s+(?:to|in)\s+(?:my\s+)?(?:inventory|stock|pantry|fridge)/i);
    let qty = 100;
    let name = 'Supplies';
    if (match) {
      if (match[1]) {
        const parsedNum = parseInt(match[1], 10);
        qty = parsedNum <= 10 ? parsedNum * 10 : Math.min(100, parsedNum);
      }
      if (match[2]) {
        name = match[2].trim();
      }
    } else {
      const fallbackMatch = msg.match(/add\s+([a-zA-Z0-9\s]+?)\s+to/i);
      if (fallbackMatch && fallbackMatch[1]) name = fallbackMatch[1].trim();
    }

    const invRes = tools.updateInventory({ nameOrId: name, quantity: qty });
    toolsExecuted.push({ toolName: 'updateInventory', args: { nameOrId: name, quantity: qty }, result: invRes });

    return {
      response: `Added **${name}** to your household inventory at **${qty}%** stock.`,
      toolsExecuted,
    };
  }

  // 4. Low stock / inventory update: "running low on detergent" / "out of toothpaste" / "rice is low"
  if (
    msg.includes('running low on') ||
    msg.includes('almost out of') ||
    msg.includes('out of') ||
    msg.includes('low on') ||
    msg.includes('we need more') ||
    msg.includes('is low')
  ) {
    let itemName = 'detergent';
    if (msg.includes('rice')) itemName = 'Jasmine Rice';
    else if (msg.includes('toothpaste')) itemName = 'Mint Toothpaste';
    else if (msg.includes('milk')) itemName = 'Organic Whole Milk';
    else if (msg.includes('oil')) itemName = 'Olive Oil';
    else if (msg.includes('detergent') || msg.includes('washing powder') || msg.includes('soap')) itemName = 'Laundry Detergent';
    else {
      // extract item name after key phrase
      const match = msg.match(/(?:running low on|almost out of|out of|low on|need more)\s+([a-zA-Z\s]+)/i);
      if (match && match[1]) {
        itemName = match[1].replace(/[.,!]/g, '').trim();
      }
    }

    const isCritical = msg.includes('out of') || msg.includes('completely out');
    const updateResult = tools.updateInventory({
      nameOrId: itemName,
      status: isCritical ? 'critical' : 'low',
      quantity: isCritical ? 10 : 25,
    });
    toolsExecuted.push({ toolName: 'updateInventory', args: { nameOrId: itemName, status: isCritical ? 'critical' : 'low' }, result: updateResult });

    const shopResult = tools.addShoppingItem({ name: itemName, quantity: '1 unit' });
    toolsExecuted.push({ toolName: 'addShoppingItem', args: { name: itemName }, result: shopResult });

    return {
      response: `I've updated **${itemName}** to **${isCritical ? 'CRITICAL' : 'LOW'}** in your inventory and automatically added it to your shopping list.`,
      toolsExecuted,
    };
  }

  // 5. Add shopping item: "add rice, milk, detergent to shopping" / "need toothpaste too" / "add to shopping"
  if (
    msg.includes('add') &&
    (msg.includes('shopping') || msg.includes('groceries') || msg.includes('grocery') || msg.includes('buy'))
  ) {
    // Check for comma separated list or single item
    const commonItems = ['rice', 'milk', 'detergent', 'toothpaste', 'eggs', 'bread', 'coffee', 'soap', 'apples', 'olive oil'];
    const detectedItems: string[] = [];

    commonItems.forEach((item) => {
      if (msg.includes(item)) detectedItems.push(item);
    });

    if (detectedItems.length === 0) {
      const match = msg.match(/add\s+([a-zA-Z0-9\s,]+)(?:to\s+(?:my\s+)?shopping|to\s+buy)/i);
      if (match && match[1]) {
        match[1].split(/,|and/).forEach((part) => {
          const clean = part.trim();
          if (clean.length > 1 && !clean.toLowerCase().includes('shopping')) {
            detectedItems.push(clean);
          }
        });
      }
    }

    if (detectedItems.length > 0) {
      detectedItems.forEach((item) => {
        const res = tools.addShoppingItem({ name: item.charAt(0).toUpperCase() + item.slice(1) });
        toolsExecuted.push({ toolName: 'addShoppingItem', args: { name: item }, result: res });
      });

      return {
        response: `Added to your shopping list:\n${detectedItems.map((i) => `✓ ${i.charAt(0).toUpperCase() + i.slice(1)}`).join('\n')}\n\nEverything is unified in your single shopping workflow.`,
        toolsExecuted,
      };
    }
  }

  // 5b. Bill payment: "mark my electricity bill as paid" / "mark bill paid" / "pay the electricity bill" / "pay the bill"
  if (
    (msg.includes('mark') || msg.includes('set') || msg.includes('pay')) &&
    (msg.includes('paid') || msg.includes('pay')) &&
    msg.includes('bill')
  ) {
    const currentState = stateManager.getState();
    const unpaidBills = currentState.bills.filter((b) => !b.paid);

    let billName = '';
    if (msg.includes('electricity') || msg.includes('power')) billName = 'electricity';
    else if (msg.includes('internet') || msg.includes('wifi')) billName = 'internet';
    else if (msg.includes('water')) billName = 'water';
    else if (msg.includes('gas')) billName = 'gas';
    else {
      const match = msg.match(/(?:mark|set|pay)\s+(?:my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s+bill|\s+as paid|\s+paid|\s+now)/i);
      if (match && match[1]) {
        const candidate = match[1].trim();
        if (candidate && candidate.toLowerCase() !== 'the' && candidate.toLowerCase() !== 'my') {
          billName = candidate;
        }
      }
    }

    if (!billName) {
      return {
        response: `Which bill would you like to pay? You currently have ${unpaidBills.length} unpaid bills: ${unpaidBills.map((b) => `**${b.name}** ($${b.amount}, ${b.dueDate})`).join(', ')}. Please specify the bill name.`,
        toolsExecuted: [],
      };
    }

    const payRes = tools.markBillPaid({ idOrName: billName, paid: true });
    toolsExecuted.push({ toolName: 'markBillPaid', args: { idOrName: billName, paid: true }, result: payRes });

    return {
      response: payRes.success
        ? `I have marked your **${payRes.data?.name || billName}** bill ($${payRes.data?.amount || ''}) as **PAID** in your financial ledger.`
        : `Could not find a bill matching "${billName}".`,
      toolsExecuted,
    };
  }

  // 6. Complete task: "mark clean the kitchen as complete" / "mark the sink task done"
  if ((msg.includes('complete') || msg.includes('mark') || msg.includes('done')) && !msg.includes('bill')) {
    let taskName = '';
    if (msg.includes('kitchen') || msg.includes('sink')) taskName = 'kitchen';
    else if (msg.includes('electricity') || msg.includes('power')) taskName = 'electricity';
    else if (msg.includes('ac') || msg.includes('filter')) taskName = 'AC';
    else if (msg.includes('detergent')) taskName = 'detergent';
    else {
      const match = msg.match(/(?:mark|complete)\s+(?:the\s+)?([a-zA-Z\s]+)(?:as\s+(?:done|complete)|done|complete)/i);
      if (match && match[1]) taskName = match[1].trim();
    }

    if (taskName) {
      const compResult = tools.completeTask({ idOrTitle: taskName });
      toolsExecuted.push({ toolName: 'completeTask', args: { idOrTitle: taskName }, result: compResult });
      return {
        response: compResult.success
          ? `Done! I've marked "${taskName}" as complete in your household task ledger.`
          : `I could not locate a pending task matching "${taskName}". Current pending tasks include: ${stateManager.getState().tasks.filter((t) => !t.completed).map((t) => t.title).join(', ')}.`,
        toolsExecuted,
      };
    }
  }

  // 7. Maintenance scheduling: "AC needs servicing" / "bathroom tap is leaking" / "plumbing"
  if (msg.includes('servicing') || msg.includes('maintenance') || msg.includes('leaking') || msg.includes('repair') || msg.includes('ac needs')) {
    let title = 'AC Maintenance & Inspection';
    let cat = 'HVAC';
    if (msg.includes('tap') || msg.includes('leak') || msg.includes('plumbing')) {
      title = 'Fix Leaking Bathroom Tap';
      cat = 'Plumbing';
    } else if (msg.includes('water filter') || msg.includes('filter')) {
      title = 'Water Filter Cartridge Replacement';
      cat = 'Plumbing & Water';
    }

    const maintRes = tools.addMaintenanceTask({ title, category: cat, dueDate: 'Due in 3 days' });
    toolsExecuted.push({ toolName: 'addMaintenanceTask', args: { title, category: cat }, result: maintRes });

    const taskRes = tools.createTask({ title, category: 'maintenance', priority: 'high', dueDate: 'In 3 days' });
    toolsExecuted.push({ toolName: 'createTask', args: { title, category: 'maintenance', priority: 'high' }, result: taskRes });

    return {
      response: `I have scheduled the maintenance record and created a high-priority task for **${title}** (${cat}).\n\nWould you like me to flag this as today's top priority?`,
      toolsExecuted,
    };
  }

  // 8. Bill reminder: "electricity bill is due friday" / "pay internet bill"
  if (msg.includes('bill') || msg.includes('utility')) {
    let billName = 'Utility Bill';
    let due = 'Friday';
    let amount = 120;

    if (msg.includes('electricity') || msg.includes('power')) {
      billName = 'Electricity Bill';
      amount = 145.2;
    } else if (msg.includes('internet') || msg.includes('wifi')) {
      billName = 'Internet Fiber Bill';
      amount = 69.99;
    } else if (msg.includes('water')) {
      billName = 'Water Utility Bill';
      amount = 45;
    }

    const billRes = tools.addBill({ name: billName, amount, dueDate: due });
    toolsExecuted.push({ toolName: 'addBill', args: { name: billName, amount, dueDate: due }, result: billRes });

    const taskRes = tools.createTask({ title: `Pay ${billName}`, category: 'bill', priority: 'high', dueDate: due });
    toolsExecuted.push({ toolName: 'createTask', args: { title: `Pay ${billName}`, category: 'bill' }, result: taskRes });

    return {
      response: `Recorded **${billName}** ($${amount}) due **${due}**. I've also linked it directly to your urgent task ledger.`,
      toolsExecuted,
    };
  }

  // 9. Show/list queries & specific item queries (Anti-Hallucination)
  if (
    msg.includes('how many') ||
    msg.includes('how much') ||
    msg.includes('do i have') ||
    msg.includes('is there any') ||
    msg.includes('did you pay') ||
    msg.includes('is the bill paid') ||
    msg.includes('show') ||
    msg.includes('what is') ||
    msg.includes("what's") ||
    msg.includes('list')
  ) {
    const currentState = stateManager.getState();

    // Specific item quantity check: "How many bananas do I have?", "How much detergent?"
    if (msg.includes('how many') || msg.includes('how much') || msg.includes('do i have')) {
      const match = msg.match(/(?:how many|how much|do i have|count of)\s+([a-zA-Z\s]+?)(?:\s+do i have|\s+left|\s+in inventory|\?|$)/i);
      const queryItem = match && match[1] ? match[1].replace(/do i have|left|in inventory|\?/gi, '').trim().toLowerCase() : '';
      
      if (queryItem) {
        const found = currentState.inventory.find(i => i.name.toLowerCase().includes(queryItem));
        if (found) {
          return {
            response: `You have **${found.name}** at **${found.quantity}%** stock (${found.unit || 'units'}), currently **${found.status.toUpperCase()}** in ${found.location}.`,
            toolsExecuted: [{ toolName: 'listInventory', args: {}, result: { success: true, message: 'Queried inventory', data: found } }],
          };
        } else {
          return {
            response: `I don't have "${queryItem}" recorded in your current household inventory. You can add it anytime by saying "Add ${queryItem} to inventory" or "We have 5 ${queryItem}".`,
            toolsExecuted: [{ toolName: 'listInventory', args: {}, result: { success: true, message: 'Item not found in inventory', data: null } }],
          };
        }
      }
    }

    // Bill payment status check: "Did you pay my electricity bill?", "Did I pay my yacht insurance bill?"
    if (
      msg.includes('did you pay') ||
      msg.includes('did i pay') ||
      msg.includes('have i paid') ||
      msg.includes('bill paid') ||
      msg.includes('is the bill paid') ||
      (msg.includes('is') && msg.includes('bill paid'))
    ) {
      const match = msg.match(/(?:did you pay|did i pay|have i paid|is|was)\s+(?:my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s+bill|\s+paid|\?|$)/i);
      const queriedName = match && match[1] ? match[1].replace(/my|the|bill|paid|\?/gi, '').trim().toLowerCase() : '';

      const foundBill = currentState.bills.find(b =>
        (queriedName && b.name.toLowerCase().includes(queriedName)) ||
        (msg.includes('electricity') && (b.name.toLowerCase().includes('electricity') || b.name.toLowerCase().includes('power'))) ||
        (msg.includes('water') && b.name.toLowerCase().includes('water')) ||
        (msg.includes('internet') && (b.name.toLowerCase().includes('internet') || b.name.toLowerCase().includes('wifi')))
      );

      if (foundBill) {
        if (foundBill.paid) {
          return {
            response: `Yes, your **${foundBill.name}** ($${foundBill.amount}) has been marked as **PAID**.`,
            toolsExecuted: [{ toolName: 'listBills', args: {}, result: { success: true, message: 'Checked bill status', data: foundBill } }],
          };
        } else {
          return {
            response: `No, your **${foundBill.name}** ($${foundBill.amount}) is **UNPAID** and currently due **${foundBill.dueDate}**. Would you like me to mark it as paid now?`,
            toolsExecuted: [{ toolName: 'listBills', args: {}, result: { success: true, message: 'Checked bill status', data: foundBill } }],
          };
        }
      } else {
        return {
          response: `I don't have any record of a "${queriedName || 'queried'}" bill in your household records. Your tracked bills are: ${currentState.bills.map(b => b.name).join(', ')}.`,
          toolsExecuted: [{ toolName: 'listBills', args: {}, result: { success: true, message: 'Bill not found', data: null } }],
        };
      }
    }

    if (msg.includes('task') || msg.includes('pending')) {
      const res = tools.listTasks({ filter: 'pending' });
      toolsExecuted.push({ toolName: 'listTasks', args: { filter: 'pending' }, result: res });
      const tasks = res.data;
      return {
        response: `You currently have **${tasks.length} pending tasks**:\n${tasks.map((t: any) => `• [${t.priority.toUpperCase()}] ${t.title} (${t.dueDate || 'Today'})`).join('\n')}`,
        toolsExecuted,
      };
    }
    if (msg.includes('shopping') || msg.includes('grocery') || msg.includes('buy')) {
      const res = tools.listShoppingItems();
      toolsExecuted.push({ toolName: 'listShoppingItems', args: {}, result: res });
      const items = res.data.filter((i: any) => !i.completed);
      return {
        response: `Here is your current shopping list (${items.length} items to buy):\n${items.map((i: any) => `☐ ${i.name} (${i.quantity || '1 item'})`).join('\n')}`,
        toolsExecuted,
      };
    }
    if (msg.includes('inventory') || msg.includes('stock') || msg.includes('running low')) {
      const res = tools.getLowStockItems();
      toolsExecuted.push({ toolName: 'getLowStockItems', args: {}, result: res });
      const low = res.data;
      return {
        response: `Here are your low-stock items:\n${low.map((i: any) => `• ${i.name} - ${i.quantity}% (${i.status.toUpperCase()})`).join('\n')}`,
        toolsExecuted,
      };
    }
  }

  // 11. Clarification fallback - NEVER create a task for unclear intents (BUG-003)
  return {
    response: intentResult.clarificationMessage || "I'm not sure whether you want to update inventory, create a task, or check an existing record. Could you clarify?",
    toolsExecuted: [],
  };
}

// Master agent processing function using server-side Gemini SDK if key is configured, or high-fidelity fallback
export async function processUserMessage(userMessage: string, history: any[] = []): Promise<AgentProcessResult> {
  const state = stateManager.getState();
  const intentResult = classifyIntent(userMessage, state);

  // 1. Strict Intent Guardrails (Section 3 & 4 of PRD)
  // If intent is UNKNOWN, never create a task or mutate state. Ask for clarification directly.
  if (intentResult.intent === 'UNKNOWN') {
    stateManager.incrementMessageCount();
    return {
      response: intentResult.clarificationMessage || "I'm not sure whether you want to update inventory, create a task, or check an existing record. Could you clarify?",
      toolsExecuted: [],
    };
  }

  // 2. Deterministic handling for Inventory queries (Read-only, zero mutations)
  if (intentResult.intent === 'INVENTORY_STATUS_QUERY' || intentResult.intent === 'INVENTORY_QUERY') {
    stateManager.incrementMessageCount();
    if (intentResult.entity) {
      const toolRes = tools.checkInventoryItem({ nameOrId: intentResult.entity });
      return {
        response: toolRes.message,
        toolsExecuted: [{ toolName: 'checkInventoryItem', args: { nameOrId: intentResult.entity }, result: toolRes }],
      };
    } else {
      const toolRes = tools.getLowStockItems();
      const low = (toolRes.data || []) as InventoryItem[];
      return {
        response: low.length === 0
          ? 'All household inventory items are currently well-stocked.'
          : `Here are your low-stock items:\n${low.map((i) => `• ${i.name} - ${i.currentQuantity !== undefined ? `${i.currentQuantity} ${i.unit || ''}`.trim() : `${i.quantity}%`} (${i.status.toUpperCase()})`).join('\n')}`,
        toolsExecuted: [{ toolName: 'getLowStockItems', args: {}, result: toolRes }],
      };
    }
  }

  // 3. Deterministic handling for Inventory updates
  if (intentResult.intent === 'INVENTORY_UPDATE') {
    stateManager.incrementMessageCount();
    const entityName = intentResult.entity || 'Rice';
    const toolRes = tools.updateInventory({
      nameOrId: entityName,
      currentQuantity: intentResult.quantity,
      unit: intentResult.unit,
      thresholdQuantity: intentResult.thresholdQuantity,
      status: intentResult.status,
    });
    return {
      response: toolRes.message,
      toolsExecuted: [{
        toolName: 'updateInventory',
        args: {
          nameOrId: entityName,
          currentQuantity: intentResult.quantity,
          unit: intentResult.unit,
          thresholdQuantity: intentResult.thresholdQuantity,
          status: intentResult.status,
        },
        result: toolRes,
      }],
    };
  }

  // 4. Deterministic handling for Inventory additions
  if (intentResult.intent === 'INVENTORY_ADD') {
    stateManager.incrementMessageCount();
    const entityName = intentResult.entity || 'Item';
    const toolRes = tools.addInventoryItem({
      name: entityName,
      currentQuantity: intentResult.quantity,
      unit: intentResult.unit || 'units',
      thresholdQuantity: intentResult.thresholdQuantity,
      status: intentResult.status || 'good',
    });
    return {
      response: toolRes.message,
      toolsExecuted: [{
        toolName: 'addInventoryItem',
        args: {
          name: entityName,
          currentQuantity: intentResult.quantity,
          unit: intentResult.unit,
          thresholdQuantity: intentResult.thresholdQuantity,
          status: intentResult.status,
        },
        result: toolRes,
      }],
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Graceful fallback for preview / demo without requiring manual API key insertion
    return fallbackNlpAgent(userMessage);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    const systemInstruction = `You are HomeOps AI, an intelligent household operations agent with complete audit logging and an Activity Calendar & Change History system.
Never interpret an inventory update, status question, information query, or general household question as a task creation request.
Only call createTask when the user explicitly asks to create, add, schedule, remember, remind, or place something on a task/to-do list.
Questions such as "How much X do I have?" and "Is X low in stock?" are read-only state queries. Answer them using current household state or read-only tools (checkInventoryItem, listInventory). Do not mutate state.
Commands such as "Set X quantity to Y" and "Update X stock to Y" are inventory updates and must use updateInventory.
If no supported intent can be determined, do not mutate state. Ask for clarification: "I'm not sure whether you want to update inventory, create a task, or check an existing record. Could you clarify?"
Never create a task as a fallback.
Never claim a state change succeeded unless the corresponding tool actually executed successfully.
Always confirm using actual returned state values.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: toolDeclarations }],
        temperature: 0.2,
      },
    });

    const toolsExecuted: { toolName: string; args: any; result: ToolResult }[] = [];
    let assistantText = '';

    // Check for function calls
    const candidates = response.candidates || [];
    if (candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.functionCall) {
          const fnName = part.functionCall.name;
          const fnArgs = part.functionCall.args || {};

          // Safety Interceptor (PRD Section 3 & 4): Prevent illegal task creation for non-task intents
          if (fnName === 'createTask' && intentResult.intent !== 'TASK_CREATE') {
            console.warn('[Safety Intercept] Prevented illegal createTask call for non-task intent:', intentResult.intent);
            continue;
          }

          const result = executeToolByName(fnName, fnArgs);
          toolsExecuted.push({ toolName: fnName, args: fnArgs, result });
        }
        if (part.text) {
          assistantText += part.text;
        }
      }
    }

    // If Gemini called tools, pass tool responses back to Gemini for natural synthesis and anti-hallucination
    if (toolsExecuted.length > 0 && candidates[0]?.content) {
      try {
        const functionResponses = toolsExecuted.map((t) => ({
          functionResponse: {
            name: t.toolName,
            response: { result: t.result },
          },
        }));

        const secondResponse = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }],
            },
            candidates[0].content,
            {
              role: 'user',
              parts: functionResponses,
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });

        if (secondResponse.text) {
          assistantText = secondResponse.text.trim();
        }
      } catch (secondErr) {
        console.warn('[Gemini functionResponse turn error]', secondErr);
      }
    }

    // If Gemini called tools but gave minimal text (e.g. 2nd turn skipped or rate limited), construct an accurate confirmation
    if (!assistantText && toolsExecuted.length > 0) {
      const listInvExec = toolsExecuted.find((t) => t.toolName === 'listInventory');
      if (listInvExec && listInvExec.result.data) {
        const items = listInvExec.result.data as InventoryItem[];
        const match = userMessage.match(/(?:how many|how much|do i have|count of)\s+([a-zA-Z\s]+?)(?:\s+do i have|\s+left|\s+in inventory|\?|$)/i);
        const queryItem = match && match[1] ? match[1].replace(/do i have|left|in inventory|\?/gi, '').trim().toLowerCase() : '';
        if (queryItem) {
          const found = items.find((i) => i.name.toLowerCase().includes(queryItem));
          if (found) {
            assistantText = `You have **${found.name}** at **${found.quantity}%** stock (${found.unit || 'units'}), currently **${found.status.toUpperCase()}** in ${found.location}.`;
          } else {
            assistantText = `I don't have "${queryItem}" recorded in your current household inventory (0 in stock).`;
          }
        }
      }

      const listBillsExec = toolsExecuted.find((t) => t.toolName === 'listBills');
      if (!assistantText && listBillsExec && listBillsExec.result.data) {
        const bills = listBillsExec.result.data as Bill[];
        const match = userMessage.match(/(?:did you pay|did i pay|have i paid|is|was)\s+(?:my\s+|the\s+)?([a-zA-Z\s]+?)(?:\s+bill|\s+paid|\?|$)/i);
        const queriedName = match && match[1] ? match[1].replace(/my|the|bill|paid|\?/gi, '').trim().toLowerCase() : '';
        if (queriedName) {
          const foundBill = bills.find((b) => b.name.toLowerCase().includes(queriedName));
          if (foundBill) {
            assistantText = foundBill.paid
              ? `Yes, your **${foundBill.name}** ($${foundBill.amount}) has been marked as **PAID**.`
              : `No, your **${foundBill.name}** ($${foundBill.amount}) is **UNPAID** and currently due **${foundBill.dueDate}**.`;
          } else {
            assistantText = `I don't have any record of a "${queriedName}" bill in your household records (not recorded).`;
          }
        }
      }

      if (!assistantText) {
        assistantText = toolsExecuted.map((t) => t.result.message).join('\n\n');
      }
    }

    if (!assistantText && toolsExecuted.length === 0) {
      // Fallback if model returned empty
      return fallbackNlpAgent(userMessage);
    }

    stateManager.incrementMessageCount();

    return {
      response: assistantText,
      toolsExecuted,
    };
  } catch (error) {
    console.error('[Gemini Agent Error]', error);
    return fallbackNlpAgent(userMessage);
  }
}
