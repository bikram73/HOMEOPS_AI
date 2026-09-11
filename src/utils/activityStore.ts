/**
 * HomeOps AI — Activity Calendar & Change History Storage Layer
 * Persists household activity events, audit records, and before/after changes to IndexedDB.
 */
import { ActivityEvent, ActivityType, ActivitySource } from '../types';
import { idbGet, idbSet, idbDelete, STORES } from './storage';

const ACTIVITIES_RECORD_KEY = 'homeops_activity_events';

// Helper to format date in YYYY-MM-DD
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to format time in 12-hour AM/PM format
export function formatLocalTime(d: Date = new Date()): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Helper to calculate days offset from a reference date
function getRelativeDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return getLocalDateString(d);
}

// Realistic initial seed activities matching user specification
export function getInitialSeedActivities(): ActivityEvent[] {
  const todayStr = getLocalDateString(new Date());
  const yesterdayStr = getRelativeDateString(-1);
  const twoDaysAgoStr = getRelativeDateString(-2);
  const threeDaysAgoStr = getRelativeDateString(-3);

  return [
    {
      id: 'ACT-1725981234567',
      type: 'ai',
      action: 'ai_task_created',
      title: 'Task created by HomeOps AI',
      description: 'Clean water filter reverse-osmosis pre-membrane',
      timestamp: `${todayStr}T16:10:00.000Z`,
      date: todayStr,
      time: '04:10 PM',
      source: 'ai',
      entityType: 'task',
      entityId: 'task-5',
      entityName: 'Clean water filter',
      after: { title: 'Clean water filter', priority: 'Medium' },
    },
    {
      id: 'ACT-1725981234566',
      type: 'bill',
      action: 'bill_paid',
      title: 'Electricity bill marked as paid',
      description: 'City Power & Light settled via Telegram',
      timestamp: `${todayStr}T14:30:00.000Z`,
      date: todayStr,
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
      timestamp: `${todayStr}T11:05:00.000Z`,
      date: todayStr,
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
      timestamp: `${todayStr}T10:20:00.000Z`,
      date: todayStr,
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
      timestamp: `${todayStr}T09:15:00.000Z`,
      date: todayStr,
      time: '09:15 AM',
      source: 'user',
      entityType: 'task',
      entityId: 'task-4',
      entityName: 'Clean kitchen',
      before: { completed: false },
      after: { completed: true },
    },
    // Yesterday
    {
      id: 'ACT-1725981234562',
      type: 'shopping',
      action: 'shopping_item_added',
      title: 'Shopping Item Added',
      description: 'Whole Milk — 2 packets',
      timestamp: `${yesterdayStr}T16:30:00.000Z`,
      date: yesterdayStr,
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
      timestamp: `${yesterdayStr}T11:00:00.000Z`,
      date: yesterdayStr,
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
      timestamp: `${yesterdayStr}T08:45:00.000Z`,
      date: yesterdayStr,
      time: '08:45 AM',
      source: 'automation',
      entityType: 'inventory',
      entityName: 'Laundry Detergent',
      before: '45%',
      after: '18%',
      diff: { field: 'capacity', before: '45%', after: '18%', unit: '%' },
    },
    // Two days ago
    {
      id: 'ACT-1725981234559',
      type: 'telegram',
      action: 'telegram_task_created',
      title: 'Task created via Telegram',
      description: '"Buy fresh vegetables on way back"',
      timestamp: `${twoDaysAgoStr}T18:20:00.000Z`,
      date: twoDaysAgoStr,
      time: '06:20 PM',
      source: 'telegram',
      entityType: 'task',
      entityName: 'Buy vegetables',
      after: { title: 'Buy fresh vegetables', priority: 'High' },
    },
    {
      id: 'ACT-1725981234558',
      type: 'bill',
      action: 'bill_created',
      title: 'New bill registered: Internet Fiber',
      description: 'Monthly broadband invoice ₹1,499 registered with due date in 5 days',
      timestamp: `${twoDaysAgoStr}T10:00:00.000Z`,
      date: twoDaysAgoStr,
      time: '10:00 AM',
      source: 'system',
      entityType: 'bill',
      entityName: 'Internet Fiber',
      after: { amount: '₹1,499', dueDate: 'Due in 5 days' },
    },
    // Three days ago
    {
      id: 'ACT-1725981234557',
      type: 'ai',
      action: 'ai_inventory_optimized',
      title: 'AI weekly replenishment plan created',
      description: 'Analyzed weekly depletion velocity across 14 household pantry staples',
      timestamp: `${threeDaysAgoStr}T14:15:00.000Z`,
      date: threeDaysAgoStr,
      time: '02:15 PM',
      source: 'ai',
      entityType: 'system',
      entityName: 'Pantry Optimization Plan',
    },
  ];
}

// In-memory cache for fast responsive rendering
let cachedActivities: ActivityEvent[] | null = null;

import { hasEnteredUserDetails, removeDemoActivities } from './demoDataHelper';

/**
 * Load all activities from IndexedDB (or fallback to seed if user has not entered details)
 */
