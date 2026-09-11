/**
 * HomeOps AI — Household Multi-Layer Storage Engine
 * Persists Inventory, Shopping, Bills, and Maintenance across:
 * 1. LocalStorage (instant synchronous read/write)
 * 2. Browser Cookies (persisted session fallback)
 * 3. In-memory / Browser Cache (lightning fast runtime access)
 * 4. IndexedDB (durable structured database backup)
 *
 * Automatically manages demo vs. personal user data:
 * When a user enters/adds/updates any item, pre-seeded demo entries
 * are cleanly purged and only user-created items persist.
 */

import { InventoryItem, ShoppingItem, BillItem, MaintenanceItem } from '../types';
import {
  INITIAL_INVENTORY,
  INITIAL_SHOPPING,
  INITIAL_BILLS,
  INITIAL_MAINTENANCE,
} from '../data/mockData';
import {
  hasEnteredUserDetails,
  setEnteredUserDetails,
  removeDemoInventory,
  removeDemoShopping,
  removeDemoBills,
  removeDemoMaintenance,
} from './demoDataHelper';
import {
  localStore,
  cookieStore,
  appCache,
  STORAGE_KEYS,
  idbGet,
  idbSet,
  STORES,
} from './storage';

// Cookie & Cache Keys
const INVENTORY_COOKIE_KEY = 'homeops_inv_data';
const SHOPPING_COOKIE_KEY = 'homeops_shop_data';
const BILLS_COOKIE_KEY = 'homeops_bills_data';
const MAINTENANCE_COOKIE_KEY = 'homeops_maint_data';

const CACHE_INV_KEY = 'inventory';
const CACHE_SHOP_KEY = 'shopping';
const CACHE_BILLS_KEY = 'bills';
const CACHE_MAINT_KEY = 'maintenance';

// ==========================================
// 1. INVENTORY STORE
// ==========================================

export function getStoredInventory(): InventoryItem[] {
  try {
    // 1. LocalStorage
    const local = localStore.get<InventoryItem[]>(STORAGE_KEYS.INVENTORY);
    if (Array.isArray(local)) {
      const sanitized = removeDemoInventory(local);
      appCache.set(CACHE_INV_KEY, sanitized);
      return sanitized;
    }

    // 2. Cookie Fallback
    const cookieData = cookieStore.get(INVENTORY_COOKIE_KEY);
    if (cookieData) {
      try {
        const parsed = JSON.parse(cookieData);
        if (Array.isArray(parsed)) {
          const sanitized = removeDemoInventory(parsed);
          localStore.set(STORAGE_KEYS.INVENTORY, sanitized);
          appCache.set(CACHE_INV_KEY, sanitized);
          return sanitized;
        }
      } catch {}
    }

    // 3. Cache
    const cached = appCache.get<InventoryItem[]>(CACHE_INV_KEY);
    if (Array.isArray(cached)) {
      const sanitized = removeDemoInventory(cached);
      localStore.set(STORAGE_KEYS.INVENTORY, sanitized);
      return sanitized;
    }
  } catch (err) {
    console.warn('[InventoryStore] Error reading storage:', err);
  }

  // Initial for new user starts completely at 0 items!
  return [];
}

export function saveStoredInventory(items: InventoryItem[]): boolean {
  if (!Array.isArray(items)) return false;

  try {
    // 1. LocalStorage
    localStore.set(STORAGE_KEYS.INVENTORY, items);

    // 2. Cache
    appCache.set(CACHE_INV_KEY, items);

    // 3. Cookies (compact representation)
    try {
      const compact = items.slice(0, 15).map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        availability: i.availability,
        badge: i.badge,
        location: i.location,
      }));
      const serialized = JSON.stringify(compact);
      if (serialized.length < 3500) {
        cookieStore.set(INVENTORY_COOKIE_KEY, serialized);
      }
    } catch {}

    // 4. IndexedDB
    idbSet(STORES.HOUSEHOLD_STATE, 'inventory', items).catch(() => {});

    // 5. Broadcast window event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('homeops_inventory_updated', {
          detail: { inventory: items, count: items.length },
        })
      );
    }

    return true;
  } catch (err) {
    console.warn('[InventoryStore] Error saving inventory:', err);
    return false;
  }
}

