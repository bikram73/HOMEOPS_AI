/**
 * HomeOps AI — State Persistence Layer
 * Saves and restores household tasks, inventory, shopping items, bills, maintenance,
 * and activity history to IndexedDB.
 */
import { TaskItem, InventoryItem, ShoppingItem, BillItem, ActivityItem, ActivityEvent } from '../types';
import { idbGet, idbSet, idbDelete, STORES } from './storage';
import {
  removeDemoTasks,
  removeDemoInventory,
  removeDemoShopping,
  removeDemoBills,
  removeDemoMaintenance,
  removeDemoActivities,
} from './demoDataHelper';

export interface PersistedHouseholdState {
  tasks: TaskItem[];
  inventory: InventoryItem[];
  shopping: ShoppingItem[];
  bills: BillItem[];
  maintenance?: any[];
  activities: ActivityItem[];
  activityEvents?: ActivityEvent[];
  lastSavedAt: string;
}

const STATE_RECORD_KEY = 'current_household_state';

export async function saveHouseholdState(state: {
  tasks: TaskItem[];
  inventory: InventoryItem[];
  shopping: ShoppingItem[];
  bills: BillItem[];
  maintenance?: any[];
  activities: ActivityItem[];
  activityEvents?: ActivityEvent[];
}): Promise<boolean> {
  try {
    const payload: PersistedHouseholdState = {
      tasks: state.tasks || [],
      inventory: state.inventory || [],
      shopping: state.shopping || [],
      bills: state.bills || [],
      maintenance: state.maintenance || [],
      activities: state.activities || [],
      activityEvents: state.activityEvents || [],
      lastSavedAt: new Date().toISOString(),
    };

    return await idbSet(STORES.HOUSEHOLD_STATE, STATE_RECORD_KEY, payload);
  } catch (err) {
    console.warn('[HomeOps StatePersistence] Failed to save state:', err);
    return false;
  }
}

export async function loadHouseholdState(): Promise<PersistedHouseholdState | null> {
  try {
    const data = await idbGet<PersistedHouseholdState>(STORES.HOUSEHOLD_STATE, STATE_RECORD_KEY);
    if (!data) return null;
    return {
      ...data,
      tasks: removeDemoTasks(data.tasks || []),
      inventory: removeDemoInventory(data.inventory || []),
      shopping: removeDemoShopping(data.shopping || []),
      bills: removeDemoBills(data.bills || []),
      maintenance: removeDemoMaintenance(data.maintenance || []),
      activities: (data.activities || []).filter((a: any) => !a.id?.startsWith('act-')),
      activityEvents: removeDemoActivities(data.activityEvents || []),
    };
  } catch (err) {
    console.warn('[HomeOps StatePersistence] Failed to load state:', err);
    return null;
  }
}

export async function clearHouseholdState(): Promise<void> {
  try {
    await idbDelete(STORES.HOUSEHOLD_STATE, STATE_RECORD_KEY);
  } catch (err) {
    console.warn('[HomeOps StatePersistence] Failed to clear state:', err);
  }
}