export async function getAllActivities(): Promise<ActivityEvent[]> {
  const userEnteredDetails = hasEnteredUserDetails();

  if (cachedActivities !== null) {
    if (userEnteredDetails) {
      const sanitized = removeDemoActivities(cachedActivities);
      cachedActivities = sanitized;
      return sanitized;
    }
    if (cachedActivities.length > 0) {
      return cachedActivities;
    }
  }

  try {
    const stored = await idbGet<ActivityEvent[]>(STORES.ACTIVITIES, ACTIVITIES_RECORD_KEY);
    if (stored && Array.isArray(stored)) {
      const sanitized = userEnteredDetails ? removeDemoActivities(stored) : stored;
      cachedActivities = sanitized;
      return sanitized;
    }
  } catch (err) {
    console.warn('[ActivityStore] Failed to fetch from IndexedDB:', err);
  }

  // If user entered details, start clean — do not show seed demo activities!
  if (userEnteredDetails) {
    cachedActivities = [];
    return [];
  }

  // First time initialization: use realistic seed history (only shown in initial demo mode)
  const initial = getInitialSeedActivities();
  cachedActivities = initial;
  // Save asynchronously to IndexedDB
  idbSet(STORES.ACTIVITIES, ACTIVITIES_RECORD_KEY, initial).catch((e) =>
    console.warn('[ActivityStore] Seed save error:', e)
  );

  return initial;
}

/**
 * Purges all demo seed activities from memory and database
 */
export async function purgeSeedActivities(): Promise<void> {
  const current = (await getAllActivities()) || [];
  const clean = removeDemoActivities(current);
  cachedActivities = clean;
  try {
    await idbSet(STORES.ACTIVITIES, ACTIVITIES_RECORD_KEY, clean);
  } catch (e) {
    console.warn('[ActivityStore] Purge save error:', e);
  }
}

/**
 * Record a new activity event with audit details and before/after values
 */
export async function recordActivityEvent(
  params: {
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
  }
): Promise<ActivityEvent> {
  const now = new Date();
  const timestamp = params.timestamp || now.toISOString();
  const date = params.date || getLocalDateString(now);
  const time = params.time || formatLocalTime(now);
  const id = `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newEvent: ActivityEvent = {
    id,
    type: params.type,
    action: params.action,
    title: params.title,
    description: params.description,
    timestamp,
    date,
    time,
    source: params.source || 'user',
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    before: params.before,
    after: params.after,
    diff: params.diff,
    metadata: params.metadata,
  };

  const current = await getAllActivities();
  const updated = [newEvent, ...current.filter((e) => e.id !== newEvent.id)];

  // Keep up to 10,000 activity records safely
  if (updated.length > 10000) {
    updated.length = 10000;
  }

  cachedActivities = updated;

  try {
    await idbSet(STORES.ACTIVITIES, ACTIVITIES_RECORD_KEY, updated);
  } catch (err) {
    console.warn('[ActivityStore] Failed to write to IndexedDB:', err);
  }

  // Silent sync to server so Gemini / Caspian have fresh activity memory
  try {
    fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: newEvent }),
    }).catch(() => {});
  } catch {
    // Non-blocking
  }

  return newEvent;
}

/**
 * Filter activities for a specific YYYY-MM-DD date
 */
export async function getActivitiesByDate(dateStr: string): Promise<ActivityEvent[]> {
  const all = await getAllActivities();
  return all.filter((a) => a.date === dateStr);
}

/**
 * Filter activities in an inclusive date range
 */
export async function getActivitiesByDateRange(
  startDate: string,
  endDate: string
): Promise<ActivityEvent[]> {
  const all = await getAllActivities();
  return all.filter((a) => a.date >= startDate && a.date <= endDate);
}

/**
 * Search activities by query across title, description, entity name, and changes
 */
export async function searchActivities(query: string): Promise<ActivityEvent[]> {
  if (!query || !query.trim()) return getAllActivities();
  const q = query.toLowerCase().trim();
  const all = await getAllActivities();

  return all.filter((a) => {
    if (a.title.toLowerCase().includes(q)) return true;
    if (a.description && a.description.toLowerCase().includes(q)) return true;
    if (a.entityName && a.entityName.toLowerCase().includes(q)) return true;
    if (a.action.toLowerCase().includes(q)) return true;
    if (a.type.toLowerCase().includes(q)) return true;
    if (a.source.toLowerCase().includes(q)) return true;
    if (typeof a.before === 'string' && a.before.toLowerCase().includes(q)) return true;
    if (typeof a.after === 'string' && a.after.toLowerCase().includes(q)) return true;
    return false;
  });
}

/**
 * Find the most recent activity for a specific entity name or ID
 */
export async function getLastActivityForEntity(
  entityNameOrId: string
): Promise<ActivityEvent | null> {
  const all = await getAllActivities();
  const target = entityNameOrId.toLowerCase().trim();

  const match = all.find((a) => {
    if (a.entityId && a.entityId.toLowerCase() === target) return true;
    if (a.entityName && a.entityName.toLowerCase().includes(target)) return true;
    if (a.title.toLowerCase().includes(target)) return true;
    return false;
  });

  return match || null;
}

/**
 * Save all activities (used for restore/import)
 */
export async function saveAllActivities(activities: ActivityEvent[]): Promise<boolean> {
  cachedActivities = activities;
  try {
    return await idbSet(STORES.ACTIVITIES, ACTIVITIES_RECORD_KEY, activities);
  } catch {
    return false;
  }
}

/**
 * Clear all activities
 */
export async function clearAllActivities(): Promise<boolean> {
  cachedActivities = [];
  try {
    await idbDelete(STORES.ACTIVITIES, ACTIVITIES_RECORD_KEY);
    return true;
  } catch {
    return false;
  }
}
