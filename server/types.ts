export type TaskCategory = 'cleaning' | 'shopping' | 'bill' | 'maintenance' | 'general';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate?: string;
  amount?: string;
  provider?: string;
  completed: boolean;
  aiRecommended?: boolean;
  aiInsight?: string;
  createdAt: string;
}

export type InventoryStatus = 'good' | 'low' | 'critical';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number; // percentage 0-100 or count
  unit?: string;
  status: InventoryStatus;
  location?: string;
  subLocation?: string;
  estimatedRemaining?: string;
  lastRestocked?: string;
  avgUsage?: string;
  icon?: string;
  badge?: string;
  date?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category?: string;
  quantity?: string;
  completed: boolean;
  createdAt: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  isAutoPay?: boolean;
  dueCategory?: 'Due Tomorrow' | 'Due Soon' | 'Paid' | 'Upcoming';
  icon?: string;
}

export type MaintenanceStatus = 'pending' | 'overdue' | 'completed';

export interface MaintenanceTask {
  id: string;
  title: string;
  category: string;
  dueDate?: string;
  status: MaintenanceStatus;
  provider?: string;
  notes?: string;
}

export type ActivityType =
  | 'task'
  | 'inventory'
  | 'shopping'
  | 'bill'
  | 'maintenance'
  | 'ai'
  | 'automation'
  | 'telegram';

export type ActivitySource = 'user' | 'ai' | 'automation' | 'telegram' | 'system';

export interface ActivityChangeDiff {
  field?: string;
  before?: unknown;
  after?: unknown;
  unit?: string;
}

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  action: string;
  title: string;
  description?: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  time?: string;
  source: ActivitySource;
  entityType?: 'task' | 'inventory' | 'shopping' | 'bill' | 'maintenance' | 'system';
  entityId?: string;
  entityName?: string;
  before?: unknown;
  after?: unknown;
  diff?: ActivityChangeDiff;
  metadata?: Record<string, unknown>;
}

export interface ActivityLog {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  icon: string;
  timestamp: number;
}

export interface AnalyticsData {
  activeUsers: number;
  messages: number;
  activeDays: number;
  tasksCreated: number;
  tasksCompleted: number;
  shoppingItems: number;
  aiPlansGenerated: number;
}

export interface HomeState {
  tasks: Task[];
  inventory: InventoryItem[];
  shopping: ShoppingItem[];
  bills: Bill[];
  maintenance: MaintenanceTask[];
  activities: ActivityLog[];
  activityEvents: ActivityEvent[];
  analytics: AnalyticsData;
}
