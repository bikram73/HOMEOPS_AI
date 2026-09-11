import {
  HomeState,
  Task,
  InventoryItem,
  ShoppingItem,
  Bill,
  MaintenanceTask,
  ActivityLog,
  AnalyticsData,
  ActivityEvent,
  ActivitySource,
  ActivityType,
} from './types';

// Helper functions for dates & times
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalTime(d: Date = new Date()): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getRelativeDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return getLocalDateString(d);
}

// In-Memory Ephemeral State (Hackathon MVP: session-based, no external database required)
class StateManager {
  private state: HomeState;

  constructor() {
    this.state = this.getInitialSeedState();
  }

  private getInitialSeedState(): HomeState {
    return {
      tasks: [],
      inventory: [],
      shopping: [],
      bills: [],
      maintenance: [],
      activities: [],
      activityEvents: [],
      analytics: {
        activeUsers: 1,
        messages: 0,
        activeDays: 1,
        tasksCreated: 0,
        tasksCompleted: 0,
        shoppingItems: 0,
        aiPlansGenerated: 0,
      },
    };
  }

  private getLegacySeedState(): HomeState {
    return {
      tasks: [
        {
          id: 'task-1',
          title: 'Pay electricity bill',
          category: 'bill',
          priority: 'high',
          dueDate: 'Today',
          amount: '$145.20',
          provider: 'City Power Co.',
          completed: false,
          aiRecommended: true,
          aiInsight: 'Handle today to avoid a late fee. Rate increases by 10% past deadline.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'task-2',
          title: 'Schedule AC maintenance',
          category: 'maintenance',
          priority: 'high',
          dueDate: 'Tomorrow',
          amount: '$89.00',
          provider: 'CoolAir Services',
          completed: false,
          aiInsight: 'Filter needs replacement before seasonal heat surge.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'task-3',
          title: 'Buy Detergent',
          category: 'shopping',
          priority: 'high',
          dueDate: 'Today',
          amount: '$18.50',
          provider: 'SuperMart',
          completed: false,
          aiRecommended: true,
          aiInsight: 'Estimated only 4 washes left in current bottle.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'task-4',
          title: 'Clean kitchen sink and countertops',
          category: 'cleaning',
          priority: 'medium',
          dueDate: 'Today',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'task-5',
          title: 'Check water filter status',
          category: 'maintenance',
          priority: 'medium',
          dueDate: 'In 3 days',
          completed: false,
          aiInsight: 'Quarterly reverse osmosis check scheduled.',
          createdAt: new Date().toISOString(),
        },
      ],
      inventory: [
        {
          id: 'inv-1',
          name: 'Jasmine Rice',
          category: 'Pantry',
          quantity: 70,
          unit: '5kg bag',
          status: 'good',
          location: 'Pantry • Shelf 2',
          estimatedRemaining: 'Estimated 3 weeks remaining.',
          lastRestocked: '2 weeks ago',
          avgUsage: '1 bag / month',
          icon: 'rice_bowl',
        },
        {
          id: 'inv-2',
          name: 'Laundry Detergent',
          category: 'Cleaning',
          quantity: 20,
          unit: '92 oz bottle',
          status: 'critical',
          location: 'Laundry Room',
          subLocation: 'Tide Liquid, 92 oz',
          estimatedRemaining: 'Estimated 4 washes remaining.',
          lastRestocked: '1 month ago',
          avgUsage: '1 bottle / 6 wks',
          icon: 'local_laundry_service',
        },
        {
          id: 'inv-3',
          name: 'Mint Toothpaste',
          category: 'Personal Care',
          quantity: 30,
          unit: '6 oz tube',
          status: 'low',
          location: 'Master Bathroom',
          subLocation: 'Colgate Fresh Mint',
          estimatedRemaining: 'Estimated 5 days remaining.',
          lastRestocked: '3 weeks ago',
          avgUsage: '1 tube / month',
          icon: 'health_and_beauty',
        },
        {
          id: 'inv-4',
          name: 'Olive Oil',
          category: 'Pantry',
          quantity: 60,
          unit: '1L Bottle',
          status: 'good',
          location: 'Pantry • Bottom Shelf',
          subLocation: 'Extra Virgin 1L',
          estimatedRemaining: 'Estimated 2.5 weeks remaining.',
          lastRestocked: '1 week ago',
          avgUsage: '1 bottle / 5 wks',
          icon: 'oil_barrel',
        },
        {
          id: 'inv-5',
          name: 'Organic Whole Milk',
          category: 'Fridge',
          quantity: 20,
          unit: '1 Gallon',
          status: 'critical',
          location: 'Kitchen Refrigerator',
          subLocation: 'Top Shelf',
          estimatedRemaining: 'Estimated 1 day remaining.',
          lastRestocked: '5 days ago',
          avgUsage: '2 gallons / wk',
          icon: 'liquor',
        },
      ],
      shopping: [
        {
          id: 'shop-1',
          name: 'Whole Milk',
          category: 'Fridge • Whole, 1 Gal',
          quantity: '1 gallon',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'shop-2',
          name: 'Laundry Detergent',
          category: 'Cleaning • Liquid, 2L',
          quantity: '1 bottle',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'shop-3',
          name: 'Mint Toothpaste',
          category: 'Personal Care • Mint',
          quantity: '2 tubes',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      bills: [
        {
          id: 'bill-1',
          name: 'City Electricity Board',
          amount: 145.2,
          dueDate: 'Tomorrow, 6:00 PM',
          paid: false,
          isAutoPay: false,
          dueCategory: 'Due Tomorrow',
          icon: 'bolt',
        },
        {
          id: 'bill-2',
          name: 'Fiber Internet & Wi-Fi',
          amount: 69.99,
          dueDate: 'Due in 5 days',
          paid: false,
          isAutoPay: true,
          dueCategory: 'Due Soon',
          icon: 'wifi',
        },
        {
          id: 'bill-3',
          name: 'City Water & Sewer',
          amount: 45.0,
          dueDate: 'Paid on 15th',
          paid: true,
          dueCategory: 'Paid',
          icon: 'water_drop',
        },
        {
          id: 'bill-4',
          name: 'Natural Gas Utility',
          amount: 82.5,
          dueDate: 'Paid on 10th',
          paid: true,
          dueCategory: 'Paid',
          icon: 'local_fire_department',
        },
      ],
      maintenance: [
        {
          id: 'maint-1',
          title: 'AC Primary Filter Replacement',
          category: 'HVAC',
          dueDate: 'Overdue by 2 days',
          status: 'overdue',
          provider: 'CoolAir Techs',
          notes: 'Quarterly MERV 11 filter swap required to maintain airflow efficiency.',
        },
        {
          id: 'maint-2',
          title: 'Water Softener Salt Replenishment',
          category: 'Plumbing',
          dueDate: 'In 6 days',
          status: 'pending',
          provider: 'Self',
          notes: 'Add 2 bags of solar crystal salt to brine tank.',
        },
        {
          id: 'maint-3',
          title: 'Smoke & CO Alarm Battery Test',
          category: 'Safety',
          dueDate: 'Completed last week',
          status: 'completed',
          provider: 'Self',
          notes: 'All 4 sensors tested functional with 9V backups intact.',
        },
      ],
      activities: [
        {
          id: 'act-1',
          title: 'Detergent Marked Low',
          subtitle: 'Auto-added to shopping list',
          timeAgo: 'Just now',
          icon: 'inventory_2',
          timestamp: Date.now() - 60000,
        },
        {
          id: 'act-2',
          title: 'Electricity Due Reminder',
          subtitle: '$145.20 due tomorrow',
          timeAgo: '15m ago',
          icon: 'receipt_long',
          timestamp: Date.now() - 900000,
        },
        {
          id: 'act-3',
          title: 'Kitchen Sink Cleaned',
          subtitle: 'Completed by household member',
          timeAgo: '2h ago',
          icon: 'check_circle',
          timestamp: Date.now() - 7200000,
        },
      ],
      activityEvents: [
        {
          id: 'ACT-1725981234567',
          type: 'ai',
          action: 'ai_task_created',
          title: 'Task created by HomeOps AI',
          description: 'Clean water filter reverse-osmosis pre-membrane',
          timestamp: `${getLocalDateString()}T16:10:00.000Z`,
          date: getLocalDateString(),
          time: '04:10 PM',
          source: 'ai',
          entityType: 'task',
          entityId: 'task-5',
          entityName: 'Clean water filter',
          after: { title: 'Clean water filter', priority: 'medium' },
        },
        {
          id: 'ACT-1725981234566',
          type: 'bill',
          action: 'bill_paid',
          title: 'Electricity bill marked as paid',
          description: 'City Power & Light settled via Telegram',
          timestamp: `${getLocalDateString()}T14:30:00.000Z`,
          date: getLocalDateString(),
          time: '02:30 PM',
          source: 'telegram',
          entityType: 'bill',
          entityId: 'bill-1',
          entityName: 'Electricity Bill',
          before: { status: 'Unpaid', amount: '₹1,250' },
          after: { status: 'Paid', amount: '₹1,250' },
          diff: { field: 'status', before: 'Unpaid', after: 'Paid', unit: '₹1,250' },
        },
        {
          id: 'ACT-1725981234565',
          type: 'automation',
          action: 'auto_restock_added',
          title: 'Added to shopping list',
          description: 'Jasmine Rice automatically queued due to low stock threshold',
          timestamp: `${getLocalDateString()}T11:05:00.000Z`,
          date: getLocalDateString(),
          time: '11:05 AM',
          source: 'automation',
          entityType: 'shopping',
          entityName: 'Rice',
          after: { quantity: '1 bag (5 kg)', category: 'Pantry' },
        },
        {
          id: 'ACT-1725981234564',
          type: 'inventory',
          action: 'inventory_level_updated',
          title: 'Inventory updated: Rice',
          description: 'Rice level decreased from 2 kg to 0.5 kg',
          timestamp: `${getLocalDateString()}T10:20:00.000Z`,
          date: getLocalDateString(),
          time: '10:20 AM',
          source: 'user',
          entityType: 'inventory',
          entityId: 'inv-1',
          entityName: 'Jasmine Rice',
          before: '2 kg',
          after: '0.5 kg',
          diff: { field: 'quantity', before: '2 kg', after: '0.5 kg', unit: 'kg' },
        },
        {
          id: 'ACT-1725981234563',
          type: 'task',
          action: 'task_completed',
          title: 'Completed: Clean kitchen',
          description: 'Kitchen countertops, stove burners, and sink disinfected',
          timestamp: `${getLocalDateString()}T09:15:00.000Z`,
          date: getLocalDateString(),
          time: '09:15 AM',
          source: 'user',
          entityType: 'task',
          entityId: 'task-4',
          entityName: 'Clean kitchen',
          before: { completed: false },
          after: { completed: true },
        },
        {
          id: 'ACT-1725981234562',
          type: 'shopping',
          action: 'shopping_item_added',
          title: 'Shopping Item Added',
          description: 'Whole Milk — 2 packets',
          timestamp: `${getRelativeDateString(-1)}T16:30:00.000Z`,
          date: getRelativeDateString(-1),
          time: '04:30 PM',
          source: 'user',
          entityType: 'shopping',
          entityName: 'Whole Milk',
          after: { quantity: '2 packets', category: 'Dairy' },
        },
        {
          id: 'ACT-1725981234561',
          type: 'maintenance',
          action: 'maintenance_completed',
          title: 'Washing machine maintenance completed',
          description: 'Lint filter cleaned & drum sterilization cycle run',
          timestamp: `${getRelativeDateString(-1)}T11:00:00.000Z`,
          date: getRelativeDateString(-1),
          time: '11:00 AM',
          source: 'user',
          entityType: 'maintenance',
          entityId: 'maint-washing-machine',
          entityName: 'Washing Machine Service',
          before: { status: 'Pending' },
          after: { status: 'Completed' },
        },
        {
          id: 'ACT-1725981234560',
          type: 'inventory',
          action: 'inventory_critical_detected',
          title: 'Critical stock detected: Laundry Detergent',
          description: 'Detergent level dropped below 20% threshold',
          timestamp: `${getRelativeDateString(-1)}T08:45:00.000Z`,
          date: getRelativeDateString(-1),
          time: '08:45 AM',
          source: 'automation',
          entityType: 'inventory',
          entityName: 'Laundry Detergent',
          before: '45%',
          after: '18%',
          diff: { field: 'capacity', before: '45%', after: '18%', unit: '%' },
        },
        {
          id: 'ACT-1725981234559',
          type: 'telegram',
          action: 'telegram_task_created',
          title: 'Task created via Telegram',
          description: '"Buy fresh vegetables on way back"',
          timestamp: `${getRelativeDateString(-2)}T18:20:00.000Z`,
          date: getRelativeDateString(-2),
          time: '06:20 PM',
          source: 'telegram',
          entityType: 'task',
          entityName: 'Buy vegetables',
          after: { title: 'Buy fresh vegetables', priority: 'high' },
        },
        {
          id: 'ACT-1725981234558',
          type: 'bill',
          action: 'bill_created',
          title: 'New bill registered: Internet Fiber',
          description: 'Monthly broadband invoice ₹1,499 registered with due date in 5 days',
          timestamp: `${getRelativeDateString(-2)}T10:00:00.000Z`,
          date: getRelativeDateString(-2),
          time: '10:00 AM',
          source: 'system',
          entityType: 'bill',
          entityName: 'Internet Fiber',
          after: { amount: '₹1,499', dueDate: 'Due in 5 days' },
        },
        {
          id: 'ACT-1725981234557',
          type: 'ai',
          action: 'ai_inventory_optimized',
          title: 'AI weekly replenishment plan created',
          description: 'Analyzed weekly depletion velocity across 14 household pantry staples',
          timestamp: `${getRelativeDateString(-3)}T14:15:00.000Z`,
          date: getRelativeDateString(-3),
          time: '02:15 PM',
          source: 'ai',
          entityType: 'system',
          entityName: 'Pantry Optimization Plan',
        },
      ],
      analytics: {
        activeUsers: 18,
        messages: 642,
        activeDays: 9,
        tasksCreated: 128,
        tasksCompleted: 96,
        shoppingItems: 74,
        aiPlansGenerated: 51,
      },
    };
  }

  public getState(): HomeState {
    return this.state;
  }

  public resetState(): HomeState {
    this.state = this.getInitialSeedState();
    return this.state;
  }

  // --- Task Methods ---
  public addTask(
    title: string,
    category: Task['category'] = 'general',
    priority: Task['priority'] = 'medium',
    dueDate: string = 'Today',
    amount?: string,
    provider?: string,
    source: ActivitySource = 'user'
  ): Task {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      category,
      priority,
      dueDate,
      amount,
      provider,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.state.tasks.unshift(newTask);
    this.state.analytics.tasksCreated++;
    this.recordActivityEvent({
      type: 'task',
      action: 'task_created',
      title: `Task created: ${title}`,
      description: `Category: ${category} • Priority: ${priority} • Due: ${dueDate}`,
      source,
      entityType: 'task',
      entityId: newTask.id,
      entityName: title,
      after: newTask,
    });
    return newTask;
  }

  public updateTask(id: string, updates: Partial<Task>, source: ActivitySource = 'user'): Task | null {
    const task = this.state.tasks.find((t) => t.id === id || t.title.toLowerCase().includes(id.toLowerCase()));
    if (!task) return null;
    const prev = { ...task };
    Object.assign(task, updates);
    this.recordActivityEvent({
      type: 'task',
      action: 'task_updated',
      title: `Task updated: ${task.title}`,
      description: Object.keys(updates).join(', '),
      source,
      entityType: 'task',
      entityId: task.id,
      entityName: task.title,
      before: prev,
      after: task,
    });
    return task;
  }

  public completeTask(idOrTitle: string, completed: boolean = true, source: ActivitySource = 'user'): Task | null {
    const task = this.state.tasks.find(
      (t) => t.id === idOrTitle || t.title.toLowerCase().includes(idOrTitle.toLowerCase())
    );
    if (!task) return null;
    const prev = task.completed;
    task.completed = completed;
    if (completed) {
      this.state.analytics.tasksCompleted++;
    }
    this.recordActivityEvent({
      type: 'task',
      action: completed ? 'task_completed' : 'task_reopened',
      title: completed ? `Completed: ${task.title}` : `Reopened: ${task.title}`,
      description: completed ? 'Marked as completed' : 'Marked as active',
      source,
      entityType: 'task',
      entityId: task.id,
      entityName: task.title,
      before: { completed: prev },
      after: { completed },
    });
    return task;
  }

  public deleteTask(idOrTitle: string, source: ActivitySource = 'user'): boolean {
    const task = this.state.tasks.find(
      (t) => t.id === idOrTitle || t.title.toLowerCase().includes(idOrTitle.toLowerCase())
    );
    const initialLength = this.state.tasks.length;
    this.state.tasks = this.state.tasks.filter(
      (t) => t.id !== idOrTitle && !t.title.toLowerCase().includes(idOrTitle.toLowerCase())
    );
    if (task && this.state.tasks.length < initialLength) {
      this.recordActivityEvent({
        type: 'task',
        action: 'task_deleted',
        title: `Task deleted: ${task.title}`,
        source,
        entityType: 'task',
        entityId: task.id,
        entityName: task.title,
        before: task,
      });
      return true;
    }
    return this.state.tasks.length < initialLength;
  }

  // --- Inventory Methods ---
  public addInventoryItem(
    name: string,
    quantity: number = 100,
    unit: string = 'unit',
    status?: InventoryItem['status'],
    category: string = 'General',
    source: ActivitySource = 'user',
    location?: string,
    subLocation?: string,
    estimatedRemaining?: string,
    lastRestocked?: string,
    avgUsage?: string,
    icon?: string,
    id?: string,
    badge?: string,
    date?: string
  ): InventoryItem {
    const computedStatus: InventoryItem['status'] =
      status || (quantity <= 20 ? 'critical' : quantity <= 35 ? 'low' : 'good');

    const existing = this.state.inventory.find(
      (i) => (id && i.id === id) || i.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      const prevQty = existing.quantity;
      const prevStatus = existing.status;
      existing.quantity = quantity;
      existing.status = computedStatus;
      if (unit) existing.unit = unit;
      if (category) existing.category = category;
      if (location) existing.location = location;
      if (subLocation) existing.subLocation = subLocation;
      if (estimatedRemaining) existing.estimatedRemaining = estimatedRemaining;
      if (lastRestocked) existing.lastRestocked = lastRestocked;
      if (avgUsage) existing.avgUsage = avgUsage;
      if (icon) existing.icon = icon;
      if (badge) existing.badge = badge;
      if (date) existing.date = date;

      this.recordActivityEvent({
        type: 'inventory',
        action: 'inventory_level_updated',
        title: `Inventory updated: ${existing.name}`,
        description: `Quantity changed from ${prevQty}% to ${quantity}%`,
        source,
        entityType: 'inventory',
        entityId: existing.id,
        entityName: existing.name,
        before: `${prevQty}% (${prevStatus})`,
        after: `${quantity}% (${computedStatus})`,
        diff: { field: 'quantity', before: prevQty, after: quantity, unit: '%' },
      });
      if (computedStatus === 'low' || computedStatus === 'critical') {
        this.addShoppingItem(existing.name, '1 unit', existing.category, 'automation');
      }
      return existing;
    }

    const newItem: InventoryItem = {
      id: id || `inv-${Date.now()}`,
      name,
      category: category || 'General',
      quantity,
      unit: unit || 'units',
      status: computedStatus,
      icon: icon || 'inventory_2',
      location: location || 'Pantry / Storage',
      subLocation: subLocation || 'Standard Pack',
      estimatedRemaining: estimatedRemaining || (quantity <= 30 ? 'Low stock - restock soon' : 'Estimated 2-3 weeks remaining'),
      lastRestocked: lastRestocked || 'Just now',
      avgUsage: avgUsage || 'Regular weekly use',
      badge: badge || (computedStatus === 'low' || computedStatus === 'critical' ? 'Low' : 'Normal'),
      date: date || new Date().toISOString().split('T')[0],
    };
    this.state.inventory.push(newItem);
    this.recordActivityEvent({
      type: 'inventory',
      action: 'inventory_added',
      title: `Inventory added: ${name}`,
      description: `Starting level: ${quantity}% (${computedStatus})`,
      source,
      entityType: 'inventory',
      entityId: newItem.id,
      entityName: name,
      after: { quantity, status: computedStatus },
    });

    if (computedStatus === 'low' || computedStatus === 'critical') {
      this.addShoppingItem(newItem.name, '1 unit', newItem.category, 'automation');
    }

    return newItem;
  }

  public deleteInventoryItem(idOrName: string, source: ActivitySource = 'user'): boolean {
    const initialLen = this.state.inventory.length;
    const target = this.state.inventory.find(
      (i) => i.id === idOrName || i.name.toLowerCase() === idOrName.toLowerCase()
    );
    this.state.inventory = this.state.inventory.filter(
      (i) => i.id !== idOrName && i.name.toLowerCase() !== idOrName.toLowerCase()
    );
    if (target) {
      this.recordActivityEvent({
        type: 'inventory',
        action: 'inventory_removed',
        title: `Inventory item removed: ${target.name}`,
        description: `Removed from ${target.location || 'inventory'}`,
        source,
        entityType: 'inventory',
        entityId: target.id,
        entityName: target.name,
      });
      return true;
    }
    return this.state.inventory.length < initialLen;
  }

  public updateInventory(
    nameOrId: string,
    quantity?: number,
    status?: InventoryItem['status'],
    source: ActivitySource = 'user'
  ): InventoryItem | null {
    const item = this.state.inventory.find(
      (i) => i.id === nameOrId || i.name.toLowerCase().includes(nameOrId.toLowerCase())
    );
    if (!item) return null;

    const prevQty = item.quantity;
    const prevStatus = item.status;

    if (quantity !== undefined) {
      item.quantity = Math.max(0, Math.min(100, quantity));
      if (!status) {
        if (item.quantity <= 20) item.status = 'critical';
        else if (item.quantity <= 35) item.status = 'low';
        else item.status = 'good';
      }
    }
    if (status) item.status = status;

    this.recordActivityEvent({
      type: 'inventory',
      action: 'inventory_level_updated',
      title: `Inventory updated: ${item.name}`,
      description: `Level adjusted from ${prevQty}% to ${item.quantity}% (${item.status})`,
      source,
      entityType: 'inventory',
      entityId: item.id,
      entityName: item.name,
      before: `${prevQty}% (${prevStatus})`,
      after: `${item.quantity}% (${item.status})`,
      diff: { field: 'quantity', before: prevQty, after: item.quantity, unit: '%' },
    });

    if (item.status === 'low' || item.status === 'critical') {
      this.addShoppingItem(item.name, '1 unit', item.category, 'automation');
    }

    return item;
  }

  // --- Shopping Methods ---
  public addShoppingItem(
    name: string,
    quantity: string = '1 item',
    category?: string,
    source: ActivitySource = 'user'
  ): ShoppingItem {
    const existing = this.state.shopping.find(
      (s) => s.name.toLowerCase().trim() === name.toLowerCase().trim() && !s.completed
    );
    if (existing) return existing;

    const newItem: ShoppingItem = {
      id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name,
      quantity,
      category: category || 'Household',
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.state.shopping.unshift(newItem);
    this.state.analytics.shoppingItems++;
    this.recordActivityEvent({
      type: 'shopping',
      action: 'shopping_item_added',
      title: `Added to shopping list: ${name}`,
      description: `Qty: ${quantity} • Category: ${category || 'Household'}`,
      source,
      entityType: 'shopping',
      entityId: newItem.id,
      entityName: name,
      after: { quantity, category: newItem.category },
    });
    return newItem;
  }

  public completeShoppingItem(idOrName: string, completed: boolean = true, source: ActivitySource = 'user'): ShoppingItem | null {
    const item = this.state.shopping.find(
      (s) => s.id === idOrName || s.name.toLowerCase().includes(idOrName.toLowerCase())
    );
    if (!item) return null;
    item.completed = completed;
    this.recordActivityEvent({
      type: 'shopping',
      action: completed ? 'shopping_item_completed' : 'shopping_item_reopened',
      title: completed ? `Purchased: ${item.name}` : `Re-added: ${item.name}`,
      description: completed ? 'Marked as bought' : 'Moved back to list',
      source,
      entityType: 'shopping',
      entityId: item.id,
      entityName: item.name,
      after: { completed },
    });
    return item;
  }

  public removeShoppingItem(idOrName: string, source: ActivitySource = 'user'): boolean {
    const item = this.state.shopping.find(
      (s) => s.id === idOrName || s.name.toLowerCase().includes(idOrName.toLowerCase())
    );
    const initialLength = this.state.shopping.length;
    this.state.shopping = this.state.shopping.filter(
      (s) => s.id !== idOrName && !s.name.toLowerCase().includes(idOrName.toLowerCase())
    );
    if (item && this.state.shopping.length < initialLength) {
      this.recordActivityEvent({
        type: 'shopping',
        action: 'shopping_item_removed',
        title: `Removed from shopping list: ${item.name}`,
        source,
        entityType: 'shopping',
        entityId: item.id,
        entityName: item.name,
      });
      return true;
    }
    return this.state.shopping.length < initialLength;
  }

  // --- Bill Methods ---
  public addBill(
    name: string,
    amount: number = 0,
    dueDate: string = 'Upcoming',
    source: ActivitySource = 'user'
  ): Bill {
    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      name,
      amount,
      dueDate,
      paid: false,
      dueCategory: dueDate.toLowerCase().includes('tomorrow') ? 'Due Tomorrow' : 'Upcoming',
      icon: 'receipt',
    };
    this.state.bills.unshift(newBill);
    this.recordActivityEvent({
      type: 'bill',
      action: 'bill_created',
      title: `New bill registered: ${name}`,
      description: `Amount: $${amount} • Due: ${dueDate}`,
      source,
      entityType: 'bill',
      entityId: newBill.id,
      entityName: name,
      after: newBill,
    });
    return newBill;
  }

  public markBillPaid(idOrName?: string, paid: boolean = true, source: ActivitySource = 'user'): Bill | null {
    if (!idOrName || typeof idOrName !== 'string' || !idOrName.trim()) return null;
    const target = idOrName.trim().toLowerCase();
    const bill = this.state.bills.find(
      (b) => b.id.toLowerCase() === target || b.name.toLowerCase().includes(target)
    );
    if (!bill) return null;
    const prevPaid = bill.paid;
    bill.paid = paid;
    bill.dueCategory = paid ? 'Paid' : 'Due Soon';

    this.recordActivityEvent({
      type: 'bill',
      action: paid ? 'bill_paid' : 'bill_marked_unpaid',
      title: paid ? `Bill marked as paid: ${bill.name}` : `Bill marked unpaid: ${bill.name}`,
      description: `Amount: $${bill.amount} • Due date: ${bill.dueDate}`,
      source,
      entityType: 'bill',
      entityId: bill.id,
      entityName: bill.name,
      before: { paid: prevPaid, amount: bill.amount },
      after: { paid, amount: bill.amount },
      diff: { field: 'paid', before: prevPaid, after: paid, unit: `$${bill.amount}` },
    });
    return bill;
  }

  // --- Maintenance Methods ---
  public addMaintenanceTask(
    title: string,
    category: string = 'General',
    dueDate: string = 'Due in 7 days',
    provider?: string,
    source: ActivitySource = 'user'
  ): MaintenanceTask {
    const newTask: MaintenanceTask = {
      id: `maint-${Date.now()}`,
      title,
      category,
      dueDate,
      status: 'pending',
      provider,
    };
    this.state.maintenance.unshift(newTask);
    this.recordActivityEvent({
      type: 'maintenance',
      action: 'maintenance_scheduled',
      title: `Maintenance scheduled: ${title}`,
      description: `Category: ${category} • Due: ${dueDate}${provider ? ` • Provider: ${provider}` : ''}`,
      source,
      entityType: 'maintenance',
      entityId: newTask.id,
      entityName: title,
      after: newTask,
    });
    return newTask;
  }

  public completeMaintenanceTask(
    idOrTitle: string,
    status: MaintenanceTask['status'] = 'completed',
    source: ActivitySource = 'user'
  ): MaintenanceTask | null {
    const item = this.state.maintenance.find(
      (m) => m.id === idOrTitle || m.title.toLowerCase().includes(idOrTitle.toLowerCase())
    );
    if (!item) return null;
    const prevStatus = item.status;
    item.status = status;
    this.recordActivityEvent({
      type: 'maintenance',
      action: 'maintenance_completed',
      title: `Maintenance updated: ${item.title}`,
      description: `Status changed from ${prevStatus} to ${status}`,
      source,
      entityType: 'maintenance',
      entityId: item.id,
      entityName: item.title,
      before: { status: prevStatus },
      after: { status },
    });
    return item;
  }

  // --- Activity & Analytics ---
  public recordActivity(title: string, subtitle: string, icon: string = 'notifications') {
    this.state.activities.unshift({
      id: `act-${Date.now()}`,
      title,
      subtitle,
      timeAgo: 'Just now',
      icon,
      timestamp: Date.now(),
    });
    if (this.state.activities.length > 20) {
      this.state.activities.pop();
    }
  }

  public recordActivityEvent(event: {
    type: ActivityType;
    action: string;
    title: string;
    description?: string;
    source?: ActivitySource;
    entityType?: 'task' | 'inventory' | 'shopping' | 'bill' | 'maintenance' | 'system';
    entityId?: string;
    entityName?: string;
    before?: unknown;
    after?: unknown;
    diff?: { field?: string; before?: unknown; after?: unknown; unit?: string };
    metadata?: Record<string, unknown>;
    timestamp?: string;
    date?: string;
    time?: string;
  }): ActivityEvent {
    const now = new Date();
    const timestamp = event.timestamp || now.toISOString();
    const date = event.date || getLocalDateString(now);
    const time = event.time || formatLocalTime(now);
    const id = `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const fullEvent: ActivityEvent = {
      id,
      type: event.type,
      action: event.action,
      title: event.title,
      description: event.description,
      timestamp,
      date,
      time,
      source: event.source || 'user',
      entityType: event.entityType,
      entityId: event.entityId,
      entityName: event.entityName,
      before: event.before,
      after: event.after,
      diff: event.diff,
      metadata: event.metadata,
    };

    if (!Array.isArray(this.state.activityEvents)) {
      this.state.activityEvents = [];
    }

    this.state.activityEvents.unshift(fullEvent);
    if (this.state.activityEvents.length > 3000) {
      this.state.activityEvents.pop();
    }

    // Also update legacy activities list
    this.recordActivity(event.title, event.description || event.action);

    return fullEvent;
  }

  // --- Historical Activity Queries ---
  public getActivitiesByDate(date: string): ActivityEvent[] {
    return (this.state.activityEvents || []).filter((a) => a.date === date);
  }

  public getActivitiesByDateRange(startDate: string, endDate: string): ActivityEvent[] {
    return (this.state.activityEvents || []).filter(
      (a) => a.date >= startDate && a.date <= endDate
    );
  }

  public getActivitiesByCategory(type: string, limit: number = 50): ActivityEvent[] {
    const events = (this.state.activityEvents || []).filter((a) => a.type === type);
    return events.slice(0, limit);
  }

  public getLastActivityForEntity(entityNameOrId: string): ActivityEvent | null {
    const target = entityNameOrId.toLowerCase().trim();
    const event = (this.state.activityEvents || []).find((a) => {
      if (a.entityId && a.entityId.toLowerCase() === target) return true;
      if (a.entityName && a.entityName.toLowerCase().includes(target)) return true;
      if (a.title.toLowerCase().includes(target)) return true;
      return false;
    });
    return event || null;
  }

  public getUpcomingEvents(daysAhead: number = 30): Array<{
    id: string;
    date: string;
    title: string;
    subtitle: string;
    type: 'bill' | 'maintenance' | 'task';
    amount?: string | number;
    priority?: string;
    status?: string;
    sourceEntityId: string;
  }> {
    const results: Array<any> = [];

    // Derive upcoming from bills
    for (const b of this.state.bills) {
      if (!b.paid) {
        const targetDate = new Date();
        const lowerDue = (b.dueDate || '').toLowerCase();
        if (lowerDue.includes('tomorrow')) {
          targetDate.setDate(targetDate.getDate() + 1);
        } else if (lowerDue.includes('5 days')) {
          targetDate.setDate(targetDate.getDate() + 5);
        } else if (lowerDue.includes('7 days') || lowerDue.includes('week')) {
          targetDate.setDate(targetDate.getDate() + 7);
        } else {
          targetDate.setDate(targetDate.getDate() + 3);
        }
        results.push({
          id: `upcoming-bill-${b.id}`,
          date: getLocalDateString(targetDate),
          title: `Bill Due: ${b.name}`,
          subtitle: `$${b.amount} • Due ${b.dueDate}`,
          type: 'bill',
          amount: b.amount,
          status: 'unpaid',
          sourceEntityId: b.id,
        });
      }
    }

    // Derive upcoming from maintenance
    for (const m of this.state.maintenance) {
      if (m.status !== 'completed') {
        const targetDate = new Date();
        const lowerDue = (m.dueDate || '').toLowerCase();
        if (lowerDue.includes('tomorrow')) {
          targetDate.setDate(targetDate.getDate() + 1);
        } else if (lowerDue.includes('6 days') || lowerDue.includes('7 days')) {
          targetDate.setDate(targetDate.getDate() + 6);
        } else if (lowerDue.includes('14 days') || lowerDue.includes('2 weeks')) {
          targetDate.setDate(targetDate.getDate() + 14);
        } else {
          targetDate.setDate(targetDate.getDate() + 4);
        }
        results.push({
          id: `upcoming-maint-${m.id}`,
          date: getLocalDateString(targetDate),
          title: `Maintenance: ${m.title}`,
          subtitle: `${m.category} • ${m.dueDate}`,
          type: 'maintenance',
          status: m.status,
          sourceEntityId: m.id,
        });
      }
    }

    // Derive upcoming from tasks
    for (const t of this.state.tasks) {
      if (!t.completed && t.dueDate && !t.dueDate.toLowerCase().includes('today')) {
        const targetDate = new Date();
        const lowerDue = t.dueDate.toLowerCase();
        if (lowerDue.includes('tomorrow')) {
          targetDate.setDate(targetDate.getDate() + 1);
        } else if (lowerDue.includes('friday')) {
          targetDate.setDate(targetDate.getDate() + 2);
        } else {
          targetDate.setDate(targetDate.getDate() + 3);
        }
        results.push({
          id: `upcoming-task-${t.id}`,
          date: getLocalDateString(targetDate),
          title: `Task Due: ${t.title}`,
          subtitle: `${t.priority.toUpperCase()} priority • ${t.category}`,
          type: 'task',
          priority: t.priority,
          status: 'pending',
          sourceEntityId: t.id,
        });
      }
    }

    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  public getActivitySummary(period: 'today' | 'yesterday' | 'week' | 'month' = 'today'): {
    period: string;
    totalEvents: number;
    breakdown: Record<string, number>;
    sources: Record<string, number>;
    recentEvents: ActivityEvent[];
  } {
    const todayStr = getLocalDateString();
    const yesterdayStr = getRelativeDateString(-1);
    const weekAgoStr = getRelativeDateString(-7);
    const monthAgoStr = getRelativeDateString(-30);

    let filtered = this.state.activityEvents || [];
    if (period === 'today') {
      filtered = filtered.filter((a) => a.date === todayStr);
    } else if (period === 'yesterday') {
      filtered = filtered.filter((a) => a.date === yesterdayStr);
    } else if (period === 'week') {
      filtered = filtered.filter((a) => a.date >= weekAgoStr);
    } else if (period === 'month') {
      filtered = filtered.filter((a) => a.date >= monthAgoStr);
    }

    const breakdown: Record<string, number> = {};
    const sources: Record<string, number> = {};

    for (const event of filtered) {
      breakdown[event.type] = (breakdown[event.type] || 0) + 1;
      sources[event.source] = (sources[event.source] || 0) + 1;
    }

    return {
      period,
      totalEvents: filtered.length,
      breakdown,
      sources,
      recentEvents: filtered.slice(0, 15),
    };
  }

  public incrementMessageCount() {
    this.state.analytics.messages++;
  }

  public incrementPlanCount() {
    this.state.analytics.aiPlansGenerated++;
  }

  public syncFromClient(clientState: {
    tasks?: Task[];
    inventory?: InventoryItem[];
    shopping?: ShoppingItem[];
    bills?: Bill[];
    maintenance?: MaintenanceTask[];
    activities?: ActivityLog[];
    activityEvents?: ActivityEvent[];
  }): HomeState {
    if (Array.isArray(clientState.tasks) && clientState.tasks.length > 0) {
      this.state.tasks = clientState.tasks;
    }
    if (Array.isArray(clientState.inventory)) {
      this.state.inventory = clientState.inventory;
    }
    if (Array.isArray(clientState.shopping)) {
      this.state.shopping = clientState.shopping;
    }
    if (Array.isArray(clientState.bills) && clientState.bills.length > 0) {
      this.state.bills = clientState.bills;
    }
    if (Array.isArray(clientState.maintenance) && clientState.maintenance.length > 0) {
      this.state.maintenance = clientState.maintenance;
    }
    if (Array.isArray(clientState.activities) && clientState.activities.length > 0) {
      this.state.activities = clientState.activities;
    }
    if (Array.isArray(clientState.activityEvents) && clientState.activityEvents.length > 0) {
      this.state.activityEvents = clientState.activityEvents;
    }
    return this.getState();
  }
}

export const stateManager = new StateManager();
