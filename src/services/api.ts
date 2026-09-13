import { Task, InventoryItem, ShoppingItem, Bill, MaintenanceTask, HomeState, AnalyticsData } from '../../server/types';

export interface AgentChatResponse {
  response: string;
  toolsExecuted: {
    toolName: string;
    args: any;
    result: {
      success: boolean;
      message: string;
      data?: any;
      actionType?: string;
    };
  }[];
  priorities?: any[];
  briefing?: any;
  weeklyPlan?: any;
  whatNow?: any;
  updatedState?: HomeState;
}

export interface CaspianChannel {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'configured' | 'available' | 'standby';
  description: string;
  icon: string;
  lastActive?: string | null;
}

export interface TelegramWebhookInfo {
  url: string;
  has_custom_certificate?: boolean;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  ip_address?: string;
}

export interface TelegramLiveStatus {
  hasToken: boolean;
  valid: boolean;
  botUsername: string;
  botName: string;
  mode: 'caspian_hosted';
  status: 'connected' | 'configured' | 'unconfigured' | 'error';
  totalMessagesProcessed: number;
  lastActiveTimestamp?: string | null;
  lastError?: string;
}

export interface CaspianStatusResponse {
  initialized: boolean;
  agentName: string;
  channel: string;
  hasApiKey: boolean;
  apiKeyPrefix: string;
  baseUrl: string;
  botUsername?: string;
  totalMessagesProcessed: number;
  lastActive: string | null;
  channels?: CaspianChannel[];
  telegram?: TelegramLiveStatus;
}

export const api = {
  // Fetch full live server state
  getState: async (): Promise<HomeState> => {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Failed to fetch state');
    return res.json();
  },

  syncStateWithServer: async (clientState: Partial<HomeState>): Promise<{ message: string; state: HomeState }> => {
    const res = await fetch('/api/state/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientState),
    });
    if (!res.ok) throw new Error('Failed to sync state with server');
    return res.json();
  },

  resetState: async (): Promise<{ message: string; state: HomeState }> => {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset state');
    return res.json();
  },

  // Task operations
  createTask: async (data: {
    title: string;
    category?: Task['category'];
    priority?: Task['priority'];
    dueDate?: string;
    amount?: string;
    provider?: string;
  }): Promise<Task> => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  toggleTask: async (id: string, completed: boolean): Promise<Task> => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    return res.json();
  },

  deleteTask: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Inventory operations
  addInventoryItem: async (data: {
    name: string;
    quantity?: number;
    unit?: string;
    status?: InventoryItem['status'];
    category?: string;
    location?: string;
    subLocation?: string;
    estimatedRemaining?: string;
    lastRestocked?: string;
    avgUsage?: string;
    icon?: string;
    id?: string;
    badge?: string;
    date?: string;
  }): Promise<InventoryItem> => {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteInventoryItem: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const res = await fetch(`/api/inventory/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return res.json();
  },

  updateInventoryQuantity: async (id: string, quantity: number, status?: InventoryItem['status']): Promise<InventoryItem> => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, status }),
    });
    return res.json();
  },

  // Shopping operations
  addShoppingItem: async (name: string, quantity?: string, category?: string): Promise<ShoppingItem> => {
    const res = await fetch('/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, quantity, category }),
    });
    return res.json();
  },

  toggleShoppingItem: async (id: string, completed: boolean): Promise<ShoppingItem> => {
    const res = await fetch(`/api/shopping/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    return res.json();
  },

  deleteShoppingItem: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/shopping/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Bill operations
  addBill: async (name: string, amount: number, dueDate: string): Promise<Bill> => {
    const res = await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, amount, dueDate }),
    });
    return res.json();
  },

  payBill: async (id: string): Promise<Bill> => {
    const res = await fetch(`/api/bills/${id}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid: true }),
    });
    return res.json();
  },

  // Maintenance operations
  addMaintenance: async (title: string, category?: string, dueDate?: string, provider?: string): Promise<MaintenanceTask> => {
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, dueDate, provider }),
    });
    return res.json();
  },

  updateMaintenanceStatus: async (id: string, status: MaintenanceTask['status']): Promise<MaintenanceTask> => {
    const res = await fetch(`/api/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Agent chat & Intelligence
  sendAgentMessage: async (message: string, history: any[] = []): Promise<AgentChatResponse> => {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error('Agent failed to process message');
    return res.json();
  },

  getBriefing: async () => {
    const res = await fetch('/api/agent/briefing');
    return res.json();
  },

  getPriorities: async () => {
    const res = await fetch('/api/agent/prioritize');
    return res.json();
  },

  getWhatShouldIDoNow: async () => {
    const res = await fetch('/api/agent/what-now');
    return res.json();
  },

  getWeeklyPlan: async () => {
    const res = await fetch('/api/agent/weekly-plan');
    return res.json();
  },

  // Caspian status & simulation
  getCaspianStatus: async (): Promise<CaspianStatusResponse> => {
    const res = await fetch('/api/caspian/status');
    return res.json();
  },

  getCaspianChannels: async (): Promise<{ channels: CaspianChannel[] }> => {
    const res = await fetch('/api/caspian/channels');
    return res.json();
  },

  getAnythingLLMWorkspace: async () => {
    const res = await fetch('/api/anythingllm/workspace');
    return res.json();
  },

  simulateCaspianMessage: async (text: string, channel: string = 'Telegram') => {
    const res = await fetch('/api/caspian/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, channel }),
    });
    return res.json();
  },

  getAnalytics: async (): Promise<AnalyticsData> => {
    const res = await fetch('/api/analytics');
    return res.json();
  },

  // Telegram & Caspian Hosted Gateway controls
  getTelegramStatus: async (): Promise<TelegramLiveStatus> => {
    const res = await fetch('/api/telegram/status');
    return res.json();
  },

  connectCaspianTelegram: async (): Promise<{ ok: boolean; status: TelegramLiveStatus }> => {
    const res = await fetch('/api/caspian/connect-telegram', { method: 'POST' });
    return res.json();
  },
};
