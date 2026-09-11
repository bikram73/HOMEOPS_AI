/**
 * HomeOps AI — Demo vs User Data Manager
 * Controls the transition from initial demo data to clean personal user data:
 * "initially show the demo thing, but when a user enters details,
 * don't show any already added demo things."
 */
import { TaskItem, InventoryItem, ShoppingItem, BillItem, ActivityEvent, UserProfile } from '../types';
import { localStore, cookieStore } from './storage';
import { hasCompletedOnboarding } from './profileStore';

export const USER_DETAILS_ENTERED_KEY = 'homeops_user_details_entered';

const DEMO_TASK_IDS = new Set(['task-1', 'task-2', 'task-3', 'task-4', 'task-5']);
const DEMO_INVENTORY_IDS = new Set(['inv-1', 'inv-2', 'inv-3', 'inv-4', 'inv-5', 'inv-6']);
const DEMO_SHOPPING_IDS = new Set(['shop-1', 'shop-2', 'shop-3']);
const DEMO_BILL_IDS = new Set(['bill-1', 'bill-2', 'bill-3']);
const DEMO_ACTIVITY_IDS = new Set([
  'act-1',
  'act-2',
  'act-3',
  'act-4',
  'ACT-1725981234567',
  'ACT-1725894834567',
  'ACT-1725808434567',
  'ACT-1725722034567',
]);

/**
 * Returns true if the user has entered their own details
 * (e.g. completed onboarding, saved their profile, or entered custom household details).
 */
export function hasEnteredUserDetails(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasCompletedOnboarding()) return true;
  const flag = localStore.get<boolean>(USER_DETAILS_ENTERED_KEY);
  if (flag === true) return true;
  const cookieFlag = cookieStore.get(USER_DETAILS_ENTERED_KEY);
  if (cookieFlag === 'true') return true;
  return false;
}

export function setEnteredUserDetails(entered: boolean): void {
  localStore.set(USER_DETAILS_ENTERED_KEY, entered);
  cookieStore.set(USER_DETAILS_ENTERED_KEY, entered ? 'true' : 'false');
}

export function isDemoTask(t: TaskItem): boolean {
  return DEMO_TASK_IDS.has(t.id);
}

export function isDemoInventory(i: InventoryItem): boolean {
  return DEMO_INVENTORY_IDS.has(i.id);
}

export function isDemoShopping(s: ShoppingItem): boolean {
  return DEMO_SHOPPING_IDS.has(s.id);
}

export function isDemoBill(b: BillItem): boolean {
  return DEMO_BILL_IDS.has(b.id);
}

export function isDemoActivity(a: ActivityEvent): boolean {
  return DEMO_ACTIVITY_IDS.has(a.id);
}

/**
 * Strips all pre-seeded demo items from an array of tasks.
 */
export function removeDemoTasks(tasks: TaskItem[]): TaskItem[] {
  return tasks.filter((t) => !isDemoTask(t));
}

export function removeDemoInventory(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter((i) => !isDemoInventory(i));
}

export function removeDemoShopping(shopping: ShoppingItem[]): ShoppingItem[] {
  return shopping.filter((s) => !isDemoShopping(s));
}

export function removeDemoBills(bills: BillItem[]): BillItem[] {
  return bills.filter((b) => !isDemoBill(b));
}

export function removeDemoActivities(activities: ActivityEvent[]): ActivityEvent[] {
  return activities.filter((a) => !isDemoActivity(a));
}
