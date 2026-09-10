/**
 * HomeOps AI — Browser Storage Utility (IndexedDB + localStorage)
 * Adheres to strict security guidelines:
 * - NO server secrets or API keys stored client-side
 * - NO large structured state in cookies
 * - IndexedDB for structured application records & history
 * - localStorage for small configuration flags & cached profile
 * - Graceful fallback if storage APIs fail or quota is exceeded
 */

const DB_NAME = 'homeops_db';
const DB_VERSION = 2;

export const STORES = {
  PROFILE: 'profile',
  HOUSEHOLD_STATE: 'household_state',
  CONVERSATIONS: 'conversations',
  ACTIVITIES: 'activities',
} as const;

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'homeops_onboarding_completed',
  USER_PROFILE: 'homeops_profile',
  PREFERENCES: 'homeops_preferences',
} as const;

// Restricted key patterns that must NEVER be written to browser storage
const RESTRICTED_PATTERNS = [
  /GEMINI_API_KEY/i,
  /CASPIAN_API_KEY/i,
  /TELEGRAM_BOT_TOKEN/i,
  /AI_STUDIO_TOKEN/i,
  /PRIVATE_KEY/i,
];

export function sanitizeAndCheckSecurity(key: string, value: any): boolean {
  for (const pattern of RESTRICTED_PATTERNS) {
    if (pattern.test(key)) {
      console.warn(`[Security Alert] Attempted to store restricted key: ${key}`);
      return false;
    }
    if (typeof value === 'string' && pattern.test(value)) {
      console.warn(`[Security Alert] Value contains restricted pattern: ${pattern}`);
      return false;
    }
  }
  return true;
}

// --- IndexedDB Helper ---
let dbInstance: IDBDatabase | null = null;

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

async function getDB(): Promise<IDBDatabase | null> {
  if (!isIndexedDBAvailable()) return null;
  if (dbInstance) return dbInstance;

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.PROFILE)) {
          db.createObjectStore(STORES.PROFILE);
        }
        if (!db.objectStoreNames.contains(STORES.HOUSEHOLD_STATE)) {
          db.createObjectStore(STORES.HOUSEHOLD_STATE);
        }
        if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
          db.createObjectStore(STORES.CONVERSATIONS);
        }
        if (!db.objectStoreNames.contains(STORES.ACTIVITIES)) {
          db.createObjectStore(STORES.ACTIVITIES);
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        console.warn('[HomeOps Storage] IndexedDB open error, falling back:', event);
        resolve(null);
      };
    } catch (err) {
      console.warn('[HomeOps Storage] IndexedDB initialization failed, falling back:', err);
      resolve(null);
    }
  });
}

export async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  const db = await getDB();
  if (!db) {
    return localStore.get<T>(`idb_fallback_${storeName}_${key}`);
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => {
        console.warn(`[HomeOps Storage] idbGet failed for key: ${key}`);
        resolve(null);
      };
    } catch (err) {
      console.warn('[HomeOps Storage] Transaction error in idbGet:', err);
      resolve(null);
    }
  });
}

export async function idbSet<T>(storeName: string, key: string, value: T): Promise<boolean> {
  if (!sanitizeAndCheckSecurity(key, value)) {
    return false;
  }

  const db = await getDB();
  if (!db) {
    return localStore.set(`idb_fallback_${storeName}_${key}`, value);
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value, key);

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.warn(`[HomeOps Storage] idbSet error on ${key}:`, e);
        // Fallback to localStorage
        localStore.set(`idb_fallback_${storeName}_${key}`, value);
        resolve(true);
      };
    } catch (err) {
      console.warn('[HomeOps Storage] Transaction error in idbSet:', err);
      localStore.set(`idb_fallback_${storeName}_${key}`, value);
      resolve(true);
    }
  });
}

export async function idbDelete(storeName: string, key: string): Promise<boolean> {
  const db = await getDB();
  if (!db) {
    localStore.remove(`idb_fallback_${storeName}_${key}`);
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function idbClear(storeName: string): Promise<boolean> {
  const db = await getDB();
  if (!db) {
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

// --- localStorage Safe Wrapper ---
export const localStore = {
  get: <T>(key: string): T | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const val = window.localStorage.getItem(key);
      if (!val) return null;
      return JSON.parse(val) as T;
    } catch (e) {
      console.warn(`[HomeOps Storage] localStorage.get failed for ${key}:`, e);
      return null;
    }
  },

  set: <T>(key: string, value: T): boolean => {
    try {
      if (!sanitizeAndCheckSecurity(key, value)) return false;
      if (typeof window === 'undefined' || !window.localStorage) return false;
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[HomeOps Storage] localStorage.set failed for ${key}:`, e);
      return false;
    }
  },

  remove: (key: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clearAllHomeOps: (): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      Object.keys(window.localStorage).forEach((k) => {
        if (k.startsWith('homeops_') || k.startsWith('idb_fallback_')) {
          window.localStorage.removeItem(k);
        }
      });
      return true;
    } catch {
      return false;
    }
  },
};
