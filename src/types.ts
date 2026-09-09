export type PageTab =
  | 'landing'
  | 'home'
  | 'tasks'
  | 'inventory'
  | 'shopping'
  | 'bills'
  | 'maintenance'
  | 'assistant'
  | 'settings'
  | 'help';

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
