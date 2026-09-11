export type PageTab =
  | 'landing'
  | 'home'
  | 'tasks'
  | 'inventory'
  | 'shopping'
  | 'bills'
  | 'maintenance'
  | 'calendar'
  | 'assistant'
  | 'settings'
  | 'help';

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
  id: string; // e.g. "ACT-1725981234567"
  type: ActivityType;
  action: string;
  title: string;
  description?: string;
  timestamp: string; // ISO 8601 string
  date: string; // YYYY-MM-DD
  time?: string; // Formatted 12-hr time string (e.g. "10:20 AM")
  source: ActivitySource;
  entityType?: 'task' | 'inventory' | 'shopping' | 'bill' | 'maintenance' | 'system';
  entityId?: string;
  entityName?: string;
  before?: unknown;
  after?: unknown;
  diff?: ActivityChangeDiff;
  metadata?: Record<string, unknown>;
}

export interface CalendarUpcomingEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  subtitle: string;
  type: 'bill' | 'maintenance' | 'task';
  amount?: string | number;
  priority?: string;
  status?: string;
  sourceEntityId: string;
}

export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface TaskItem {
  id: string;
  title: string;
  subtitle: string;
  priority: TaskPriority;
  category: string;
  dueDate: string;
  amount?: string;
  provider?: string;
  completed: boolean;
  aiRecommended?: boolean;
  aiInsight?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  location: string;
  subLocation?: string;
  availability: number; // percentage 0-100
  badge?: 'Staple' | 'Low' | 'Normal';
  icon: string;
  unit?: string;
  currentLevelDetail?: string;
  estimatedRemaining?: string;
  lastRestocked?: string;
  avgUsage?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  checked: boolean;
}

export interface BillItem {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
  dueCategory: 'Due Tomorrow' | 'Due Soon' | 'Paid' | 'Upcoming';
  isAutoPay?: boolean;
  icon: string;
  paidThisMonth?: boolean;
}

export interface MaintenanceItem {
  id: string;
  title: string;
  system: string;
  interval: string;
  lastDone: string;
  nextDue: string;
  status: 'Due Soon' | 'Optimal' | 'Overdue';
  icon: string;
}

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  status: 'active' | 'upcoming';
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  icon: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  role: string;
}

export interface UserProfile {
  id: string;
  name: string;
  householdName: string;
  city?: string;
  currency: string;
  notificationPref: 'dashboard' | 'telegram' | 'both';
  members?: HouseholdMember[];
  createdAt: string;
  updatedAt: string;
}

export interface HomeOpsPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  autoReplenish: boolean;
  onboardingCompleted: boolean;
  notificationPref?: 'dashboard' | 'telegram' | 'both';
}

export interface StoredHouseholdData {
  version: string;
  exportedAt: string;
  profile: UserProfile;
  preferences?: HomeOpsPreferences;
  tasks: TaskItem[];
  inventory: InventoryItem[];
  shopping: ShoppingItem[];
  bills: BillItem[];
  maintenance?: any[];
  activities: ActivityItem[];
  activityEvents?: ActivityEvent[];
  conversations?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  priorities?: {
    id: string;
    type: 'High Priority' | 'Errand' | 'Maintenance';
    title: string;
    desc: string;
    icon: string;
    colorType: 'error' | 'secondary' | 'navy';
  }[];
}
