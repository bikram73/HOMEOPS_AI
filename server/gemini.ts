import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { tools, ToolResult } from './tools';
import { stateManager } from './state';

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'createTask',
    description: 'Creates a new household chore or task in the in-memory state.',
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
    name: 'updateInventory',
    description: 'Updates the stock level or status of an inventory item. If low/critical, it auto-queues to shopping list.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        nameOrId: { type: Type.STRING, description: 'Name of the item (e.g. "detergent", "rice", "toothpaste", "milk")' },
        quantity: { type: Type.NUMBER, description: 'Remaining quantity percentage (0 to 100)' },
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

  // 1. "What should I do now?" / "What should I do right now?" / "What to do?"
  if (
    msg.includes('what should i do right now') ||
    msg.includes('what should i do now') ||
    msg.includes('what should i do today') ||
    msg.includes('what do i need to do') ||
    msg.includes('what to do now') ||
    msg.includes('what is urgent')
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

  // 10. Default contextual action
  const createdTask = tools.createTask({ title: userMessage, category: 'general', priority: 'medium' });
  toolsExecuted.push({ toolName: 'createTask', args: { title: userMessage }, result: createdTask });

  return {
    response: `Understood. I've noted this as a household task: "${userMessage}". Let me know if you'd like to assign a specific deadline, priority, or category to it.`,
    toolsExecuted,
  };
}

// Master agent processing function using server-side Gemini SDK if key is configured, or high-fidelity fallback
export async function processUserMessage(userMessage: string, history: any[] = []): Promise<AgentProcessResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Graceful fallback for preview / demo without requiring manual API key insertion
    return fallbackNlpAgent(userMessage);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are HomeOps, an intelligent household operations agent.
Your responsibility is to help users organize, monitor, and execute their everyday household responsibilities.
You have tools to create, update, complete, and prioritize tasks, inventory, shopping items, bills, and maintenance schedules.
Never invent information. Always call the corresponding tool when a user asks to change, view, or prioritize household state.
Keep your answers concise, practical, authoritative, and action-oriented.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
          const result = executeToolByName(fnName, fnArgs);
          toolsExecuted.push({ toolName: fnName, args: fnArgs, result });
        }
        if (part.text) {
          assistantText += part.text;
        }
      }
    }

    // If Gemini called tools but gave minimal text, construct a clean confirmation
    if (!assistantText && toolsExecuted.length > 0) {
      assistantText = toolsExecuted.map((t) => t.result.message).join('\n\n');
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
