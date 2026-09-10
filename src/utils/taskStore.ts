/**
 * HomeOps AI — Browser Task Storage Layer
 * Persists tasks across browser LocalStorage, Cookies, Cache, and IndexedDB
 * exactly like user details, guaranteeing instant hydration and zero loss
 * when adding tasks or marking tasks as completed.
 */
import { TaskItem } from '../types';
import { INITIAL_TASKS } from '../data/mockData';
import {
  localStore,
  cookieStore,
  appCache,
  STORAGE_KEYS,
  idbGet,
  idbSet,
  STORES,
} from './storage';

const TASKS_COOKIE_KEY = 'homeops_tasks_data';
const TASKS_COUNT_COOKIE_KEY = 'homeops_tasks_count';
const CACHE_TASK_KEY = 'tasks';

/**
 * Synchronously retrieves stored tasks from the browser.
 * Checks localStorage first (fastest, full fidelity),
 * then falls back to cookie data, then runtime cache,
 * and defaults to INITIAL_TASKS if nothing is stored yet.
 */
export function getStoredTasks(): TaskItem[] {
  try {
    // 1. Primary: Browser LocalStorage (instant synchronous hydration)
    const localTasks = localStore.get<TaskItem[]>(STORAGE_KEYS.TASKS);
    if (Array.isArray(localTasks) && localTasks.length > 0) {
      // Warm up cache in memory
      appCache.set(CACHE_TASK_KEY, localTasks);
      return localTasks;
    }

    // 2. Secondary fallback: Browser Cookies
    const cookieData = cookieStore.get(TASKS_COOKIE_KEY);
    if (cookieData) {
      try {
        const parsed = JSON.parse(cookieData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Re-hydrate localStorage for subsequent instant reads
          localStore.set(STORAGE_KEYS.TASKS, parsed);
          appCache.set(CACHE_TASK_KEY, parsed);
          return parsed as TaskItem[];
        }
      } catch (err) {
        console.warn('[TaskStore] Failed to parse tasks cookie:', err);
      }
    }

    // 3. Tertiary fallback: In-Memory / Browser Cache
    const cachedTasks = appCache.get<TaskItem[]>(CACHE_TASK_KEY);
    if (Array.isArray(cachedTasks) && cachedTasks.length > 0) {
      localStore.set(STORAGE_KEYS.TASKS, cachedTasks);
      return cachedTasks;
    }
  } catch (err) {
    console.warn('[TaskStore] Error retrieving stored tasks:', err);
  }

  // Initial seed fallback
  return INITIAL_TASKS;
}

/**
 * Persists tasks immediately into browser LocalStorage, Cookies,
 * in-memory/browser Cache, and IndexedDB.
 */
export function saveStoredTasks(tasks: TaskItem[]): boolean {
  if (!Array.isArray(tasks)) return false;

  try {
    // 1. Persist to browser LocalStorage (synchronous, instant)
    localStore.set(STORAGE_KEYS.TASKS, tasks);

    // 2. Persist to in-memory & CacheStorage
    appCache.set(CACHE_TASK_KEY, tasks);

    // 3. Persist to browser Cookies
    // Store task count
    cookieStore.set(TASKS_COUNT_COOKIE_KEY, String(tasks.length));
    
    // Store compact task representation within cookie size limits (under 3.5KB)
    try {
      const compactTasks = tasks.slice(0, 20).map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.subtitle,
        priority: t.priority,
        category: t.category,
        dueDate: t.dueDate,
        completed: t.completed,
      }));
      const serialized = JSON.stringify(compactTasks);
      if (serialized.length < 3500) {
        cookieStore.set(TASKS_COOKIE_KEY, serialized);
      }
    } catch {
      // Cookie payload size safeguard
    }

    // 4. Asynchronously persist backup snapshot to IndexedDB
    idbSet(STORES.HOUSEHOLD_STATE, 'tasks_backup', tasks).catch(() => {});

    // 5. Broadcast change event across current window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('homeops_tasks_updated', {
          detail: { tasks, count: tasks.length },
        })
      );
    }

    return true;
  } catch (err) {
    console.warn('[TaskStore] Error saving tasks to storage:', err);
    return false;
  }
}

/**
 * Hydrates tasks from IndexedDB if localStorage was previously empty.
 */
export async function loadTasksFromIndexedDB(): Promise<TaskItem[] | null> {
  try {
    const idbTasks = await idbGet<TaskItem[]>(STORES.HOUSEHOLD_STATE, 'tasks_backup');
    if (Array.isArray(idbTasks) && idbTasks.length > 0) {
      saveStoredTasks(idbTasks);
      return idbTasks;
    }
  } catch (err) {
    console.warn('[TaskStore] Failed to load tasks from IndexedDB:', err);
  }
  return null;
}

/**
 * Clears stored tasks from browser LocalStorage, Cookies, Cache, and IndexedDB.
 */
export async function clearStoredTasks(): Promise<void> {
  localStore.remove(STORAGE_KEYS.TASKS);
  cookieStore.remove(TASKS_COOKIE_KEY);
  cookieStore.remove(TASKS_COUNT_COOKIE_KEY);
  appCache.remove(CACHE_TASK_KEY);
  await idbSet(STORES.HOUSEHOLD_STATE, 'tasks_backup', []);
}