export async function clearStoredInventory(): Promise<void> {
  localStore.remove(STORAGE_KEYS.INVENTORY);
  cookieStore.remove(INVENTORY_COOKIE_KEY);
  appCache.remove(CACHE_INV_KEY);
  await idbSet(STORES.HOUSEHOLD_STATE, 'inventory', []);
}

// ==========================================
// 2. SHOPPING STORE
// ==========================================

export function getStoredShopping(): ShoppingItem[] {
  try {
    // 1. LocalStorage
    const local = localStore.get<ShoppingItem[]>(STORAGE_KEYS.SHOPPING);
    if (Array.isArray(local)) {
      const sanitized = removeDemoShopping(local);
      appCache.set(CACHE_SHOP_KEY, sanitized);
      return sanitized;
    }

    // 2. Cookie Fallback
    const cookieData = cookieStore.get(SHOPPING_COOKIE_KEY);
    if (cookieData) {
      try {
        const parsed = JSON.parse(cookieData);
        if (Array.isArray(parsed)) {
          const sanitized = removeDemoShopping(parsed);
          localStore.set(STORAGE_KEYS.SHOPPING, sanitized);
          appCache.set(CACHE_SHOP_KEY, sanitized);
          return sanitized;
        }
      } catch {}
    }

    // 3. Cache
    const cached = appCache.get<ShoppingItem[]>(CACHE_SHOP_KEY);
    if (Array.isArray(cached)) {
      const sanitized = removeDemoShopping(cached);
      localStore.set(STORAGE_KEYS.SHOPPING, sanitized);
      return sanitized;
    }
  } catch (err) {
    console.warn('[ShoppingStore] Error reading storage:', err);
  }

  // Initial for new user starts completely at 0 items!
  return [];
}

export function saveStoredShopping(items: ShoppingItem[]): boolean {
  if (!Array.isArray(items)) return false;

  try {
    // 1. LocalStorage
    localStore.set(STORAGE_KEYS.SHOPPING, items);

    // 2. Cache
    appCache.set(CACHE_SHOP_KEY, items);

    // 3. Cookies
    try {
      const compact = items.slice(0, 20).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        quantity: s.quantity,
        checked: s.checked,
      }));
      const serialized = JSON.stringify(compact);
      if (serialized.length < 3500) {
        cookieStore.set(SHOPPING_COOKIE_KEY, serialized);
      }
    } catch {}

    // 4. IndexedDB
    idbSet(STORES.HOUSEHOLD_STATE, 'shopping', items).catch(() => {});

    // 5. Broadcast window event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('homeops_shopping_updated', {
          detail: { shopping: items, count: items.length },
        })
      );
    }

    return true;
  } catch (err) {
    console.warn('[ShoppingStore] Error saving shopping items:', err);
    return false;
  }
}

export async function clearStoredShopping(): Promise<void> {
  localStore.remove(STORAGE_KEYS.SHOPPING);
  cookieStore.remove(SHOPPING_COOKIE_KEY);
  appCache.remove(CACHE_SHOP_KEY);
  await idbSet(STORES.HOUSEHOLD_STATE, 'shopping', []);
}

// ==========================================
// 3. BILLS STORE
// ==========================================

export function getStoredBills(): BillItem[] {
  try {
    // 1. LocalStorage
    const local = localStore.get<BillItem[]>(STORAGE_KEYS.BILLS);
    if (Array.isArray(local)) {
      const sanitized = removeDemoBills(local);
      appCache.set(CACHE_BILLS_KEY, sanitized);
      return sanitized;
    }

    // 2. Cookie Fallback
    const cookieData = cookieStore.get(BILLS_COOKIE_KEY);
    if (cookieData) {
      try {
        const parsed = JSON.parse(cookieData);
        if (Array.isArray(parsed)) {
          const sanitized = removeDemoBills(parsed);
          localStore.set(STORAGE_KEYS.BILLS, sanitized);
          appCache.set(CACHE_BILLS_KEY, sanitized);
          return sanitized;
        }
      } catch {}
    }

    // 3. Cache
    const cached = appCache.get<BillItem[]>(CACHE_BILLS_KEY);
    if (Array.isArray(cached)) {
      const sanitized = removeDemoBills(cached);
      localStore.set(STORAGE_KEYS.BILLS, sanitized);
      return sanitized;
    }
  } catch (err) {
    console.warn('[BillsStore] Error reading storage:', err);
  }

  // Initial for new user starts completely at 0 items!
  return [];
}

