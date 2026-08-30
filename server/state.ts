import {
  HomeState,
  Task,
  InventoryItem,
  ShoppingItem,
  Bill,
  MaintenanceTask,
  ActivityLog,
  AnalyticsData,
} from './types';

// In-Memory Ephemeral State (Hackathon MVP: session-based, no external database required)
class StateManager {
  private state: HomeState;

  constructor() {
    this.state = this.getInitialSeedState();
  }

  private getInitialSeedState(): HomeState {
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
    provider?: string
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
    this.recordActivity('New Task Created', title, 'assignment');
    return newTask;
  }

  public updateTask(id: string, updates: Partial<Task>): Task | null {
    const task = this.state.tasks.find((t) => t.id === id || t.title.toLowerCase().includes(id.toLowerCase()));
    if (!task) return null;
    Object.assign(task, updates);
    return task;
  }

  public completeTask(idOrTitle: string, completed: boolean = true): Task | null {
    const task = this.state.tasks.find(
      (t) => t.id === idOrTitle || t.title.toLowerCase().includes(idOrTitle.toLowerCase())
    );
    if (!task) return null;
    task.completed = completed;
    if (completed) {
      this.state.analytics.tasksCompleted++;
      this.recordActivity('Task Completed', `✓ ${task.title}`, 'check_circle');
    }
    return task;
  }

  public deleteTask(idOrTitle: string): boolean {
    const initialLength = this.state.tasks.length;
    this.state.tasks = this.state.tasks.filter(
      (t) => t.id !== idOrTitle && !t.title.toLowerCase().includes(idOrTitle.toLowerCase())
    );
    return this.state.tasks.length < initialLength;
  }

  // --- Inventory Methods ---
  public addInventoryItem(
    name: string,
    quantity: number = 100,
    unit: string = 'unit',
    status: InventoryItem['status'] = 'good',
    category: string = 'General'
  ): InventoryItem {
    const existing = this.state.inventory.find(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      existing.quantity = quantity;
      existing.status = status;
      return existing;
    }

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name,
      category,
      quantity,
      unit,
      status,
      icon: 'inventory_2',
      lastRestocked: 'Just now',
    };
    this.state.inventory.push(newItem);
    this.recordActivity('Inventory Added', `${name} (${quantity}%)`, 'inventory');
    return newItem;
  }

  public updateInventory(
    nameOrId: string,
    quantity?: number,
    status?: InventoryItem['status']
  ): InventoryItem | null {
    const item = this.state.inventory.find(
      (i) => i.id === nameOrId || i.name.toLowerCase().includes(nameOrId.toLowerCase())
    );
    if (!item) return null;

    if (quantity !== undefined) {
      item.quantity = Math.max(0, Math.min(100, quantity));
      if (!status) {
        if (item.quantity <= 20) item.status = 'critical';
        else if (item.quantity <= 35) item.status = 'low';
        else item.status = 'good';
      }
    }
    if (status) item.status = status;

    if (item.status === 'low' || item.status === 'critical') {
      this.addShoppingItem(item.name, '1 unit', item.category);
    }

    this.recordActivity('Inventory Level Updated', `${item.name}: ${item.quantity}% (${item.status})`, 'shelves');
    return item;
  }

  // --- Shopping Methods ---
  public addShoppingItem(name: string, quantity: string = '1 item', category?: string): ShoppingItem {
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
    this.recordActivity('Shopping Item Added', name, 'shopping_bag');
    return newItem;
  }

  public completeShoppingItem(idOrName: string, completed: boolean = true): ShoppingItem | null {
    const item = this.state.shopping.find(
      (s) => s.id === idOrName || s.name.toLowerCase().includes(idOrName.toLowerCase())
    );
    if (!item) return null;
    item.completed = completed;
    if (completed) {
      this.recordActivity('Shopping Item Checked', item.name, 'done_all');
    }
    return item;
  }

  public removeShoppingItem(idOrName: string): boolean {
    const initialLength = this.state.shopping.length;
    this.state.shopping = this.state.shopping.filter(
      (s) => s.id !== idOrName && !s.name.toLowerCase().includes(idOrName.toLowerCase())
    );
    return this.state.shopping.length < initialLength;
  }

  // --- Bill Methods ---
  public addBill(name: string, amount: number = 0, dueDate: string = 'Upcoming'): Bill {
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
    this.recordActivity('New Bill Added', `${name} ($${amount})`, 'receipt');
    return newBill;
  }

  public markBillPaid(idOrName: string, paid: boolean = true): Bill | null {
    const bill = this.state.bills.find(
      (b) => b.id === idOrName || b.name.toLowerCase().includes(idOrName.toLowerCase())
    );
    if (!bill) return null;
    bill.paid = paid;
    bill.dueCategory = paid ? 'Paid' : 'Due Soon';
    if (paid) {
      this.recordActivity('Bill Paid & Archived', `${bill.name} ($${bill.amount})`, 'paid');
    }
    return bill;
  }

  // --- Maintenance Methods ---
  public addMaintenanceTask(
    title: string,
    category: string = 'General',
    dueDate: string = 'Due in 7 days',
    provider?: string
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
    this.recordActivity('Maintenance Scheduled', title, 'build');
    return newTask;
  }

  public completeMaintenanceTask(idOrTitle: string, status: MaintenanceTask['status'] = 'completed'): MaintenanceTask | null {
    const item = this.state.maintenance.find(
      (m) => m.id === idOrTitle || m.title.toLowerCase().includes(idOrTitle.toLowerCase())
    );
    if (!item) return null;
    item.status = status;
    this.recordActivity('Maintenance Updated', `${item.title} (${status})`, 'construction');
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

  public incrementMessageCount() {
    this.state.analytics.messages++;
  }

  public incrementPlanCount() {
    this.state.analytics.aiPlansGenerated++;
  }
}

export const stateManager = new StateManager();