export function saveStoredBills(items: BillItem[]): boolean {
  if (!Array.isArray(items)) return false;

  try {
    // 1. LocalStorage
    localStore.set(STORAGE_KEYS.BILLS, items);

    // 2. Cache
    appCache.set(CACHE_BILLS_KEY, items);

    // 3. Cookies
    try {
      const compact = items.slice(0, 15).map((b) => ({
        id: b.id,
        name: b.name,
        amount: b.amount,
        dueDate: b.dueDate,
        dueCategory: b.dueCategory,
        paidThisMonth: b.paidThisMonth,
      }));
      const serialized = JSON.stringify(compact);
      if (serialized.length < 3500) {
        cookieStore.set(BILLS_COOKIE_KEY, serialized);
      }
    } catch {}

    // 4. IndexedDB
    idbSet(STORES.HOUSEHOLD_STATE, 'bills', items).catch(() => {});

    // 5. Broadcast window event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('homeops_bills_updated', {
          detail: { bills: items, count: items.length },
        })
      );
    }

    return true;
  } catch (err) {
    console.warn('[BillsStore] Error saving bills:', err);
    return false;
  }
}

export async function clearStoredBills(): Promise<void> {
  localStore.remove(STORAGE_KEYS.BILLS);
  cookieStore.remove(BILLS_COOKIE_KEY);
  appCache.remove(CACHE_BILLS_KEY);
  await idbSet(STORES.HOUSEHOLD_STATE, 'bills', []);
}

// ==========================================
// 4. MAINTENANCE STORE
// ==========================================

export function getStoredMaintenance(): MaintenanceItem[] {
  try {
    // 1. LocalStorage
    const local = localStore.get<MaintenanceItem[]>(STORAGE_KEYS.MAINTENANCE);
    if (Array.isArray(local)) {
      const sanitized = removeDemoMaintenance(local);
      appCache.set(CACHE_MAINT_KEY, sanitized);
      return sanitized;
    }

    // 2. Cookie Fallback
    const cookieData = cookieStore.get(MAINTENANCE_COOKIE_KEY);
    if (cookieData) {
      try {
        const parsed = JSON.parse(cookieData);
        if (Array.isArray(parsed)) {
          const sanitized = removeDemoMaintenance(parsed);
          localStore.set(STORAGE_KEYS.MAINTENANCE, sanitized);
          appCache.set(CACHE_MAINT_KEY, sanitized);
          return sanitized;
        }
      } catch {}
    }

    // 3. Cache
    const cached = appCache.get<MaintenanceItem[]>(CACHE_MAINT_KEY);
    if (Array.isArray(cached)) {
      const sanitized = removeDemoMaintenance(cached);
      localStore.set(STORAGE_KEYS.MAINTENANCE, sanitized);
      return sanitized;
    }
  } catch (err) {
    console.warn('[MaintenanceStore] Error reading storage:', err);
  }

  // Initial for new user starts completely at 0 items!
  return [];
}

export function saveStoredMaintenance(items: MaintenanceItem[]): boolean {
  if (!Array.isArray(items)) return false;

  try {
    // 1. LocalStorage
    localStore.set(STORAGE_KEYS.MAINTENANCE, items);

    // 2. Cache
    appCache.set(CACHE_MAINT_KEY, items);

    // 3. Cookies
    try {
      const compact = items.slice(0, 15).map((m) => ({
        id: m.id,
        title: m.title,
        system: m.system,
        interval: m.interval,
        nextDue: m.nextDue,
        status: m.status,
      }));
      const serialized = JSON.stringify(compact);
      if (serialized.length < 3500) {
        cookieStore.set(MAINTENANCE_COOKIE_KEY, serialized);
      }
    } catch {}

    // 4. IndexedDB
    idbSet(STORES.HOUSEHOLD_STATE, 'maintenance', items).catch(() => {});

    // 5. Broadcast window event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('homeops_maintenance_updated', {
          detail: { maintenance: items, count: items.length },
        })
      );
    }

    return true;
  } catch (err) {
    console.warn('[MaintenanceStore] Error saving maintenance items:', err);
    return false;
  }
}

export async function clearStoredMaintenance(): Promise<void> {
  localStore.remove(STORAGE_KEYS.MAINTENANCE);
  cookieStore.remove(MAINTENANCE_COOKIE_KEY);
  appCache.remove(CACHE_MAINT_KEY);
  await idbSet(STORES.HOUSEHOLD_STATE, 'maintenance', []);
}
